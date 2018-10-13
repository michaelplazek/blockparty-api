module.exports = function(app, db) {

    app.post('/users', (req, res) => {
        const user = {
            email: req.body.email,
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