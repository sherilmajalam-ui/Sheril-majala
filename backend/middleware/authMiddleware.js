const jwt = require("jsonwebtoken");

// Checks the "Authorization: Bearer <token>" header and sets req.user
const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: "Please log in to continue" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch (error) {
        return res.status(401).json({ message: "Session expired. Please log in again" });
    }
};

module.exports = authMiddleware;
