import { Context, Next } from 'hono';

export default async (c: Context, next: Next) => {
  _: async () => {
    console.log(`Global Middleware: Request made to: ${c.req.url}`);
    await next();
  };
};
