import { serve as node_serve } from '@hono/node-server';
import { Hono } from 'hono';
import { serve as bun_serve } from 'bun';
/**
 * The `Wiggly` class is a file-based routing system for the Hono.js framework.
 * It dynamically loads route handlers and middleware from specified directories and applies them to the Hono application instance.
 * @class Wiggly
 */
declare class Wiggly {
    private app;
    private default_dir;
    private default_middleware_dir;
    /**
     * Creates an instance of the `Wiggly` class.
     * @param default_args - Configuration object for initializing the `Wiggly` instance.
     * @param default_args.app - Optional Hono application instance to use. If not provided, a new instance will be created.
     * @param default_args.base_path - Optional base path to set for the Hono application.
     * @param default_args.middleware_dir - Optional directory path for middleware files.
     * @param default_args.routes_dir - Optional directory path for route files.
     */
    constructor(default_args: {
        app?: Hono;
        base_path?: string;
        middleware_dir?: string;
        routes_dir?: string;
    });
    /**
     * Checks if a given file path has a valid extension (.js or .ts).
     * @param file_path - The path of the file to check.
     * @returns `true` if the file has a valid extension, `false` otherwise.
     */
    private is_valid_file;
    /**
     * Parses a route segment from a file or directory name.
     * Converts segments enclosed in square brackets to a parameterized format (e.g., `[id]` to `:id`).
     * @param segment - The route segment to parse.
     * @returns The parsed route segment.
     */
    private parse_route_segment;
    /**
     * Checks if a given file name is a middleware file based on its name.
     * @param file_name - The name of the file to check.
     * @returns `true` if the file is a middleware file, `false` otherwise.
     */
    private is_middleware_file;
    /**
     * Applies middleware to the specified directory and path.
     * @param directory - The directory containing middleware files.
     * @param basePath - The base path for the middleware application.
     */
    private applyMiddleware;
    /**
     * Applies global middleware functions from files in the default middleware directory.
     * Middleware files must be named `_middleware.ts` or `_index.ts`.
     */
    private applyGlobalMiddleware;
    /**
     * Converts a file path to a Hono route path.
     * @param filePath - The path of the file to convert.
     * @returns The Hono route path corresponding to the file.
     */
    private convertToHonoRoute;
    /**
     * Builds routes based on files in the specified directory.
     * Handles both directories and individual files, applying middleware and route handlers.
     * @param directory - The directory to build routes from.
     * @param base_path - Optional base path to prepend to all routes.
     */
    build_routes(directory?: string, base_path?: string): void;
    /**
     * Handles route directories, including nested directories and index files.
     * @param dirPath - The path of the directory to handle.
     * @param basePath - The base path to prepend to routes within the directory.
     */
    private handleDirectory;
    /**
     * Handles individual route files.
     * @param filePath - The path of the file to handle.
     * @param baseDir - The base directory path to apply middleware.
     */
    private handleFile;
    /**
     * Processes a route file to apply middleware and route handlers.
     * @param filePath - The path of the route file.
     * @param baseDir - The base directory path to apply middleware.
     */
    private processRouteFile;
    /**
     * Applies HTTP route methods to the Hono app.
     * @param method - The HTTP method (GET, POST, etc.).
     * @param routePath - The path for the route.
     * @param handler - The handler function for the route.
     */
    private applyRouteMethod;
    /**
     * Starts a file watcher to monitor changes in the middleware and routes directories.
     * The watcher listens for file additions, modifications, and deletions.
     * When changes are detected, routes are rebuilt, and global middleware is reapplied without reinitializing the Hono application.
     */
    private startFileWatcher;
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
    serve(args: {
        port: number;
        is_node_server: boolean;
        node?: Parameters<typeof node_serve>;
        bun?: Parameters<typeof bun_serve>;
    }): Promise<void>;
}
export default Wiggly;
