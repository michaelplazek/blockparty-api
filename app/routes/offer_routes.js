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
      if (err || !item) {
        return res.status(404).json({
          error: true,
          message: "Cannot find offer"
        });
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
    Asks.find(details, (err, data) => {
      if (err) {
        res.send({error: "Could not find ask"});
      } else {

        // get the offer ids
        data.toArray((err, ask) => {
          const ids = ask[0].offers.map(item => new ObjectID(item));
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
        });
      }
    });
  });

  // GET total offers for a bid by id
  app.get("/offers_by_bid/:id", (req, res) => {
    const details = {_id: new ObjectID(req.params.id)};

    // get the ask from the id
    Bids.find(details, (err, data) => {
      if (err) {
        res.send({error: "Could not find bid"});
      } else {

        // get the offer ids
        data.toArray((err, bid) => {
          const ids = bid[0].offers.map(item => new ObjectID(item));
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
        });
      }
    });
  });

  // POST a new bid offer
  app.post("/bid_offers", (req, res) => {
    const {postId, userId, volume, contactInfo, username} = req.body;
    const details = {_id: new ObjectID(postId)};

    // get the ask or bid from the _id
    Bids.findOne(details, (err, post) => {
      if (err || !post) {
        res.send({error: "Post not found"});
      } else {
        const offer = {
          volume: volume,
          userId: userId.toString(),
          username,
          owner: post.owner,
          price: post.price,
          coin: post.coin,
          contactInfo: contactInfo,
          bid: true,
          timestamp: new Date(),
          postId,
          status: "PENDING",
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
    const {postId, userId, volume, contactInfo, username} = req.body;
    const details = {_id: new ObjectID(postId)};

    // get the ask or bid from the _id
    Asks.findOne(details, (err, post) => {
      if (err || !post) {
        res.send({error: "Post not found"});
      } else {
        const offer = {
          volume,
          userId: userId.toString(),
          username,
          owner: post.owner,
          price: post.price,
          coin: post.coin,
          contactInfo,
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

  // DELETE an offer where query param id = _id
  app.delete("/offer/:id", (req, res) => {
    const details = {_id: new ObjectID(req.params.id)};
    Offers.findOne(details, (err, offer) => {
      if (err) {
        res.send({error: "An error has occurred"});
      } else {
        Offers.remove(details, (err, _) => {
          const Store = offer.bid ? Bids : Asks;
          const _id = new ObjectID(offer.postId);
          const details = { _id };
          const update = {$pull: {offers: req.params.id}};
          Store.update(details, update, (err, response) => {
            if(err) return res.send({error: "Error updating post offers"});
            else return res.send(response);
          });
        });
      }
    });
  });

  // UPDATE an offer with id
  app.patch("/offer", (req, res) => {
    const { id } = req.body;
    const details = {_id: new ObjectID(id)};
    const updates = Object.keys(req.body)
      .filter(key => key !== "id")
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});
    const update = {$set: updates};
    Offers.findOneAndUpdate(details, update, {returnOriginal: true}, (err, offer) => {
      if(err || !offer.value) return res.send({ error: 'Could not update offer' });
      else {

        // remove the offer from the post
        const update = {$pull: {offers: offer.value._id.toString()}};
        const details = { _id: new ObjectID(offer.value.postId) };
        const Store = offer.value.bid ? Bids : Asks;
        Store.updateOne(details, update, (err, response) => {
          if(err) return res.send({error: "Error updating post offers"});
          else return res.send({ offer: offer.value });
        });
      }
    });
  });
};

