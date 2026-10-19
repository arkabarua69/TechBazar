const ErrorHandler = require("../utils/errorHandler");
const { notifyErrorEvent } = require("../utils/discordNotify");

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    // MongoDB invalid ObjectId
    if (err.name === "CastError") {
        const message = `Resource Not Found. Invalid: ${err.path}`;
        err = new ErrorHandler(message, 400);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        err = new ErrorHandler(message, 400);
    }

    // JWT expired — check name (not code)
    if (err.name === "TokenExpiredError") {
        err = new ErrorHandler("Token has expired. Please login again", 401);
    }

    // JWT malformed — check name (not code)
    if (err.name === "JsonWebTokenError") {
        err = new ErrorHandler("Invalid token. Please login again", 401);
    }

    // Discord alert for genuine server faults only (5xx). Client errors (4xx)
    // are expected and would only spam the channel. Best-effort, never awaited.
    if (err.statusCode >= 500) {
        notifyErrorEvent(err, {
            statusCode: err.statusCode,
            method: req?.method,
            url: req?.originalUrl || req?.url,
            user: req?.user,
        }).catch(() => {});
    }

    // Don't leak stack traces in production
    const response = {
        success: false,
        message: err.message,
    };

    if (process.env.NODE_ENV !== 'production') {
        response.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
};
