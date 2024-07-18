export default {
    _: (c, next) => {
        c.set('exampleVariable', 'Hello 👋');
        return next();
    },
};
