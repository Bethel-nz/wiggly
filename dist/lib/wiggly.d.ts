import { Hono } from 'hono';
declare class Wiggly {
    private app;
    private default_dir;
    private default_middleware_dir;
    constructor(default_args: {
        app?: Hono;
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
    private startFileWatcher;
    serve(args: {
        port: number;
        is_node_server: boolean;
    }): Promise<void>;
}
export default Wiggly;
