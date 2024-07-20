import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { serve as node_serve } from '@hono/node-server';
import { Hono } from 'hono';

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
    this.app = default_args.app
      ? default_args.app
      : new Hono().basePath(default_args.base_path!);
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
      return `:${segment.slice(1, -1)}`;
    }
    return segment;
  }

  private is_middleware_file(file_name: string, directory: string): boolean {
    return (
      (file_name.includes('_middleware') ||
        file_name.includes('_index') ||
        file_name.startsWith('_')) &&
      directory === this.default_middleware_dir
    );
  }

  private applyMiddleware(directory: string, basePath: string = '/'): void {
    const middlewareFiles = [
      path.join(directory, '_middleware.ts'),
      path.join(directory, '_index.ts'),
    ];

    middlewareFiles.forEach((filePath) => {
      if (
        fs.existsSync(filePath) &&
        this.is_valid_file(filePath) &&
        fs.statSync(filePath).size > 0
      ) {
        const middleware = require(filePath).default._;
        if (typeof middleware === 'function') {
          this.app.use(`${basePath}/*`, middleware);
        }
      }
    });
  }

  private applyGlobalMiddleware(): void {
    if (fs.existsSync(this.default_middleware_dir)) {
      fs.readdirSync(this.default_middleware_dir).forEach((file) => {
        const filePath = path.join(this.default_middleware_dir, file);
        if (
          this.is_valid_file(filePath) &&
          this.is_middleware_file(file, this.default_middleware_dir) &&
          fs.statSync(filePath).size > 0
        ) {
          const middleware = require(filePath).default._;
          if (typeof middleware === 'function') {
            this.app.use('*', middleware);
          }
        }
      });
    }
  }

  private convertToHonoRoute(filePath: string): string {
    const routeName = path.basename(filePath, path.extname(filePath));
    if (routeName.startsWith('_')) return '';

    const isIndexFile = routeName === 'index';
    const relativePath = path.relative(this.default_dir, filePath);
    const dirPath = path.dirname(relativePath);
    const pathSegments = dirPath
      .split(path.sep)
      .map(this.parse_route_segment)
      .filter(Boolean);

    const finalRouteName = isIndexFile ? '' : `/${routeName}`;
    const routePath = `/${[...pathSegments, finalRouteName].join('/')}`
      .replace(/\/+/g, '/')
      .replace(/\/$/, '');

    // Handle root index file
    if (routePath === '/' || routePath === '/.' || routePath === '') return '/';

    return routePath.replace(/\[(\w+)\]/g, ':$1');
  }

  build_routes(
    directory: string = this.default_dir,
    base_path: string = ''
  ): void {
    if (!fs.existsSync(directory)) {
      console.log(`Directory "${directory}" does not exist.`);
      return;
    }

    const files = fs.readdirSync(directory);
    files.forEach((file) => {
      const file_path = path.join(directory, file);
      const stat = fs.statSync(file_path);

      if (stat.isDirectory()) {
        this.handleDirectory(file_path, base_path);
      } else if (this.is_valid_file(file_path) && stat.size > 0) {
        this.handleFile(file_path, directory);
      }
    });
  }

  private handleDirectory(dirPath: string, basePath: string): void {
    const segment = this.parse_route_segment(path.basename(dirPath));
    this.build_routes(dirPath, `${basePath}/${segment}`);

    const indexPath = path.join(dirPath, 'index.ts');
    if (fs.existsSync(indexPath) && this.is_valid_file(indexPath)) {
      this.processRouteFile(indexPath, basePath);
    }
  }

  private handleFile(filePath: string, baseDir: string): void {
    this.processRouteFile(filePath, baseDir);
  }

  private processRouteFile(filePath: string, baseDir: string): void {
    const route = require(filePath).default;
    const route_path = this.convertToHonoRoute(filePath);
    this.applyMiddleware(baseDir, route_path);

    Object.keys(route).forEach((method) => {
      const handler = route[method];
      if (typeof handler === 'function') {
        this.applyRouteMethod(method, route_path, handler);
      }
    });
  }

  private applyRouteMethod(
    method: string,
    routePath: string,
    handler: any
  ): void {
    switch (method.toLowerCase()) {
      case 'get':
        this.app.get(routePath, handler);
        break;
      case 'post':
        this.app.post(routePath, handler);
        break;
      case 'put':
        this.app.put(routePath, handler);
        break;
      case 'delete':
        this.app.delete(routePath, handler);
        break;
      case 'patch':
        this.app.patch(routePath, handler);
        break;
      case '_':
        this.app.use(routePath, handler);
        break;
      default:
        console.warn(`Unknown method ${method}`);
    }
  }

  private startFileWatcher(): void {
    const watcher = chokidar.watch([
      this.default_middleware_dir,
      this.default_dir,
    ]);
    watcher.on('all', (event, path) => {
      if (['add', 'change', 'unlink'].includes(event)) {
        this.applyGlobalMiddleware();
        this.build_routes();
      }
    });
  }

  async serve(args: { port: number; is_node_server: boolean }): Promise<void> {
    try {
      this.applyGlobalMiddleware();
      this.build_routes();

      if (args.is_node_server) {
        await node_serve({
          fetch: this.app.fetch,
          port: args.port,
        });
      } else {
        await Bun.serve({
          fetch: this.app.fetch,
          port: args.port,
        });
      }

      this.startFileWatcher();

      console.log(`Server Running On http://localhost:${args.port}`);
    } catch (error) {
      console.error(error);
    }
  }
}

export default Wiggly;
