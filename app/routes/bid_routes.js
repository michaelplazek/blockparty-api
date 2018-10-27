const ObjectID = require("mongodb").ObjectID;

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

	// GET total bids by a user by userId
	app.get("/bids/:userId", (req, res) => {
		console.log(req.params);
		const details = { userId: new ObjectID(req.params.userId) };
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
				console.log("User found");
				console.log(result);
				const post = {
					coin: req.body.coin,
					userId: result._id,
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
	app.put("/bids", (req, res) => {
		const user = req.body.owner;
		db.collection("users").findOne({ username: user }, (err, result) => {
			if (err) {
				res.send({ error: "User not found" });
			} else {
				console.log("User found");
				console.log(result);
				const post = {
					coin: req.body.coin,
					userId: result._id,
					price: req.body.price,
					volume: req.body.volume,
					lat: req.body.lat,
					lng: req.body.lng,
					isBid: true,
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
