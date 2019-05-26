const webpush = require('web-push');

module.exports = function(app, db) {

  const Subscriptions = db.collection("subscriptions");

  app.post("/notifications/subscribe", (req, res) => {
    const { subscription, userId } = req.body;
    Subscriptions.update({ userId }, {$set:{ subscription }}, { upsert: true}, err => {
      if (err) throw err;
      else {
        res.send(subscription);
      }
    })
  });

  app.post("/notifications/subscriptions", (req, res) => {
    const { userId } = req.body;
    const record = {
      userId,
    };
    Subscriptions.findOne(record, (err, subscription) => {
      if (err) throw err;
      else {
        res.send(subscription);
      }
    })
  });

  app.post("/notifications/notify", (req) => {
    const { title, body, subscription } = req.body;
    const message = {
      title,
      body,
    };
    webpush.sendNotification(subscription, message)
      .then(result => console.log(result))
      .catch(e => console.log(e.stack))
  })
};