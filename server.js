const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const db = require('./config/db');

const app = express();

const port = 8000;

app.use(bodyParser.json({ extended: true }));

// authentication middleware to check JWT token
app.use(function(req, res, next) {
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

// set headers for responses
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    next();
});

// connect database
MongoClient.connect(db.url, (err, database) => {
    if (err) return console.log(err);

    const db = database.db("cash-for-crypto-db");
    require('./app/routes')(app, db);

    app.listen(port, () => {
        console.log('We are live on ' + port);
    });
});