
module.exports = function(app, db) {

  const Configuration = db.collection("configuration");

  // POST when the user has selected Dark Mode
  app.post("/config/mode", (req, res) => {
    const details = { userId: req.body.userId };
    const updates = {$set: { dark: req.body.dark }};
    const options = { upsert: true, returnOriginal: false };
    Configuration.findOneAndUpdate(details, updates, options, (err, item) => {
      if (err) {
        res.send({ error: "Error retrieving configuration" });
      } else {
        if (item) {
          return res.send(item.value)
        }
      }
    });
  });

  // POST when the user has completed the tour
  app.post("/config/visited", (req, res) => {
    const details = { userId: req.body.userId };
    const updates = {$set: { visited: req.body.visited }};
    const options = { upsert: true, returnOriginal: false };
    Configuration.findOneAndUpdate(details, updates, options, (err, item) => {
      if (err) {
        res.send({ error: "Error retrieving configuration" });
      } else {
        if (item) {
          return res.send(item.value)
        }
      }
    });
  });

  // GET a config where query param userId === userId
  app.get("/config", (req, res) => {
    const details = { userId: req.query.userId };
    Configuration.findOne(details, (err, item) => {
      if (err || !item) {
        return res.status(404).json({
          error: true,
          message: "Cannot find configuration"
        });
      } else {
        res.send(item);
      }
    });
  });
};