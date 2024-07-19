import { Hono } from 'hono';
import Wiggly from '../lib/wiggly';

// Initialize Wiggly with base path
const wiggle = new Wiggly({
  base_path: '/api/v1/',
  middleware_dir: 'src/example/routes/middleware',
  routes_dir: 'src/example/routes',
});

wiggle.build_routes();
wiggle.serve();
