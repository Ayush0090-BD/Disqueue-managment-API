const jwt = require('jsonwebtoken');
function authenticateToken(req, res, next) { 
    const authHeader = req.headers['authorization'];
    if(typeof authHeader !== 'string') {
        return res.status(401).json({ error: 'Invalid authorization header' });
    }
    const parts = authHeader.split(' ');
// this is the middleware function that checks if the request has a valid JWT token in the authorization header
    if (parts.length !== 2 || parts[0] !== 'Bearer'|| !parts[1]) {
    return res.status(401).json({ error: 'Invalid authorization header' });
}
    const token = parts[1];

  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}
    module.exports = authenticateToken;