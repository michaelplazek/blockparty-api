const md5 = require('md5');

module.exports = function(app, db) {

    app.post('/login', (req, res) => {
        const user = {
            email: req.body.email,
            password: req.body.password,
        };

    //     db.collection('users').findOne({}, user, (err, item) => {
    //         if (!item) {
    //             res.status(404).send('User not found.');
    //         } else {
    //             if (user.password === item.password) { // user is valid
    //
    //                 // set the session to be valid
    //                 req.session.user = item;
    //
    //                 // return the user info
    //                 res.status(200).send(item);
    //             } else {
    //                 res.status(404).send('User not found.');
    //             }
    //         }
    //     });
    });

    app.get('/logout', function(req, res) {
        req.session.reset();
        res.redirect('/');
    });
};
