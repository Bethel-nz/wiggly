export default {
    _: (c, next) => {
        c.set('exampleVariable', 'Holla 👋');
        return next();
    },
};
