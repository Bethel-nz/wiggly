import { serve as node_serve } from '@hono/node-server';
import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';
import generate_types from '../utils/generate-types';
import chokidar from 'chokidar';
class Wiggly {
  private app: Hono;
  private default_dir: string;
  private default_middleware_dir: string;

  constructor(default_args: {
    app?: Hono;
    base_path?: string;
    middleware_dir?: string;
    routes_dir?: string;
  }) {
    this.app = default_args['app']
      ? default_args['app']
      : new Hono().basePath(default_args['base_path']!);

    const currentDir = process.cwd();
    this.default_middleware_dir = default_args.middleware_dir
      ? path.resolve(currentDir, default_args.middleware_dir)
      : `${process.cwd()}/routes/middleware`;
    this.default_dir = default_args.routes_dir
      ? path.resolve(currentDir, default_args.routes_dir)
      : `${process.cwd()}/routes`;
    this.applyGlobalMiddleware();
  }

  private is_valid_file(file_path: string): boolean {
    return ['.js', '.ts'].includes(path.extname(file_path));
  }

  private parse_route_segment(segment: string): string {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      if (segment.startsWith('[...') && segment.endsWith(']')) {
        return `:${segment.slice(4, -1)}*`;
      } else {
        return `:${segment.slice(1, -1)}`;
      }
    }
    return segment;
  }
  private is_middleware_file(file_name: string): boolean {
    return (
      file_name.startsWith('_middleware') || file_name.startsWith('_index')
    );
  }

  private applyMiddleware(directory: string, base_path: string = '/'): void {
    const middlewarePath = path.join(directory, '_middleware.ts');
    const indexMiddlewarePath = path.join(directory, '_index.ts');

    [middlewarePath, indexMiddlewarePath].forEach((middlewareFilePath) => {
      if (
        fs.existsSync(middlewareFilePath) &&
        this.is_valid_file(middlewareFilePath) &&
        fs.statSync(middlewareFilePath).size > 0 // Check if file is not empty
      ) {
        const middleware = require(middlewareFilePath).default._;
        if (typeof middleware === 'function') {
          this.app.use(base_path, middleware);
        }
      } else {
        return;
      }
    });
  }
  private applyGlobalMiddleware(): void {
    if (
      this.default_middleware_dir &&
      fs.existsSync(this.default_middleware_dir)
    ) {
      const files = fs.readdirSync(this.default_middleware_dir);

      files.forEach((file) => {
        const file_path = path.join(this.default_middleware_dir, file);
        if (
          this.is_valid_file(file_path) &&
          this.is_middleware_file(file) &&
          fs.statSync(file_path).size > 0 // Check if file is not empty
        ) {
          const middleware = require(file_path).default._;
          if (typeof middleware === 'function') {
            this.app.use('*', middleware);
          }
        }
      });
    } else {
      return;
    }
  }

  private convertToHonoRoute(file_path: string, base_path: string): string {
    const route_name = path.basename(file_path, path.extname(file_path));
    if (route_name.startsWith('_')) return '';
    const isIndexFile = route_name.startsWith('index');

    const relativePath = path.relative(this.default_dir, file_path);
    const dirPath = path.dirname(relativePath);
    const pathSegments = dirPath.split(path.sep).map(this.parse_route_segment);

    const finalRouteName = isIndexFile ? '' : `/${route_name}`;
    const routePath = pathSegments.join('/') + finalRouteName;

    return routePath.replace(/\[(\.\.\.)?(\w+)\]/g, (_, spread, param) => {
      return spread ? `:${param}*` : `:${param}`;
    });
  }
  build_routes(
    directory: string = this.default_dir,
    base_path: string = ''
  ): void {
    if (!fs.existsSync(directory)) {
      console.log(
        `Directory "${directory}" does not exist. Please specify a valid routes directory in the Wiggly configuration. or make a "/routes" or "/src/routes" in your root folder`
      );
      return;
    }
    const files = fs.readdirSync(directory);
    files.forEach((file) => {
      const file_path = path.join(directory, file);
      const stat = fs.statSync(file_path);

      if (stat.isDirectory()) {
        const segment = this.parse_route_segment(file);
        this.build_routes(file_path, `/${segment}`);
      } else if (this.is_valid_file(file_path) && stat.size > 0) {
        const route = require(file_path).default;
        const base_name = `/${path.basename(path.dirname(file_path))}`;

        const route_path = this.convertToHonoRoute(file_path, base_name);
        this.applyMiddleware(directory, base_name);

        Object.keys(route).forEach((method) => {
          const handler = route[method];
          if (typeof handler === 'function') {
            switch (method.toLowerCase()) {
              case 'get':
                this.app.get(route_path!, handler);
                break;
              case 'post':
                this.app.post(route_path!, handler);
                break;
              case 'put':
                this.app.put(route_path!, handler);
                break;
              case 'delete':
                this.app.delete(route_path!, handler);
                break;
              case 'patch':
                this.app.patch(route_path!, handler);
                break;
              case '_':
                this.app.use(route_path!, handler);
                break;
              default:
                console.warn(`Unknown method ${method} in file ${file_path}`);
            }
          }
        });
      } else return;
    });
  }

  private startFileWatcher(): void {
    const watcher = chokidar.watch([
      this.default_middleware_dir,
      this.default_dir,
    ]);
    watcher.on('all', (event, path) => {
      if (['add', 'change', 'unlink'].includes(event)) {
        this.app = new Hono(this.app);
        this.applyGlobalMiddleware();
        this.build_routes();
      }
    });
  }

  async serve(
    port: number = 8080,
    args?: Parameters<typeof node_serve>
  ): Promise<void> {
    try {
      await node_serve({
        fetch: this.app.fetch,
        port,
        ...args,
      });
      this.startFileWatcher();

      console.log(`Server Running On http://localhost:${port}`);
    } catch (error) {
      console.error('error');
    }
  }
}

export default Wiggly;
//				^?
