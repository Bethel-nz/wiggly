export default {
    get: (c) => {
        return c.json({
            message: `Hello 👋 from root route`,
        });
    },
    post: (c) => {
        const body = c.req.json();
        return c.json({
            message: body,
        });
    },
};
