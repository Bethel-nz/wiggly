import { Hono } from 'hono';
export declare class MiddlewareHandler {
    private app;
    private useLogger;
    private middlewareDir;
    private basePath;
    constructor(app: Hono, useLogger: boolean, middlewareDir: string, basePath: string);
    applyMiddleware(directory: string, basePath?: string): void;
    applyGlobalMiddleware(): void;
    reset(): void;
    private isValidFile;
    private isMiddlewareFile;
}
