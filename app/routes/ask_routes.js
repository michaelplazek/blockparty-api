const ObjectID = require("mongodb").ObjectID;
const request = require("request");

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

  // GET total asks by a user by userId
  app.get("/asks/:userId", (req, res) => {
    const details = { userId: new ObjectID(req.params.userId) };
    db.collection("asks").find(details, (err, data) => {
      if (err) {
        res.send({ error: "An error has occurred" });
      } else {
        data.toArray((err, datum) => {
          res.send(datum);
        });
      }
    });
  });

  // POST a new ask
  app.post("/asks", (req, res) => {
    const user = req.body.owner;
    db.collection("users").findOne({ username: user }, (err, result) => {
      if (err) {
        res.send({ error: "User not found" });
      } else {
        const URL = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${req.body.lat},${req.body.lng}&key=${process.env.GOOGLE_MAPS_KEY}`;
        request(URL, { json: true }, (err, resp, body) => {
          if (err) { return console.log(err); }
          const post = {
            coin: req.body.coin,
            userId: result._id,
            owner: user,
            price: req.body.price,
            volume: req.body.volume,
            lat: req.body.lat,
            lng: req.body.lng,
            isBid: false,
            isAccepted: false,
            timestamp: new Date(),
            location: body.results[0].address_components,
            offers: []
          };
          db.collection("asks").insert(post, (err, result) => {
            if (err) {
              res.send({ error: "An error has occurred" });
            } else {
              res.send(result.ops[0]);
            }
          });
        })
      }
    });
  });

  // DELETE an ask where query param id = _id
  app.delete("/ask/:id", (req, res) => {
		const details = { _id: new ObjectID(req.params.id) };
    db.collection("asks").remove(details, (err, item) => {
      if (err) {
        res.send({ error: "An error has occurred" });
      } else {
				return res.status(200)
      }
    });
  });

  // PUT update an existing ask where query param id = _id
  app.put("/asks", (req, res) => {
    const user = req.body.owner;
    db.collection("users").findOne({ username: user }, (err, result) => {
      if (err) {
        res.send({ error: "User not found" });
      } else {
        const post = {
          coin: req.body.coin,
          userId: result._id,
          price: req.body.price,
          volume: req.body.volume,
          lat: req.body.lat,
          lng: req.body.lng,
          isBid: false,
          isAccepted: false,
          timestamp: new Date()
        };
        db.collection("asks").update(post, (err, result) => {
          if (err) {
            res.send({ error: "An error has occurred" });
          } else {
            res.send(result.ops[0]);
          }
        });
      }
    });
  });
};
