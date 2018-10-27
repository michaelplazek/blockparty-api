const ObjectID = require("mongodb").ObjectID;

module.exports = function(app, db) {
  // GET all asks
  app.get("/asks", (req, res) => {
    db.collection("asks").find({}, (err, data) => {
      if (err) {
        res.send({ error: "An error has occurred" });
      } else {
        data.toArray((err, datum) => {
          res.send(datum);
        });
      }
    });
  });

  // GET an ask where query param id = _id
  app.get("/ask", (req, res) => {
    const details = { _id: new ObjectID(req.query.id) };
    db.collection("asks").findOne(details, (err, item) => {
      if (err) {
        res.send({ error: "An error has occurred" });
      } else {
        res.send(item);
      }
    });
  });

  // POST a new ask
  app.post("/asks", (req, res) => {
    const post = {
      coin: req.body.coin,
      owner: req.body.owner,
      price: req.body.price,
      volume: req.body.volume,
      lat: req.body.lat,
      lng: req.body.lng,
			isBid: false,
      timestamp: new Date()
    };
    db.collection("asks").insert(post, (err, result) => {
      if (err) {
        res.send({ error: "An error has occurred" });
      } else {
        res.send(result.ops[0]);
      }
    });
  });

  // DELETE an ask where query param id = _id
  app.delete("/ask", (req, res) => {
    const id = req.query.id;
    const details = { _id: new ObjectID(id) };
    db.collection("asks").remove(details, (err, item) => {
      if (err) {
        res.send({ error: "An error has occurred" });
      } else {
        res.send("Post " + id + " deleted!");
      }
    });
  });

  // PUT update an existing ask where query param id = _id
  app.put("/ask", (req, res) => {
    const id = req.query.id;
    const details = { _id: new ObjectID(id) };
    const post = {
      coin: req.body.coin,
      owner: req.body.owner,
      price: req.body.price,
      volume: req.body.volume,
      lat: req.body.lat,
      lng: req.body.lng,
			isBid: false,
      timestamp: new Date()
    };
    db.collection("asks").update(details, post, (err, result) => {
      if (err) {
        res.send({ error: "An error has occurred" });
      } else {
        res.send(post);
      }
    });
  });
};
