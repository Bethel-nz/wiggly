import { serve as nodeServe } from '@hono/node-server';
export class ServerManager {
    app;
    port;
    isNode;
    server;
    constructor(app, port, isNode) {
        this.app = app;
        this.port = port;
        this.isNode = isNode;
        this.server = null;
    }
    start() {
        if (this.isNode) {
            this.server = nodeServe({
                fetch: this.app.fetch,
                port: this.port,
            });
        }
        else {
            const bunServer = Bun.serve({
                fetch: this.app.fetch,
                port: this.port,
            });
            this.server = bunServer;
            console.log(`Bun server running on port ${this.port}`);
        }
    }
    stop() {
        if (this.server && this.isNode) {
            this.server.close(() => {
                console.log('Node server stopped.');
            });
        }
        else if (this.server && !this.isNode) {
            console.log('Bun server stopped.');
        }
    }
}
