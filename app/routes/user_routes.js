const jwt = require("jsonwebtoken");
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
  app.post("/users/signup", (req, res, next) => {
    const user = {
      username: req.body.username,
      password: req.body.password
    };
    db.collection("users").insert(user, err => {
      if (err) throw err;
      else {
        const token = generateToken(user);
        res.json({
          user: user,
          token: token
        });
      }
    });
  });

  app.post("/users/login", (req, res) => {
    db.collection("users").findOne(
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
            token: token
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
      db.collection("users").findOne(
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
};
