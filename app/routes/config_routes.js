
module.exports = function(app, db) {

  const Configuration = db.collection("configuration");

  app.post("/config/mode", (req, res) => {
    const details = { userId: req.body.userId };
    const updates = {$set: { dark: req.body.dark }};
    const options = { upsert: true, returnOriginal: false };
    console.log(req.body);
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