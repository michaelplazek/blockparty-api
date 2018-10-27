const askRoutes = require('./ask_routes');
const userRoutes = require('./user_routes');
const bidRoutes = require('./bid_routes');

module.exports = function(app, db) {
    askRoutes(app, db);
    userRoutes(app, db);
    bidRoutes(app, db);
};