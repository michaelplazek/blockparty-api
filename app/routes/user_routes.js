const jwt = require("jsonwebtoken");
const omit = require('lodash/omit');
const ObjectID = require("mongodb").ObjectID;

function generateToken(user) {
  const u = {
    username: user.username,
    _id: user._id.toString()
  };
  return jwt.sign(u, process.env.SESSION_SECRET, {
    expiresIn: 60 * 60 * 24 // expires in 24 hours
  });
}

module.exports = function(app, db) {

  const Users = db.collection("users");

  app.post("/users/signup", (req, res, next) => {
    const user = {
      username: req.body.username,
      password: req.body.password,
      created: new Date(),
      bio: "This is my bio",
      completedTransactions: 0,
      cancelledTransactions: 0
    };
    Users.insert(user, err => {
      if (err) throw err;
      else {
        const token = generateToken(user);
        res.json({
          user: user,
          token: token,
          id: user._id.toString()
        });
      }
    });
  });

  app.post("/users/login", (req, res) => {
    Users.findOne(
      { username: req.body.username },
      (err, user) => {
        if (err) throw err;
        if (!user) {
          return res.status(404).json({
            error: true,
            message: "Username or password is wrong."
          });
        }

        // use bcrypt here
        if (req.body.password === user.password) {
          const token = generateToken(user);
          res.json({
            user: user,
            token: token,
            id: user._id.toString()
          });
        } else {
          return res.status(404).json({
            error: true,
            message: "Username or password is wrong."
          });
        }
      }
    );
  });

  app.get("/users/user_from_token/:token", (req, res, next) => {
    let token = req.body.token || req.query.token;
    if (!token) {
      return res.status(401).json({
        message: "Must pass token"
      });
    }

    jwt.verify(token, process.env.SESSION_SECRET, function(err, user) {
      if (err) throw err;
      Users.findOne(
        { _id: new ObjectID(user._id) },
        (err, item) => {
          if (err) throw err;
          res.json({
            user: item,
            token: token
          });
        }
      );
    });
  });

  app.get("/users/logout", function(req, res) {
    req.session.reset();
    res.redirect("/");
  });

  // UPDATE an existing using where _id = id
  app.put("/user", (req, res) => {
    const details = { _id: new ObjectID(req.body.id) };
    const items = omit(req.body, ['id']);
    const updates = {$set: items};
    Users.findOneAndUpdate(details, updates, {returnOriginal: false}, (err, item) => {
      if (err) {
        res.send({ error: "Cannot find user" });
      } else {
        return res.send(item.value)
      }
    });
  });

  // DELETE a user where query param id = _id
  app.delete("/user/:id", (req, res) => {
    const details = { _id: new ObjectID(req.params.id) };
    Users.removeOne(details, (err, item) => {
      if (err) {
        res.send({ error: "An error has occurred" });
      } else {
        return res.send(item)
      }
    });
  });
};
