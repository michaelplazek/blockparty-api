const ObjectID = require('mongodb').ObjectID;

module.exports = function(app, db) {

    app.get('/posts/:id', (req, res) => {
        const details = { '_id':  new ObjectID(req.params.id) };
            db.collection('posts').findOne(details, (err, item) => {
                if (err) {
                res.send({'error':'An error has occurred'});
                } else {
                    res.send(item);
                }
            });
        });

    app.post('/posts', (req, res) => {
        const post = {
            coin: req.body.coin,
            owner: req.body.owner,
            location: req.body.location,
            timestamp: new Date(),
            message: req.body.message,
            price: req.body.price
        };
        db.collection('posts').insert(post, (err, result) => {
            if (err) {
                res.send({ 'error': 'An error has occurred' });
            } else {
                res.send(result.ops[0]);
            }
        });
    });

    app.delete('/posts/:id', (req, res) => {
        const id = req.params.id;
        const details = { '_id': new ObjectID(id) };
        db.collection('posts').remove(details, (err, item) => {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                res.send('Post ' + id + ' deleted!');
            }
        });
    });

    app.put('/posts/:id', (req, res) => {
        const id = req.params.id;
        const details = { '_id': new ObjectID(id) };
        const post = {
            coin: req.body.coin,
            owner: req.body.owner,
            location: req.body.location,
            timestamp: new Date(),
            message: req.body.message,
            price: req.body.price
        };
        db.collection('posts').update(details, post, (err, result) => {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                res.send(post);
            }
        });
    });
};
