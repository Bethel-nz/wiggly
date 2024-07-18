import { serve as node_serve } from '@hono/node-server';
import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { serve as bun_serve } from 'bun';
/**
 * The `Wiggly` class is a file-based routing system for the Hono.js framework.
 * It dynamically loads route handlers and middleware from specified directories and applies them to the Hono application instance.
 * @class Wiggly
 */
class Wiggly {
    app;
    default_dir;
    default_middleware_dir;
    /**
     * Creates an instance of the `Wiggly` class.
     * @param default_args - Configuration object for initializing the `Wiggly` instance.
     * @param default_args.app - Optional Hono application instance to use. If not provided, a new instance will be created.
     * @param default_args.base_path - Optional base path to set for the Hono application.
     * @param default_args.middleware_dir - Optional directory path for middleware files.
     * @param default_args.routes_dir - Optional directory path for route files.
     */
    constructor(default_args) {
        this.app = default_args.app
            ? default_args.app
            : new Hono().basePath(default_args.base_path);
        const currentDir = process.cwd();
        this.default_middleware_dir = default_args.middleware_dir
            ? path.resolve(currentDir, default_args.middleware_dir)
            : `${process.cwd()}/routes/middleware`;
        this.default_dir = default_args.routes_dir
            ? path.resolve(currentDir, default_args.routes_dir)
            : `${process.cwd()}/routes`;
        this.applyGlobalMiddleware();
    }
    /**
     * Checks if a given file path has a valid extension (.js or .ts).
     * @param file_path - The path of the file to check.
     * @returns `true` if the file has a valid extension, `false` otherwise.
     */
    is_valid_file(file_path) {
        return ['.js', '.ts'].includes(path.extname(file_path));
    }
    /**
     * Parses a route segment from a file or directory name.
     * Converts segments enclosed in square brackets to a parameterized format (e.g., `[id]` to `:id`).
     * @param segment - The route segment to parse.
     * @returns The parsed route segment.
     */
    parse_route_segment(segment) {
        if (segment.startsWith('[') && segment.endsWith(']')) {
            return `:${segment.slice(1, -1)}`;
        }
        return segment;
    }
    /**
     * Checks if a given file name is a middleware file based on its name.
     * @param file_name - The name of the file to check.
     * @returns `true` if the file is a middleware file, `false` otherwise.
     */
    is_middleware_file(file_name) {
        return (file_name.startsWith('_middleware') || file_name.startsWith('_index'));
    }
    /**
     * Applies middleware to the specified directory and path.
     * @param directory - The directory containing middleware files.
     * @param basePath - The base path for the middleware application.
     */
    applyMiddleware(directory, basePath = '/') {
        const middlewareFiles = [
            path.join(directory, '_middleware.ts'),
            path.join(directory, '_index.ts'),
        ];
        middlewareFiles.forEach((filePath) => {
            if (fs.existsSync(filePath) &&
                this.is_valid_file(filePath) &&
                fs.statSync(filePath).size > 0) {
                const middleware = require(filePath).default._;
                if (typeof middleware === 'function') {
                    this.app.use(`/${path.relative(this.default_dir, directory)}/*`, middleware);
                }
            }
        });
    }
    /**
     * Applies global middleware functions from files in the default middleware directory.
     * Middleware files must be named `_middleware.ts` or `_index.ts`.
     */
    applyGlobalMiddleware() {
        if (fs.existsSync(this.default_middleware_dir)) {
            fs.readdirSync(this.default_middleware_dir).forEach((file) => {
                const filePath = path.join(this.default_middleware_dir, file);
                if (this.is_valid_file(filePath) &&
                    this.is_middleware_file(file) &&
                    fs.statSync(filePath).size > 0) {
                    const middleware = require(filePath).default._;
                    if (typeof middleware === 'function') {
                        this.app.use('*', middleware);
                    }
                }
            });
        }
    }
    /**
     * Converts a file path to a Hono route path.
     * @param filePath - The path of the file to convert.
     * @returns The Hono route path corresponding to the file.
     */
    convertToHonoRoute(filePath) {
        const routeName = path.basename(filePath, path.extname(filePath));
        if (routeName.startsWith('_'))
            return '';
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
        return routePath.replace(/\[(\w+)\]/g, ':$1');
    }
    /**
     * Builds routes based on files in the specified directory.
     * Handles both directories and individual files, applying middleware and route handlers.
     * @param directory - The directory to build routes from.
     * @param base_path - Optional base path to prepend to all routes.
     */
    build_routes(directory = this.default_dir, base_path = '') {
        if (!fs.existsSync(directory)) {
            console.log(`Directory "${directory}" does not exist. Please specify a valid routes directory in the Wiggly configuration or create a "/routes" or "/src/routes" folder in your root directory.`);
            return;
        }
        const files = fs.readdirSync(directory);
        files.forEach((file) => {
            const file_path = path.join(directory, file);
            const stat = fs.statSync(file_path);
            if (stat.isDirectory()) {
                this.handleDirectory(file_path, base_path);
            }
            else if (this.is_valid_file(file_path) && stat.size > 0) {
                this.handleFile(file_path, directory);
            }
        });
    }
    /**
     * Handles route directories, including nested directories and index files.
     * @param dirPath - The path of the directory to handle.
     * @param basePath - The base path to prepend to routes within the directory.
     */
    handleDirectory(dirPath, basePath) {
        const segment = this.parse_route_segment(path.basename(dirPath));
        this.build_routes(dirPath, `${basePath}/${segment}`);
        const indexPath = path.join(dirPath, 'index.ts');
        if (fs.existsSync(indexPath) && this.is_valid_file(indexPath)) {
            this.processRouteFile(indexPath, dirPath);
        }
    }
    /**
     * Handles individual route files.
     * @param filePath - The path of the file to handle.
     * @param baseDir - The base directory path to apply middleware.
     */
    handleFile(filePath, baseDir) {
        this.processRouteFile(filePath, baseDir);
    }
    /**
     * Processes a route file to apply middleware and route handlers.
     * @param filePath - The path of the route file.
     * @param baseDir - The base directory path to apply middleware.
     */
    processRouteFile(filePath, baseDir) {
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
    /**
     * Applies HTTP route methods to the Hono app.
     * @param method - The HTTP method (GET, POST, etc.).
     * @param routePath - The path for the route.
     * @param handler - The handler function for the route.
     */
    applyRouteMethod(method, routePath, handler) {
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
    /**
     * Starts a file watcher to monitor changes in the middleware and routes directories.
     * The watcher listens for file additions, modifications, and deletions.
     * When changes are detected, routes are rebuilt, and global middleware is reapplied without reinitializing the Hono application.
     */
    startFileWatcher() {
        const watcher = chokidar.watch([
            this.default_middleware_dir,
            this.default_dir,
        ]);
        watcher.on('all', (event, path) => {
            if (['add', 'change', 'unlink'].includes(event)) {
                this.applyGlobalMiddleware(); // Reapply global middleware
                this.build_routes(); // Rebuild routes
            }
        });
    }
    /**
     * Starts the server and listens for incoming HTTP requests.
     * Depending on the `is_node_server` flag, it uses either the Node.js `serve` function or the Bun `serve` function to start the server on the specified port.
     * Initializes a file watcher to monitor changes in the middleware and routes directories.
     *
     * @param port - The port number on which the server will listen. Defaults to 8080.
     * @param is_node_server - A boolean flag indicating whether to use the Node.js server (`true`) or Bun server (`false`). Defaults to `true`.
     * @param node - Optional arguments to pass to the Node.js `serve` function. These arguments are used to customize the behavior of the Node.js server.
     * @param bun - Optional arguments to pass to the Bun `serve` function. These arguments are used to customize the behavior of the Bun server.
     *
     * @returns A promise that resolves when the server starts successfully.
     *
     * @throws Will throw an error if the server fails to start.
     */
    async serve(port = 8080, is_node_server = true, node, bun) {
        try {
            this.applyGlobalMiddleware();
            this.build_routes();
            if (is_node_server) {
                await node_serve({
                    fetch: this.app.fetch,
                    port,
                    ...node,
                });
            }
            else {
                await bun_serve({
                    fetch: this.app.fetch,
                    port,
                    ...bun,
                });
            }
            this.startFileWatcher(); // Start file watcher after server starts
            console.log(`Server Running On http://localhost:${port}`);
        }
        catch (error) {
            console.error(error);
        }
    }
}
export default Wiggly;
