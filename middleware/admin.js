
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const admin = async (req, res, next) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) {
            res.status(401).json({error: 'No token provided , access denied'});
        }
        const isVerified = jwt.verify(token, 'passwordKey');
        if (!isVerified) return res.status(401).json({msg: 'Token verification failed , authorization failed '});

        //IMPORTANT STEP
        const user = await User.findById(isVerified.id);
        if(user.type === 'user' || user.type === 'seller') {
            return res.status(401).json({msg: 'You are not an admin'});

        }
        req.user = isVerified.id;

        req.token = token;
        next();
    } catch (error) {
        res.status(500).send({error: error.message});
    }
}

module.exports = admin;