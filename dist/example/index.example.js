import { Hono } from 'hono';
import Wiggly from '../lib/wiggly';
import { logger } from 'hono/logger';
const app = new Hono();
app.use('*', logger());
// Initialize Wiggly with base path
const wiggle = new Wiggly({
    app,
    logger: false,
    base_path: '/api/v1/',
    middleware_dir: './src/example/routes/middleware',
    routes_dir: './src/example/routes',
});
wiggle.build_routes();
wiggle.serve({
    port: 5790,
    is_node_server: true,
});
