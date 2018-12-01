const ObjectID = require("mongodb").ObjectID;

module.exports = function(app, db) {

  const Users = db.collection("users");
  const Offers = db.collection("offers");
  const Transactions = db.collection("transactions");

  // POST a new transaction
  app.post("/ask_offers", (req, res) => {
    const {postId} = req.body;
    const details = {_id: new ObjectID(postId)};

    // get the ask or bid from the _id
    Asks.findOne(details, (err, post) => {
      if (err) {
        res.send({error: "Post not found"});
      } else {
        const offer = {
          volume: req.body.volume,
          userId: req.body.userId.toString(),
          owner: post.owner,
          price: post.price,
          coin: post.coin,
          contactInfo: req.body.contactInfo,
          bid: false,
          timestamp: new Date(),
          postId,
          status: "PENDING"
        };

        // create a new offer
        Offers.insert(offer, (err, result) => {
          if (err) {
            res.send({error: "Error adding offer"});
          } else {
            const ids = post.offers.concat(result.insertedIds[0].toString());
            const update = {$set: {offers: ids}};

            // update the list of offer ids for the post
            Asks.update(details, update, (err, _) => {
              if (err) {
                res.send({error: "Error updating post offers"});
              } else {
                res.send(result.ops[0]);
              }
            });
          }
        });
      }
    });
  });
};