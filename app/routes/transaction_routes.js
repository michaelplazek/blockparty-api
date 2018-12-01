const ObjectID = require("mongodb").ObjectID;

module.exports = function(app, db) {

  const Users = db.collection("users");
  const Offers = db.collection("offers");
  const Asks = db.collection("asks");
  const Bids = db.collection("bids");
  const Transactions = db.collection("transactions");

  // POST a new transaction based on an offer id
  app.post("/transaction", (req, res) => {
    const { offerId } = req.body;
    const offerDetails = {_id: new ObjectID(offerId)};

    // find offer with corresponding id
    Offers.findOne(offerDetails, (err, offer) => {
      if (err) return res.send({ error: 'Offer not found' });
      else {

        // get the associated ask or bid
        const Store = offer.bid ? Bids : Asks;
        const postDetails = {_id: new ObjectID(offer.postId)};
        Store.findOne(postDetails, (err, post) => {
          if(err) return res.send({ error: 'Post not found' });
          else {

            // create the transaction
            const transaction = {
              sellerId: offer.bid ? offer.userId : post.userId.toString(),
              sellerUsername: offer.bid ? req.body.owner : post.owner,
              buyerId: offer.bid ? post.userId.toString() : offer.userId,
              buyerUsername: offer.bid ? post.owner : req.body.owner,
              coin: offer.coin,
              volume: offer.volume,
              price: post.price,
              contactInfo: offer.contactInfo
            };
            Transactions.insertOne(transaction, (err, result) => {
              if(err) return res.send({ error: 'Transaction could not be created' });
              else {

                // deletes the offer
                Offers.removeOne(offerDetails, (err, result) => {
                  if(err) return res.send({ error: 'Offer could not be deleted' });
                  else {

                    // post is set to accepted for filtering
                    const postUpdates = {$set: {isAccepted: true}};
                    Store.updateOne(postDetails, postUpdates, (err, result) => {
                      if(err) return res.send({ error: 'Post could not be updated' });
                      else {
                        return res.status(200);
                      }
                    })
                  }
                })
              }
            });
          }
        });
      }
    });
  });
};