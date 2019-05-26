const webpush = require('web-push');

module.exports = function(app, db) {

  const Subscriptions = db.collection("subscriptions");
  const Users = db.collection("users");

  app.post("/notifications/subscribe", (req, res) => {
    const { subscription, userId } = req.body;
    Subscriptions.update({ userId }, {$set:{ subscription }}, { upsert: true}, err => {
      if (err) throw err;
      else {
        res.send({ 'success': true })
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
        res.send({ 'success': true })
      }
    })
  });

  app.post("/notifications/notify", (req, res) => {
    const { title, body, owner } = req.body;
    const message = {
      title,
      body,
    };
    const user = {
      username: owner,
    };
    Users.findOne(user, (err, userInfo) => {
      if (err) throw err;
      else {
        const userDetails = { userId: userInfo._id.toString() };
        Subscriptions.findOne(userDetails, (err, result) => {
          if (err) throw err;
          else {
            console.log(userDetails);
            webpush.sendNotification(result.subscription,JSON.stringify(message))
              .then(result => console.log(result))
              .catch(e => console.log(e.stack));

            res.send({ 'success': true })
          }
        });
      }
    });
  })
};