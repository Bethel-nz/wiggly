import { Hono } from 'hono';
/**
 * Wiggly - A file-based routing framework based on Hono.js
 *
 * @example
 * const wiggly = new Wiggly({
 *   port: 3000, // Optional, defaults to 8080 or your environment's PORT
 *   app: new Hono(), // Optional, defaults to built-in Hono app or you can pass your own Hono instance
 *   basePath: '/api', // Optional, defaults to '/api/v1'
 *   routesDir: './src/routes', // Optional, defaults to './routes'
 *   middlewareDir: './src/middleware', // Optional, defaults to './middleware'
 *   useLogger: true //  defaults to false
 *   useNode: true // defaults to false or it uses bun
 * });
 * wiggly.serve({ port: 3000 });
 */
declare class Wiggly {
    private app;
    private default_dir;
    private default_middleware_dir;
    private serverManager;
    private fileWatcher;
    private middlewareHandler;
    private port_number;
    private app_base_path;
    private server_is_node;
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
    });
    /**
     * Validates if a file has a supported extension.
     * @param file_path The path of the file to validate.
     * @returns True if valid, else false.
     */
    private is_valid_file;
    /**
     * Determines if a file is a middleware file.
     * @param file_name The name of the file.
     * @param directory The directory of the file.
     * @returns True if it's a middleware file, else false.
     */
    private is_middleware_file;
    /**
     * Converts a file path to a Hono-compatible route.
     * @param filePath The file path to convert.
     * @returns The Hono route path.
     */
    private convertToHonoRoute;
    /**
     * Builds routes by scanning the specified directory.
     * @param directory The directory to scan.
     * @param base_path The base path for the routes.
     */
    private build_routes;
    private handleDirectory;
    private handleFile;
    private processRouteFile;
    private applyRouteMethod;
    private clearRoutesAndMiddleware;
    private restartServer;
    /**
     * Starts the server with the specified configuration.
     * @param config Server configuration.
     */
    serve(): Promise<void>;
}
export default Wiggly;
