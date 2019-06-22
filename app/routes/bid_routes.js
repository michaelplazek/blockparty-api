const ObjectID = require("mongodb").ObjectID;
const request = require("request");

module.exports = function(app, db) {

  const Bids = db.collection("bids");

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
      if (err || !item) {
        return res.status(404).json({
          error: true,
          message: "Cannot find bid"
        });
      } else {
        res.send(item);
      }
    });
  });

  // GET total bids by a user by userId
  app.get("/bids/:userId", (req, res) => {
    const details = { userId: req.params.userId };
    db.collection("bids").find(details, (err, data) => {
      if (err) {
        res.send({ error: "An error has occurred" });
      } else {
        data.toArray((err, datum) => {
          res.send(datum);
        });
      }
    });
  });

  // POST a new bid
  app.post("/bids", (req, res) => {
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
            userId: result._id.toString(),
            owner: user,
            contactInfo: req.body.contactInfo,
            price: req.body.price,
            volume: req.body.volume,
            lat: req.body.lat,
            lng: req.body.lng,
            isBid: true,
            isAccepted: false,
            timestamp: new Date(),
            location: body.results[0].address_components,
            reputation: (result.completedTransactions/(result.completedTransactions + result.cancelledTransactions)) * 5,
            offers: []
          };
          db.collection("bids").insert(post, (err, result) => {
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

  // DELETE a bid where query param id = _id
  app.delete("/bid/:id", (req, res) => {
		const details = { _id: new ObjectID(req.params.id) };
		Bids.remove(details, (err, item) => {
			if (err) {
				res.send({ error: "An error has occurred" });
			} else {
				return res.send(item)
			}
		});
  });

  // PUT update an existing bid where query param id = _id
  app.put("/bids", (req, res) => {
    const user = req.body.owner;
    db.collection("users").findOne({ username: user }, (err, result) => {
      if (err) {
        res.send({ error: "User not found" });
      } else {
        const post = {
          coin: req.body.coin,
          userId: result._id.toString(),
          price: req.body.price,
          contactInfo: req.body.contactInfo,
          volume: req.body.volume,
          lat: req.body.lat,
          lng: req.body.lng,
          isBid: true,
          isAccepted: false,
          timestamp: new Date()
        };
        db.collection("bids").update(post, (err, result) => {
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
