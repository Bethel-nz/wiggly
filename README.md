# Wiggly Documentation

## Introduction

`Wiggly` is a lightweight framework built on top of the Hono library that simplifies setting up a server with middleware and dynamic routing through a file-based routing system. This guide will walk you through the steps to get started with `Wiggly`, including setting up middleware, defining routes, and running the server.

## Installation

First, install the necessary dependencies:

```bash
npm install
```

## Setup

### Directory Structure

`Wiggly` expects a specific directory structure for routes and middleware. The directory structure should look like this, each routes can have children and deeply nested children:

```
project-root/
├── routes/
│   ├── middleware/
│   │   ├── _index.ts
│   ├── your route/
│   │   ├── _middleware.ts
│   │   ├── index.ts
│   │   └── [id].ts
│   │   └── [id]/child dynamic route/
│   │       └── index.ts
|   |          └── /details
|   |               └── index.ts
│   ├── your second route/
│   │   ├── _middleware.ts
│   │   ├── index.ts
│   │   └── [id].ts
|   ├── more routes /
│   │         ├── _middleware.ts
│   │         ├── index.ts
│   │         └── [id].ts
└── index.ts
```

- `routes/`: Contains all your route handlers.
  - `middleware/`: Global middleware applied to all routes.
    - `_index.ts`: Global middleware or handlers applied to the root path.
  - `your routes/`: A subdirectory containing route handlers for `your` endpoint.
    - `_middleware.ts`: Middleware specific to the `route` endpoint.
    - `index.ts`: Handler for the `/user` endpoint.
    - `[id].ts`: Dynamic route handler for `/user/:id`.
    - `[id]/child dynamic route/`: A deeply nested directory with its own `index.ts` handler.
  - Similar structure for other endpoints like `more routes/`.

### Route Handlers

Each route handler file should export functions corresponding to HTTP methods (`get`, `post`, `put`, `delete`, `patch`) and/or a default middleware function (`_`).

Example: `routes/user/index.ts`

```typescript
import { Context } from 'hono';

export default {
  get: (c: Context) => {
    const exampleVariable = c.get('exampleVariable');
    const url = c.get('url');
    return c.json({
      message: `message from middleware: ${exampleVariable}, ${url}`,
    });
  },
  post: (c: Context) => {
    const body = c.req.json();
    return c.json({
      message: body,
    });
  },
};
```

Example: `routes/user/[id].ts`

```typescript
import { Context } from 'hono';

export default {
  get: (c: Context) => {
    const id = c.req.param('id');
    return c.json({ message: `User ID: ${id}` });
  },
};
```

Example: `routes/user/[id]/projects/index.ts`

```typescript
import { Context } from 'hono';

export default {
  get: (c: Context) => {
    const id = c.req.param('id');
    return c.json({ message: `Projects for User ID: ${id}` });
  },
};
```

### Middleware

Middleware files should export a default object with a `_` function.

Example: `routes/middleware/_index.ts`

```typescript
import { Context, Next } from 'hono';

export default {
  _: (c: Context, next: Next) => {
    c.set('exampleVariable', 'Hello 👋');
    return next();
  },
};
```

Example: `routes/user/_middleware.ts`

```typescript
import { Context, Next } from 'hono';

export default {
  _: (c: Context, next: Next) => {
    c.set('url', `google.com`);
    next();
  },
};
```

### Server Setup

Create a new file `index.ts` at the root of your project:

```typescript
import { Hono } from 'hono';
import Wiggly from './src/lib/wiggly';

//Wiggly's app config can be overridden with your own config refer to hono's docs: https://hono.dev/docs/
const hono_app = new Hono();

// Initialize Wiggly with base path
//middleware_dir and routes_dir are by default your /routes dir in our project roots but should incase they are different you have to specify them here
const wiggle = new Wiggly({
  app: hono_app,
  base_path: '/api/v1/',
  middleware_dir: 'src/example/routes/middleware',
  routes_dir: 'src/example/routes',
});

// Load routes
wiggle.build_routes();

// Start the server
wiggle.serve();
```

### Running the Server

To start the server, run the following command:

```bash
npx tsx index.ts
```

## API Reference

### Wiggly Class

#### Constructor

```typescript
new Wiggly(default_args: {
  app?: Hono;
  base_path: string;
  middleware_dir?: string;
  routes_dir?: string;
});
```

- `app`: Optional. Your instance of Hono. If not provided, a new instance is created. see [hono docs]("https://hono.dev/docs/")
- `base_path`: The base path for all routes.
- `middleware_dir`: Optional. Path to the global middleware directory.
- `routes_dir`: Optional. Path to the routes directory.

#### Methods

##### `build_routes(directory: string = this.default_dir, base_path: string = ''): void`

Loads route handlers from the specified directory and sets up routing.

- `directory`: The directory to load routes from. Defaults to the `/routes` directory or uses the `routes_dir` specified in the wiggly class config.
- `base_path`: The base path for the routes.

##### `serve(port: number = 8080, args?: Parameters<typeof serve>): Promise<void>`

Starts the server on the specified port.

- `port`: The port to start the server on. Defaults to `8080`.
- `args`: Additional arguments for the `serve` function from `hono`.

## Examples

### Example 1: Basic Setup

```typescript
import Wiggly from 'wiggly';

// Initialize Wiggly with base path
const wiggle = new Wiggly({
  base_path: '/api/v1/',
  middleware_dir: 'src/example/routes/middleware',
  routes_dir: 'src/example/routes',
});

wiggle.build_routes();
wiggle.serve(8080);
```

### Example 2: Custom Route Handler

Create a custom route handler in `routes/user/index.ts`:

```typescript
import { Context } from 'hono';

export default {
  get: (c: Context) => {
    const exampleVariable = c.get('exampleVariable');
    const url = c.get('url');
    return c.json({
      message: `message from middleware: ${exampleVariable}, ${url}`,
    });
  },
  post: async (c: Context) => {
    const body = await c.req.json();
    return c.json({
      message: body,
    });
  },
};
```

### Example 3: Deeply Nested Routes

`Wiggly` supports deeply nested routes. If you have a file like `routes/user/[id]/projects/index.ts`, it will work for both `/user/:id` and `/user/:id/projects` as long as `[id]/projects` has its own `index.ts`. Just pass your parameter as needed.

Start the server:

```typescript
import { Hono } from 'hono';
import Wiggly from './src/lib/wiggly';

// Initialize Wiggly with base path
const wiggle = new Wiggly({
  base_path: '/api/v1/',
  middleware_dir: 'src/example/routes/middleware',
  routes_dir: 'src/example/routes',
});

wiggle.build_routes();
wiggle.serve(8080);
```

## Conclusion

This documentation provides an overview of how to set up and use the `Wiggly` framework for building a server with middleware and dynamic routing through a file-based routing system. Follow the directory structure, create your route handlers, and start your server with ease. Happy coding!
