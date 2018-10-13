const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const session = require('client-sessions');
const db = require('./config/db');

const app = express();

const port = 8000;

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    cookieName: 'session',
    secret: process.env.SESSION_SECRET,
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
    httpOnly: false,
    secure: true,
    ephemeral: true
}));

app.use(function(req, res, next) {
    if (req.session && req.session.user) {
        User.findOne({ email: req.session.user.email }, function(err, user) {
            if (user) {
                req.user = user;
                delete req.user.password; // delete the password from the session
                req.session.user = user;  //refresh the session value
                res.locals.user = user;
            }
            // finishing processing the middleware and run the route
            next();
        });
    } else {
        next();
    }
});

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    next();
});

MongoClient.connect(db.url, (err, database) => {
    if (err) return console.log(err);

    const db = database.db("cash-for-crypto-db");
    require('./app/routes')(app, db);
    app.listen(port, () => {
        console.log('We are live on ' + port);
    });
});