const webpush = require('web-push');

module.exports = function(app, db) {

  const Subscriptions = db.collection("subscriptions");

  app.post("/notifications/subscribe", (req, res) => {
    const { subscription, userId } = req.body;
    const record = {
      subscription,
      userId,
    };
    Subscriptions.insertOne(record, err => {
      if (err) throw err;
      else {
        res.status(200).json({'success': true});
      }
    })
  })
};