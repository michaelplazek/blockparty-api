const jwt = require("jsonwebtoken");
const omit = require('lodash/omit');
const ObjectID = require("mongodb").ObjectID;

const SEC = 1000;
const MIN = SEC * 60;

function updateRemote(Remote, ip, attempts, nextTry) {
  const details = { ip };
  const updates = { ip, attempts, nextTry };
  return new Promise((resolve, reject) => {
    Remote.findOneAndUpdate(details, updates, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  })
}

function cleanup(Remote) {
  const MINS30 = MIN * 30;
  const MINS10 = MIN * 10;
  setTimeout(() => {
    const filter = {
      attempts: { $gt: 5 },
      nextTry: { $lt: Date.now() - MINS10 }
    };
    Remote.deleteMany(filter, err => {
      if (err) throw err;
    })
  }, MINS30);
}

function generateToken(user) {
  const u = {
    username: user.username,
    _id: user._id.toString()
  };
  return jwt.sign(u, process.env.SESSION_SECRET, {
    expiresIn: 60 * 60 * 24 // expires in 24 hours
  });
}

function login(Users, Remote, remote, req, res) {
  const { ip, attempts, nextTry } = remote;
  Users.findOne(
    { username: req.body.username },
    (err, user) => {
      if (err) throw err;
      if (!user) {
        return updateRemote(Remote, ip, attempts, nextTry)
          .then(() => {
            return res.status(404).json({
              error: true,
              message: "Incorrect username or password"
            });
          })
      }
      // use bcrypt here
      if (req.body.password === user.password) {
        const token = generateToken(user);
        return updateRemote(Remote, ip, 0, null)
          .then(() => {
            res.json({
              user: user,
              token: token,
              id: user._id.toString()
            });
          })
      } else {
        return updateRemote(Remote, ip, attempts, nextTry)
          .then(() => {
            return res.status(404).json({
              error: true,
              message: "Incorrect username or password"
            });
          })
      }
    }
  );
}

module.exports = function(app, db) {

  const Users = db.collection("users");
  const Remote = db.collection("remote");

  app.post("/users/login", (req, res) => {
    const { ip } = req;
    Remote.findOne({ ip }, (err, remote) => {
      if (err) throw err;
      if (remote) {
        const { attempts, nextTry } = remote;
        let newNextTry, newAttempts;
        newAttempts = attempts + 1;
        newNextTry = newAttempts > 4 ? Date.now() + (MIN * attempts) : null;
        if (newAttempts > 4) {
          updateRemote(Remote, ip, newAttempts, newNextTry)
        }
        if (nextTry && Date.now() < nextTry) {
          const diff = Math.floor(((nextTry - Date.now())/1000)/60);
          cleanup(Remote);
          return res.status(401).json({
            error: true,
            message: `Access denied: must wait ${diff} minutes until next attempt`
          });
        } else {
          const r = { ip, attempts: newAttempts, nextTry: newNextTry };
          return login(Users, Remote, r, req, res);
        }
      } else {
        Remote.insertOne({ ip, attempts: 1, nextTry: null }, (err, remoteDetails) => {
          if (err) throw err;
          else {
            return login(Users, Remote, remoteDetails.ops[0], req, res);
          }
        });
      }
    })
  });

  app.post("/users/signup", (req, res, next) => {
    const user = {
      username: req.body.username,
      password: req.body.password,
      created: new Date(),
      bio: "This is my bio",
      completedTransactions: 0,
      cancelledTransactions: 0
    };

    // find if username already exists
    Users.findOne( { username: { $eq: req.body.username } } , (err, userCheck) => {
      if (err) throw err;
      else {

        // username already exists
        if (userCheck !== null) {
          return res.status(404).json({
            error: true,
            message: "Username already exists"
          });
        }

        // username does not exists
        else {
          Users.insertOne(user, err => {
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
        }
      }
    });
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
