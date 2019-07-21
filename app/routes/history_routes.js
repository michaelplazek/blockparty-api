
module.exports = function(app, db) {

  const History = db.collection("history");

  // GET total asks by a user by userId
  app.get("/history/:userId", (req, res) => {
    const sellerDetails = { sellerId: req.params.userId };
    const buyerDetails = { buyerId: req.params.userId };
    History.find(sellerDetails, (err, data) => {
      if (err) res.send({ error: "An error has occurred" });
      else {
        data.toArray((_, sellerResults) => {
          History.find(buyerDetails, (err, data) => {
            if (err) res.send({ error: "An error has occurred" });
            else {
              data.toArray((_, buyerResults) => {
                const result = sellerResults.concat(buyerResults);
                res.send(result);
              })
            }
          });
        });
      }
    });
  });
};