const ObjectID = require('mongodb').ObjectID;

module.exports = function(app, db) {

    app.get('/asks', (req, res) => {
        db.collection('asks').find({}, (err, data) => {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                data.toArray((err, datum) => {
                    res.send(datum);
                })
            }
        });
    });

    app.get('/ask', (req, res) => {
        const details = { '_id':  new ObjectID(req.query.id) };
            db.collection('asks').findOne(details, (err, item) => {
                if (err) {
                res.send({'error':'An error has occurred'});
                } else {
                    res.send(item);
                }
            });
        });

    app.post('/asks', (req, res) => {
        const post = {
					coin: req.body.coin,
					owner: req.body.owner,
					// location: req.body.location,
					timestamp: new Date(),
					// message: req.body.message,
					price: req.body.price,
					volume: req.body.volume,
					// contact: req.body.contact,
					lat: req.body.lat,
					lng: req.body.lng,
        };
        db.collection('asks').insert(post, (err, result) => {
            if (err) {
                res.send({ 'error': 'An error has occurred' });
            } else {
                res.send(result.ops[0]);
            }
        });
    });

    app.delete('/ask', (req, res) => {
        const id = req.query.id;
        const details = { '_id': new ObjectID(id) };
        db.collection('asks').remove(details, (err, item) => {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                res.send('Post ' + id + ' deleted!');
            }
        });
    });

    app.put('/ask', (req, res) => {
        const id = req.query.id;
        const details = { '_id': new ObjectID(id) };
        const post = {
					coin: req.body.coin,
					owner: req.body.owner,
					// location: req.body.location,
					timestamp: new Date(),
					// message: req.body.message,
					price: req.body.price,
					volume: req.body.volume,
					// contact: req.body.contact,
					lat: req.body.lat,
					lng: req.body.lng,
        };
        db.collection('asks').update(details, post, (err, result) => {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                res.send(post);
            }
        });
    });
};
