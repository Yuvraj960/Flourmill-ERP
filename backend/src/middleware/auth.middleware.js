const jwt = require('jsonwebtoken');
const ApiError = require('../utils/apiError');

/**
 * verifyToken — validates Bearer JWT in Authorization header.
 * Attaches decoded payload as req.user = { userId, role }.
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    if (!token) {
        return next(new ApiError(401, 'Access denied. No token provided.'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { userId, role }
        next();
    } catch (err) {
        return next(new ApiError(401, 'Invalid or expired token.'));
    }
}

/**
 * requireAdmin — must be used AFTER verifyToken.
 * Rejects requests from non-admin users.
 */
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'ADMIN') {
        return next(new ApiError(403, 'Forbidden. Admin access only.'));
    }
    next();
}

module.exports = { verifyToken, requireAdmin };
