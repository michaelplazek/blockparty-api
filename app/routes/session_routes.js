module.exports = function(app, db) {

    app.post('/login', (req, res) => {
        const user = {
            username: req.body.username,
            password: req.body.password,
        };
        db.collection('users').findOne(user, (err, item) => {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                res.send(item);
            }
        });
    });
};