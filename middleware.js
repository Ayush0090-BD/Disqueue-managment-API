function authenticateToken(req, res, next) { 
    const authHeader = req.headers['authorization'];
    if (typeof authHeader !== 'string') {
        return res.status(401).json({ error: 'invalid header' });
    }
    const [scheme,token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'invalid header' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}
    module.exports = authenticateToken;