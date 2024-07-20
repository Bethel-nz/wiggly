import { Hono } from 'hono';
declare class Wiggly {
    private app;
    private default_dir;
    private default_middleware_dir;
    private server;
    private port_number;
    private app_base_path;
    private server_is_node;
    private use_logger;
    constructor(default_args: {
        app?: Hono;
        logger: boolean;
        base_path?: string;
        middleware_dir?: string;
        routes_dir?: string;
    });
    private is_valid_file;
    private parse_route_segment;
    private is_middleware_file;
    private applyMiddleware;
    private applyGlobalMiddleware;
    private convertToHonoRoute;
    build_routes(directory?: string, base_path?: string): void;
    private handleDirectory;
    private handleFile;
    private processRouteFile;
    private applyRouteMethod;
    private clearRoutesAndMiddleware;
    private startServer;
    private restartServer;
    private startFileWatcher;
    serve({ port, is_node_server, }: {
        port: number;
        is_node_server: boolean;
    }): Promise<void>;
}
export default Wiggly;
