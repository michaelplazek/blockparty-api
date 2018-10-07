const ObjectID = require('mongodb').ObjectID;

module.exports = function(app, db) {

    app.post('/users', (req, res) => {
        const user = {
            username: req.body.username,
            password: req.body.password,
        };
        db.collection('users').insert(user, (err, result) => {
            if (err) {
                res.send({ 'error': 'An error has occurred' });
            } else {
                res.send(result.ops[0]);
            }
        });
    });
};