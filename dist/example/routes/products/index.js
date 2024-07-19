export default {
    get: (c) => {
        const exampleVariable = c.get('exampleVariable');
        const url = c.get('url');
        return c.json({
            message: `detail route ${exampleVariable}, ${url}`,
        });
    },
    post: (c) => {
        const body = c.req.json();
        return c.json({
            message: body,
        });
    },
};
