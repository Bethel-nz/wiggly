export default {
    get: async (c) => {
        const exampleVariable = c.get('exampleVariable');
        const url = c.get('url');
        return c.json({
            message: `detail route ${exampleVariable}, ${url}`,
        });
    },
    post: async (c) => {
        const body = await c.req.json();
        return c.json({
            message: body,
        });
    },
};
