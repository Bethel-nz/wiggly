import fs from 'fs';
import path from 'path';
import { Hono } from 'hono';

import { RouteParser } from './RouteParser';
import { ServerManager } from './servermanager';
import { FileWatcher } from './filewatcher';
import { MiddlewareHandler } from './middlewarehandler';
import { ErrorHandler } from './errorHandler';

/**
 * Wiggly - A file-based routing framework based on Hono.js
 *
 * @example
 * const wiggly = new Wiggly({
 *   port: 3000, // Optional, defaults to 8080 or your environment's PORT
 *   app: new Hono(), // Optional, defaults to built-in Hono app or you can pass your own Hono instance
 *   basePath: '/api', // Optional, defaults to '/api/'
 *   routesDir: './src/routes', // Optional, defaults to './routes'
 *   middlewareDir: './src/middleware', // Optional, defaults to './middleware'
 *   useLogger: true //  defaults to false
 *   useNode: true // defaults to false or it uses bun
 * });
 * wiggly.serve({ port: 3000 });
 */

class Wiggly {
  private app: Hono;
  private default_dir: string;
  private default_middleware_dir: string;
  private serverManager: ServerManager;
  private fileWatcher: FileWatcher;
  private middlewareHandler: MiddlewareHandler;
  private port_number: number;
  private app_base_path: string;
  private server_is_node: boolean;
  private useLog: boolean;

  /**
   * Initializes a new instance of the Wiggly class.
   * @param default_args Configuration arguments.
   */
  constructor(default_args: {
    app?: Hono;
    useLogger: boolean;
    basePath?: string;
    middlewareDir?: string;
    routesDir?: string;
    port: number;
    useNode: boolean;
  }) {
    this.useLog = default_args.useLogger;
    this.port_number =
      default_args.port || parseInt(process.env.PORT || '8080', 10);
    this.server_is_node = default_args.useNode;
    this.app_base_path = default_args.basePath || '/api/';
    this.app = default_args.app
      ? default_args.app.basePath(this.app_base_path)
      : new Hono().basePath(this.app_base_path);
    const currentDir = process.cwd();
    this.default_middleware_dir = default_args.middlewareDir
      ? path.resolve(currentDir, default_args.middlewareDir)
      : `${currentDir}/routes/middleware`;
    this.default_dir = default_args.routesDir
      ? path.resolve(currentDir, default_args.routesDir)
      : `${currentDir}/routes`;

    this.fileWatcher = new FileWatcher(
      [this.default_middleware_dir, this.default_dir],
      () => {
        this.clearRoutesAndMiddleware();
        this.restartServer();
      }
    );

    // Apply global middleware once
    this.middlewareHandler = new MiddlewareHandler(
      this.app,
      default_args.useLogger,
      this.default_middleware_dir,
      this.app_base_path
    );
    this.serverManager = new ServerManager(
      this.app,
      this.port_number,
      this.server_is_node
    );

    this.middlewareHandler.applyGlobalMiddleware();
  }

  /**
   * Validates if a file has a supported extension.
   * @param file_path The path of the file to validate.
   * @returns True if valid, else false.
   */
  private is_valid_file(file_path: string): boolean {
    return ['.js', '.ts'].includes(path.extname(file_path));
  }

  /**
   * Determines if a file is a middleware file.
   * @param file_name The name of the file.
   * @param directory The directory of the file.
   * @returns True if it's a middleware file, else false.
   */
  private is_middleware_file(file_name: string, directory: string): boolean {
    return (
      (file_name.includes('_middleware') ||
        file_name.includes('_index') ||
        file_name.startsWith('_')) &&
      directory === this.default_middleware_dir
    );
  }

  /**
   * Converts a file path to a Hono-compatible route.
   * @param filePath The file path to convert.
   * @returns The Hono route path.
   */
  private convertToHonoRoute(filePath: string): string {
    const routeName = path.basename(filePath, path.extname(filePath));
    if (routeName.startsWith('_')) return '';

    const isIndexFile = routeName === 'index';
    const relativePath = path.relative(this.default_dir, filePath);
    const dirPath = path.dirname(relativePath);
    const pathSegments = dirPath
      .split(path.sep)
      .map(RouteParser.parseSegment)
      .filter(Boolean);

    const finalRouteName = isIndexFile ? '' : `/${routeName}`;
    const routePath = `/${[...pathSegments, finalRouteName].join('/')}`
      .replace(/\/+/g, '/')
      .replace(/\/$/, '');

    // Handle root index file
    if (routePath === '/' || routePath === '/.' || routePath === '') return '/';

    return routePath.replace(/\[(\w+)\]/g, ':$1');
  }

  /**
   * Builds routes by scanning the specified directory.
   * @param directory The directory to scan.
   * @param base_path The base path for the routes.
   */
  private build_routes(
    directory: string = this.default_dir,
    base_path: string = ''
  ): void {
    if (directory.includes('dist')) return;
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
    const segment = RouteParser.parseSegment(path.basename(dirPath));
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
    this.middlewareHandler.applyMiddleware(baseDir, route_path);

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
        console.log(`Unknown method ${method}`);
    }
  }

  private clearRoutesAndMiddleware(): void {
    this.app = new Hono().basePath(this.app_base_path);
    this.middlewareHandler.reset();
  }

  private restartServer(): void {
    this.serverManager.stop();
    this.middlewareHandler.applyGlobalMiddleware();
    this.build_routes();
    this.serverManager.start();
  }

  private generateServerInfo(): string {
    const routeCount = this.app.routes.length;
    const nodeOrBun = this.server_is_node ? 'Node.js' : 'Bun';
    const loggerStatus = this.useLog ? 'enabled' : 'disabled';

    return `
    🚀 Wiggly v1.1 is up and running!
    🌐 Server: ${nodeOrBun}
    🔗 Base URL: http://localhost:${this.port_number}${this.app_base_path}
    🛣️  Routes: ${routeCount} route(s) registered
    📁 Routes Directory: ${this.default_dir}
    📁 Middleware Directory: ${this.default_middleware_dir}
    📝 Logging: ${loggerStatus}
    
    Happy coding! 🎉
    `;
  }

  /**
   * Starts the server with the specified configuration.
   * @param config Server configuration.
   */
  async serve(): Promise<void> {
    try {
      this.port_number = this.port_number;
      this.server_is_node = this.server_is_node;
      this.build_routes();

      this.fileWatcher.start();
      this.serverManager = new ServerManager(
        this.app,
        this.port_number,
        this.server_is_node
      );
      this.serverManager.start();

      console.log(this.generateServerInfo());
    } catch (error) {
      ErrorHandler.handleError(error as Error, 'Server Error');
    }
  }
}

export default Wiggly;
