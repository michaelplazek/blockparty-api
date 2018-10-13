module.exports = function(app, db) {

    app.post('/login', (req, res) => {
        const user = {
            email: req.body.email,
            password: req.body.password,
        };
        db.collection('users').findOne(user, (err, item) => {
            if (!item) {
                res.send({'error':'An error has occurred'});
            } else {
                if (user.password === item.password) { // user is valid

                    // set the session to be valid
                    req.session.user = item;

                    // return the user info
                    res.send(item);
                } else {
                    res.send({'error':'An error has occurred'});
                }
            }
        });
    });

    app.get('/logout', function(req, res) {
        req.session.reset();
        res.redirect('/');
    });
};
