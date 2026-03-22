/**
 * apiError.js
 * Lightweight custom error class that carries an HTTP status code.
 * Caught by the global error handler in app.js.
 */
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ApiError';
    }
}

module.exports = ApiError;
