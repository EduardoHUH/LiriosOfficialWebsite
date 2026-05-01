const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }

    try {
        const clean = token.replace("Bearer ", "");
        const decoded = jwt.verify(clean, process.env.JWT_SECRET);

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
}

module.exports = verifyToken;