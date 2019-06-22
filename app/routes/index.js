const askRoutes = require("./ask_routes");
const userRoutes = require("./user_routes");
const bidRoutes = require("./bid_routes");
const offerRoutes = require("./offer_routes");
const transactionRoutes = require("./transaction_routes");
const notificationRoutes = require("./notification_routes");
const configRoutes = require("./config_routes");

module.exports = function(app, db) {
  askRoutes(app, db);
  userRoutes(app, db);
  bidRoutes(app, db);
  offerRoutes(app, db);
  transactionRoutes(app, db);
  notificationRoutes(app, db);
  configRoutes(app, db);
};
