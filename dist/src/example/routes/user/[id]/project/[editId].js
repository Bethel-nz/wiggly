export default {
    get: (c) => {
        const id = c.req.param('editId');
        return c.json({ message: `Edit ID: ${id}` });
    },
};
