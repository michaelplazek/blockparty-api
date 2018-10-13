const jwt = require('jsonwebtoken');

export function generateToken(user) {

    const u = {
        email: user.email,
        _id: user._id.toString(),
    };
    return jwt.sign(u, process.env.SESSION_SECRET, {
        expiresIn: 60 * 60 * 24 // expires in 24 hours
    });
}