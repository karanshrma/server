const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) {
            res.status(401).json({error: 'No token provided , access denied'});
        }
        const isVerified = jwt.verify(token, 'passwordKey');
        if (!isVerified) return res.status(401).json({msg: 'Token verification failed , authorization failed '});

        //IMPORTANT STEP
        req.user = isVerified.id;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).send({error: error.message});
    }
}

module.exports = auth;