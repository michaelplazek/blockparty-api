const postRoutes = require('./post_routes');
const userRoutes = require('./user_routes');

module.exports = function(app, db) {
    postRoutes(app, db);
    userRoutes(app, db);
};