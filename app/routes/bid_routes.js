module.exports = function(app, db) {
  // GET all the bids
  app.get("/bids", (req, res) => {
    db.collection("bids").find({}, (err, data) => {
      if (err) {
        res.send({ error: "An error has occurred" });
      } else {
        data.toArray((err, datum) => {
          res.send(datum);
        });
      }
    });
  });

  // GET a bid where query param id = _id
  app.get("/bid", (req, res) => {
    const details = { _id: new ObjectID(req.query.id) };
    db.collection("bids").findOne(details, (err, item) => {
      if (err) {
        res.send({ error: "An error has occurred" });
      } else {
        res.send(item);
      }
    });
  });

  // POST a new bid
  app.post("/bids", (req, res) => {
    const post = {
      coin: req.body.coin,
      owner: req.body.owner,
      price: req.body.price,
      volume: req.body.volume,
      lat: req.body.lat,
      lng: req.body.lng,
      isBid: true,
      timestamp: new Date()
    };
    db.collection("bids").insert(post, (err, result) => {
      if (err) {
        res.send({ error: "An error has occurred" });
      } else {
        res.send(result.ops[0]);
      }
    });
  });

  // DELETE a bid where query param id = _id
  app.delete("/bid", (req, res) => {
    const id = req.query.id;
    const details = { _id: new ObjectID(id) };
    db.collection("bids").remove(details, (err, item) => {
      if (err) {
        res.send({ error: "An error has occurred" });
      } else {
        res.send("Bid " + id + " deleted.");
      }
    });
  });

  // PUT update an existing bid where query param id = _id
  app.put("/bid", (req, res) => {
    const id = req.query.id;
    const details = { _id: new ObjectID(id) };
    const post = {
      coin: req.body.coin,
      owner: req.body.owner,
      price: req.body.price,
      volume: req.body.volume,
      lat: req.body.lat,
      lng: req.body.lng,
			isBid: true,
      timestamp: new Date()
    };
    db.collection("bids").update(details, post, (err, result) => {
      if (err) {
        res.send({ error: "An error has occurred" });
      } else {
        res.send(post);
      }
    });
  });
};
