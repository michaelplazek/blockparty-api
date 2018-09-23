const postRoutes = require('./post_routes');

module.exports = function(app, db) {
    postRoutes(app, db);
    // Other route groups could go here, in the future
};