import { Context } from 'hono';

export default {
  get: (c: Context) => {
    return c.json({
      message: `Hello 👋 from root route`,
    });
  },
  post: (c: Context) => {
    const body = c.req.json();
    return c.json({
      message: body,
    });
  },
};
