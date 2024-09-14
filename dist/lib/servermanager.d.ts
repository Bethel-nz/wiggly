import { Hono } from 'hono';
export declare class ServerManager {
    private app;
    private port;
    private isNode;
    private server;
    constructor(app: Hono, port: number, isNode: boolean);
    start(): void;
    stop(): void;
}
