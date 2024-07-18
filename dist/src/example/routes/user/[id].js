export default {
    get: (c) => {
        const id = c.req.param('id');
        return c.json({ message: `User ID: ${id}` });
    },
};
