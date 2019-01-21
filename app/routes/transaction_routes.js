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
              sellerUsername: offer.bid ? offer.username : req.body.owner,
              buyerId: offer.bid ? post.userId.toString() : offer.userId,
              buyerUsername: offer.bid ? req.body.owner : offer.username,
              sellerContactInfo: offer.bid ? offer.contactInfo : post.contactInfo,
              buyerContactInfo: offer.bid ? post.contactInfo : offer.contactInfo,
              coin: offer.coin,
              volume: offer.volume,
              price: post.price,
              postId: offer.postId,
              bid: offer.bid,
              completedBySeller: false,
              completedByBuyer: false
            };
            Transactions.insertOne(transaction, (err, transactionResponse) => {
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

                        // remove the offer from the post
                        const offerUpdate = {$pull: {offers: offerId}};
                        Store.updateOne(postDetails, offerUpdate, (err, _) => {
                          if(err) return res.send({error: "Error updating post offers"});
                          else return res.send(transactionResponse);
                        });
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

  app.post("/transaction_complete", (req, res) => {
    const { id, userId } = req.body;
    const transactionDetails = {_id: new ObjectID(id)};

    // find the corresponding transaction
    Transactions.findOne(transactionDetails, (err, transaction) => {
      if(err || !transaction) return res.send({ error: "Could not find transaction" });
      else {

        // find out whether its the seller or buyer
        const position = userId === transaction.sellerId ? "completedBySeller" : "completedByBuyer";

        // mark as completed
        const updates = {$set: { [position]: true }};
        Transactions.findOneAndUpdate(transactionDetails, updates, {returnOriginal: false}, (err, response) => {
          if(err) return res.send({ error: 'Could not update transaction' });
          else {

            // see if both users have marked it as complete
            const complete = response.value.completedByBuyer && response.value.completedBySeller;
            if (complete) {

              console.log(transaction);

              // increment both parties completed transactions
              const userDetails =  {
                _id: {
                  $in: [new ObjectID(transaction.sellerId), new ObjectID(transaction.buyerId)]
                }
              };
              const userUpdate = { $inc: { completedTransactions: 1 } };
              Users.updateMany(userDetails, userUpdate, (err, users) => {

                if(err) return res.send({ error: "Could not update users" });
                else {

                  // get the original post and set isAccepted to false
                  const Store = response.value.bid ? Bids : Asks;
                  const postDetails = { _id: new ObjectID(response.value.postId) };
                  const updates = {$set: {isAccepted: false, offers: []}};
                  Store.findOneAndUpdate(postDetails, updates, {returnOriginal: true}, (err, post) => {
                    if(err) return res.send({ error: 'Could not find post' });
                    else {

                      // see if the offer volume was less than the total volume
                      const offerVolume = transaction.volume;
                      const totalVolume = post.value.volume;
                      const lessThan = offerVolume < totalVolume;
                      const difference = totalVolume - offerVolume;

                      // we can just subtract the value from the post
                      if(lessThan){
                        const updates = {$set: {volume: difference}};
                        Store.updateOne(postDetails, updates, (err, response) => {
                          if(err) return res.send({ error: 'Could not find post' });
                        });
                      } else { // otherwise, we can just delete the post
                        Store.deleteOne(postDetails, (err, response) => {
                          if(err) return res.send({ error: 'Could not find post' });
                        });
                      }

                      // now we need to delete remaining offers
                      const offers = post.value.offers.map(item => new ObjectID(item));
                      Offers.removeMany({'_id':{'$in': offers}}, (err, response) => {
                        if(err) return res.send({ error: "Could not delete offers" });
                        else {

                          // now delete the transaction
                          Transactions.removeOne(transactionDetails, (err, response) => {
                            if(err) return res.send({ error: "Could not delete the transaction" });
                            else {

                              // return the result if both parties marked as completed
                              return res.send(response);
                            }
                          });
                        }
                      });
                    }
                  })
                }
              });
            } else {

              // return the result if only one has marked as completed
              return res.send(response.value);
            }
          }
        })
      }
    })
  });

  app.post("/transaction_cancelled", (req, res) => {
    const { id } = req.body;
    const transactionDetails = {_id: new ObjectID(id)};

    // get transaction from id
    Transactions.findOne(transactionDetails, (err, transaction) => {
      if (err || !transaction) return res.send({error: "Could not find transaction"});
      else {
        const { postId, bid } = transaction;
        const postDetails = { _id: new ObjectID(postId) };
        const updates = {$set: {isAccepted: false}};
        const Store = bid ? Bids : Asks;
        Store.findOneAndUpdate(postDetails, updates, (err, post) => {
          if(err) return res.send({ error: 'Could not find post' });
          else {

            // increment both parties cancelled transactions
            const userDetails =  {
              _id: {
                $in: [new ObjectID(transaction.sellerId), new ObjectID(transaction.buyerId)]
              }
            };
            const userUpdate = { $inc: { cancelledTransactions: 1 } };
            Users.updateMany(userDetails, userUpdate, (err, users) => {
            if(err) return res.send({ error: 'Could not find users' });

              // then delete the transaction
              Transactions.removeOne(transactionDetails, (err, response) => {
                if(err) return res.send({ error: 'Could not delete transaction' });
                else {
                  return res.send(post.value);
                }
              });
            });
          }
        });
      }
    });
  });


  // GET transactions based on a user id
  app.get('/transactions/:userId', (req, res) => {
    const details = { sellerId: req.params.userId };
    Transactions.find(details, (err, sellers) => {
      if(err) return res.send({ error: 'Error getting transactions' });
      else {
        sellers.toArray((err, sellerArray) => {
          const details = { buyerId: req.params.userId };
          Transactions.find(details, (err, buyers) => {
            if(err) return res.send({ error: 'Error getting transactions' });
            else {
              buyers.toArray((err, buyerArray) => {
                const result = sellerArray.concat(buyerArray);
                return res.send(result);
              })
            }
          });
        });
      }
    });
  });

  // GET transaction based on id
  app.get("/transaction/:id", (req, res) => {
    const details = { _id: new ObjectID(req.params.id) };
    Transactions.findOne(details, (err, transaction) => {
      if (err || !transaction) return res.send({ error: 'Could not find transaction' });
      else {
        return res.send(transaction);
      }
    })
  });
};