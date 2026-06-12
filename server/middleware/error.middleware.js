// Centralized error handler. Keeps route handlers free of repetitive error formatting.
export function notFound(req, res, next) {
    res.status(404).json({
        message: `Not found: ${req.method} ${req.originalUrl}`,
    });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal server error";
    if (status >= 500) {
        console.error(err);
    }
    res.status(status).json({ message });
}
