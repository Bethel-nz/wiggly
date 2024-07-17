import { Context } from 'hono';

export default {
  get: (c: Context) => {
    const exampleVariable = c.get('exampleVariable');
    return c.json({
      message: `message from middleware: ${exampleVariable}`,
    });
  },
  post: (c: Context) => {
    const body = c.req.json();
    return c.json({
      message: body,
    });
  },
};
