const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const ErrorHandler = require('../utils/errorHandler');
const asyncErrorHandler = require('./asyncErrorHandler');

exports.isAuthenticatedUser = asyncErrorHandler(async (req, res, next) => {

    const { token } = req.cookies;

    if (!token) {
        return next(new ErrorHandler("Please Login to Access this resource", 401))
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decodedData.id);
        
        if (!user) {
            return next(new ErrorHandler("User account has been deleted or deactivated", 401));
        }
        
        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new ErrorHandler("Token has expired. Please login again", 401));
        }
        if (err.name === 'JsonWebTokenError') {
            return next(new ErrorHandler("Invalid token. Please login again", 401));
        }
        return next(err);
    }
});

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {

        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler(`Role: ${req.user.role} is not allowed`, 403));
        }
        next();
    }
}

// Like isAuthenticatedUser but never blocks the request: a valid token attaches
// req.user, otherwise the request continues as a guest (req.user stays null).
// Used by the checkout endpoint so logged-in buyers get an account order while
// guests still get a guest order — one endpoint, two order types.
exports.optionalAuth = asyncErrorHandler(async (req, res, next) => {
    const { token } = req.cookies || {};
    if (!token) return next();

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decodedData.id);
        if (user) req.user = user;
    } catch (err) {
        // invalid / expired token → treat as guest, don't block checkout
    }
    next();
});