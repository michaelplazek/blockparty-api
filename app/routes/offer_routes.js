const ObjectID = require("mongodb").ObjectID;

module.exports = function(app, db) {

  const Users = db.collection("users");
  const Offers = db.collection("offers");
  const Bids = db.collection("bids");
  const Asks = db.collection("asks");

  // GET an offer where query param id = _id
  app.get("/offer", (req, res) => {
    const details = {_id: new ObjectID(req.query.id)};
    Offers.findOne(details, (err, item) => {
      if (err) {
        res.send({error: "An error has occurred"});
      } else {
        res.send(item);
      }
    });
  });

  // GET total offers by a user by userId
  app.get("/offers_by_user/:id", (req, res) => {
    const details = { userId: req.params.id };
    Offers.find(details, (err, data) => {
      if (err) {
        res.send({ error: "An error has occurred" });
      } else {
        data.toArray((err, datum) => {
          res.send(datum);
        });
      }
    });
  });

  // GET total offers for a ask by id
  app.get("/offers_by_ask/:id", (req, res) => {
    const details = {_id: new ObjectID(req.params.id)};

    // get the ask from the id
    Asks.findOne(details, (err, ask) => {
      if (err) {
        res.send({error: "Could not find ask"});
      } else {

        // get the offer ids
        const ids = ask.offers.map(item => new ObjectID(item));
        const details = {_id: {$in: ids}};
        Offers.find(details, (err, offers) => {
          if (err) {
            res.send({error: "Error retrieving offers"});
          } else {
            offers.toArray((err, datum) => {
              res.send(datum);
            });
          }
        })
      }
    });
  });

  // GET total offers for a bid by id
  app.get("/offers_by_bid/:id", (req, res) => {
    const details = {_id: new ObjectID(req.params.id)};

    // get the ask from the id
    Bids.findOne(details, (err, bid) => {
      if (err) {
        res.send({error: "Could not find bid"});
      } else {

        // get the offer ids
        console.log(bid);
        const ids = bid.offers.map(item => new ObjectID(item));
        const details = {_id: {$in: ids}};
        Offers.find(details, (err, offers) => {
          if (err) {
            res.send({error: "Error retrieving offers"});
          } else {
            offers.toArray((err, datum) => {
              res.send(datum);
            });
          }
        })
      }
    });
  });

  // POST a new bid offer
  app.post("/bid_offers", (req, res) => {
    const {postId} = req.body;
    const details = {_id: new ObjectID(postId)};

    // get the ask or bid from the _id
    Bids.findOne(details, (err, post) => {
      if (err) {
        res.send({error: "Post not found"});
      } else {
        const offer = {
          volume: req.body.volume,
          userId: req.body.userId,
          owner: req.body.owner,
          price: req.body.price,
          coin: req.body.coin,
          bid: true,
          timestamp: new Date(),
          postId: req.body.postId,
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
            Bids.update(details, update, (err, _) => {
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

  // POST a new ask offer
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
          userId: req.body.userId,
          owner: req.body.owner,
          price: req.body.price,
          coin: req.body.coin,
          bid: false,
          timestamp: new Date(),
          postId: req.body.postId,
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

  // DELETE a offer where query param id = _id
  app.delete("/offers/:id", (req, res) => {
    const details = {_id: new ObjectID(req.params.id)};
    console.log('inside');
    Offers.remove(details, (err, item) => {
      if (err) {
        res.send({error: "An error has occurred"});
      } else {
        return res.status(200)
      }
    });
  })
};

