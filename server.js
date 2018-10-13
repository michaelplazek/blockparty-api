const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const db = require('./config/db');

const app = express();

const port = 8000;

app.use(bodyParser.json({ extended: true }));

// middleware that checks if JWT token exists and verifies it if it does exist.
// In all the future routes, this helps to know if the request is authenticated or not.
app.use(function(req, res, next) {
    // check header or url parameters or post parameters for token
    let token = req.headers['authorization'];
    if (!token) return next(); //if no token, continue

    token = token.replace('Bearer ', '');

    jwt.verify(token, process.env.SESSION_SECRET, function(err, user) {
        if (err) {
            return res.status(401).json({
                success: false,
                message: 'Must register or sign in.'
            });
        } else {
            req.user = user;
            next();
        }
    });
});

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

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