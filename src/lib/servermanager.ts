import { Hono } from 'hono';
import { serve as nodeServe, ServerType } from '@hono/node-server';

export class ServerManager {
  private app: Hono;
  private port: number;
  private isNode: boolean;
  private server: ServerType | null;

  constructor(app: Hono, port: number, isNode: boolean) {
    this.app = app;
    this.port = port;
    this.isNode = isNode;
    this.server = null;
  }

  start(): void {
    if (this.isNode) {
      this.server = nodeServe({
        fetch: this.app.fetch,
        port: this.port,
      });
    } else {
      const bunServer = Bun.serve({
        fetch: this.app.fetch,
        port: this.port,
      });
      this.server = bunServer as unknown as ServerType;
      console.log(`Bun server running on port ${this.port}`);
    }
  }

  stop(): void {
    if (this.server && this.isNode) {
      this.server.close(() => {
        console.log('Node server stopped.');
      });
    } else if (this.server && !this.isNode) {
      console.log('Bun server stopped.');
    }
  }
}
