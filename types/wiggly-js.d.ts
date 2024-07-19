// src/types/wiggly-js.d.ts
declare module 'wiggly-js' {
  import { Hono } from 'hono';

  // Define the Wiggly class and its methods
  export class Wiggly {
    constructor(default_args: {
      app?: Hono;
      base_path?: string;
      middleware_dir?: string;
      routes_dir?: string;
    });

    build_routes(directory?: string, base_path?: string): void;
    serve(
      port?: number,
      is_node_server?: boolean,
      node?: any,
      bun?: any
    ): Promise<void>;
  }
}
