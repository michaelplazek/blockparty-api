const ObjectID = require("mongodb").ObjectID;

module.exports = function(app, db) {

  const Users = db.collection("users");
  const Offers = db.collection("offers");
  const Asks = db.collection("asks");
  const Bids = db.collection("bids");
  const Transactions = db.collection("transactions");
  const History = db.collection("history");

  // POST a new transaction based on an offer id
  app.post("/transaction", (req, res) => {
    const { offerId } = req.body;
    const offerDetails = {_id: new ObjectID(offerId)};

    // find offer with corresponding id
    Offers.findOne(offerDetails, (err, offer) => {
      if (err) return res.send({ error: 'Offer not found' });
      else {

        console.log(offer);
        console.log(offerId);

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

    console.log(`Setting transaction ${id} as complete by user ${userId}`);

    // find the corresponding transaction
    Transactions.findOne(transactionDetails, (err, transaction) => {
      if(err || !transaction) {
        console.log(`Error: cannot find transaction`, err);
        return res.send({ error: "Could not find transaction" });
      } else {

        console.log(`Transaction found.`);

        // find out whether its the seller or buyer
        const position = userId === transaction.sellerId ? "completedBySeller" : "completedByBuyer";

        // mark as completed
        console.log(`Updating transaction`);
        const updates = {$set: { [position]: true }};
        Transactions.findOneAndUpdate(transactionDetails, updates, {returnOriginal: false}, (err, response) => {
          if(err) {
            console.log(`Error: cannot update transaction`, err);
            return res.send({ error: 'Could not update transaction' });
          }
          else {

            // see if both users have marked it as complete
            const complete = response.value.completedByBuyer && response.value.completedBySeller;
            if (complete) {

              console.log(`Both users have marked the transaction as complete`);

              // increment both parties completed transactions
              const userDetails =  {
                _id: {
                  $in: [new ObjectID(transaction.sellerId), new ObjectID(transaction.buyerId)]
                }
              };

              console.log(`Updating completed transactions for the users`);
              const userUpdate = { $inc: { completedTransactions: 1 } };
              Users.updateMany(userDetails, userUpdate, (err, users) => {

                if(err) {
                  console.log(`Error: could not update users`, err);
                  return res.send({ error: "Could not update users" });
                }
                else {

                  console.log(`Updating post`);

                  // get the original post and set isAccepted to false
                  const Store = response.value.bid ? Bids : Asks;
                  const postDetails = { _id: new ObjectID(response.value.postId) };
                  const updates = {$set: {isAccepted: false, offers: []}};
                  Store.findOneAndUpdate(postDetails, updates, {returnOriginal: true}, (err, post) => {
                    if(err) {
                      console.log(`Error: could not find user`, err);
                      return res.send({ error: 'Could not find post' });
                    }
                    else {

                      console.log(`Found post`);

                      // see if the offer volume was less than the total volume
                      const offerVolume = transaction.volume;
                      const totalVolume = post.value.volume;
                      const lessThan = offerVolume < totalVolume;
                      const difference = totalVolume - offerVolume;

                      // we can just subtract the value from the post
                      if(lessThan){
                        console.log(`Offer is less than total of the post; updating post...`);
                        const updates = {$set: {volume: difference}};
                        Store.updateOne(postDetails, updates, (err, response) => {
                          if(err) {
                            console.log(`Error: cannot find post`, err);
                            return res.send({ error: 'Could not find post' });
                          } else {
                            console.log(`Transaction updated`);
                          }
                        });
                      } else { // otherwise, we can just delete the post
                        console.log(`Offer is for entire post; deleting post...`);
                        Store.deleteOne(postDetails, (err, response) => {
                          if(err) {
                            console.log(`Error: could not find post`, err);
                            return res.send({ error: 'Could not find post' });
                          }
                          else {
                            console.log(`Posts deleted`);
                          }
                        });
                      }

                      // now we need to delete remaining offers
                      console.log(`Deleting remaining offers for post`);
                      const offers = post.value.offers.map(item => new ObjectID(item));
                      Offers.removeMany({'_id':{'$in': offers}}, (err, response) => {
                        if(err) {
                          console.log(`Error: could not delete offers`, err);
                          return res.send({ error: "Could not delete offers" });
                        }
                        else {

                          console.log(`Deleting transaction`);

                          // now delete the transaction
                          Transactions.removeOne(transactionDetails, (err, response) => {
                            if(err) {
                              console.log(`Error: could not delete transaction`, err);
                              return res.send({ error: "Could not delete the transaction" });
                            }
                            else {
                              const history = {
                                ...transaction,
                                completed: true,
                              };
                              console.log(`Adding history for transaction ${transaction._id.toString()}`);
                              History.insertOne(history, (err, response) => {
                                if(err) {
                                  console.log(`Error: could not add transaction to history`, err);
                                  return res.send({ error: 'Error adding transaction to history' });
                                }
                                else {
                                  console.log(`Transaction successful`);
                                  // return the result if both parties marked as completed
                                  return res.send(response);
                                }
                              });
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
              console.log(`Successfully marked as complete`);
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

    console.log(`Cancelling transaction`);

    // get transaction from id
    Transactions.findOne(transactionDetails, (err, transaction) => {
      if (err || !transaction) {
        console.log(`Error: could not find transaction`, err);
        return res.send({error: "Could not find transaction"});
      }
      else {
        console.log(`Transaction found`);
        const { postId, bid } = transaction;
        const postDetails = { _id: new ObjectID(postId) };
        const updates = {$set: {isAccepted: false}};
        const Store = bid ? Bids : Asks;
        console.log(`Reinstating post`);
        Store.findOneAndUpdate(postDetails, updates, (err, post) => {
          if(err) {
            console.log(`Error: could not find post`, err);
            return res.send({ error: 'Could not find post' });
          }
          else {

            console.log(`Post found`);
            // increment both parties cancelled transactions
            const userDetails =  {
              _id: {
                $in: [new ObjectID(transaction.sellerId), new ObjectID(transaction.buyerId)]
              }
            };
            const userUpdate = { $inc: { cancelledTransactions: 1 } };
            console.log(`Updating users`);
            Users.updateMany(userDetails, userUpdate, (err, users) => {
            if(err) {
              console.log(`Error: could not find users`, err);
              return res.send({ error: 'Could not find users' });
            }

              console.log(`Deleting transaction`);
              // then delete the transaction
              Transactions.removeOne(transactionDetails, (err, response) => {
                if(err) {
                  console.log(`Error: could not delete transaction`, err);
                  return res.send({ error: 'Could not delete transaction' });
                }
                else {
                  const history = {
                    ...transaction,
                    completed: false,
                  };
                  console.log(`Adding history`);
                  History.insertOne(history, (err, response) => {
                    if(err) {
                      console.log(`Error: could not add transaction to history`);
                      return res.send({ error: 'Error adding transaction to history' });
                    }
                    else {
                      console.log(`Transaction successfully cancelled`);
                      // return the result if both parties marked as completed
                      return res.send(post.value);
                    }
                  });
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
      if (err || !transaction) {
        return res.status(404).json({
          error: true,
          message: "Cannot find transaction"
        });
      }
      else {
        return res.send(transaction);
      }
    })
  });
};