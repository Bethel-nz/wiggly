import { serve as node_serve, createAdaptorServer } from '@hono/node-server';
import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';
import generate_types from '../utils/generate-types';
import { skip } from 'node:test';

class Wiggly {
  private app: Hono;
  private default_dir: string;
  private default_middleware_dir: string;
  private base_path: string;

  constructor(default_args: {
    base_path: string;
    middleware_dir?: string;
    routes_dir?: string;
    args?: Hono;
  }) {
    this.app = new Hono(default_args['args']).basePath(
      default_args['base_path']
    );
    this.base_path = default_args['base_path'];

    const currentDir = path.resolve(__dirname, '../../');
    this.default_middleware_dir = default_args.middleware_dir
      ? path.resolve(currentDir, default_args.middleware_dir)
      : '';
    this.default_dir = default_args.routes_dir
      ? path.resolve(currentDir, default_args.routes_dir)
      : '';
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

  middleware(directory: string = this.default_middleware_dir): void {
    const files = fs.readdirSync(directory);

    files.forEach((file) => {
      const file_path = path.join(directory, file);
      const stat = fs.statSync(file_path);

      if (stat.isDirectory()) {
        this.middleware(file_path);
      } else if (
        this.is_valid_file(file_path) &&
        this.is_middleware_file(file)
      ) {
        const middleware = require(file_path).default;
        const route_path = path.basename(path.dirname(file_path));

        if (typeof middleware._ === 'function') {
          console.log(middleware._);
          this.app.use(`/${route_path}`, middleware._);
        }
      }
    });
  }
  private applyMiddleware(directory: string, base_path: string = '/'): void {
    const middlewarePath = path.join(directory, '_middleware.ts');
    if (fs.existsSync(middlewarePath) && this.is_valid_file(middlewarePath)) {
      const middleware = require(middlewarePath).default._;
      if (typeof middleware === 'function') {
        this.app.use(base_path, middleware);
      }
    }
  }

  private convertToHonoRoute(file_path: string, base_path: string): string {
    const route_name = path.basename(file_path, path.extname(file_path));
    if (route_name.startsWith('_')) return '';
    const isIndexFile = route_name.startsWith('index');

    const finalRouteName = isIndexFile
      ? path.basename(path.dirname(file_path))
      : route_name;

    const route_path = finalRouteName.match(/\[\w+\]/)
      ? `${base_path}/${finalRouteName}`
      : base_path;

    return route_path.replace(/\[(\.\.\.)?(\w+)\]/g, (_, spread, param) => {
      return spread ? `:${param}*` : `:${param}`;
    });
  }
  routes(directory: string = this.default_dir, base_path: string = ''): void {
    const files = fs.readdirSync(directory);
    files.forEach((file) => {
      const file_path = path.join(directory, file);
      const stat = fs.statSync(file_path);

      if (stat.isDirectory()) {
        const segment = this.parse_route_segment(file);
        this.routes(file_path, `/${segment}`);
      } else if (this.is_valid_file(file_path)) {
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
      console.log(`Server Running On http://localhost:${port}`);
    } catch (error) {
      console.error('error');
    }
  }
}

export default Wiggly;
//				^?
