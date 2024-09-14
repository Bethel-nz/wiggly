import { Hono } from 'hono';
import Wiggly from '../lib/wiggly';
import { logger } from 'hono/logger';
const app = new Hono();
app.use('*', logger());
// Initialize Wiggly with base path
const wiggle = new Wiggly({
  app,
  useLogger: false,
  basePath: '/api/v1/',
  middlewareDir: './src/example/routes/middleware',
  routesDir: './src/example/routes',
  port: 5790,
  useNode: true,
});

wiggle.serve();
