import type { Request, Response, NextFunction } from 'express';

interface HttpError extends Error {
    status?: number;
    statusCode?: number;
}

// Centralized error handler. Keeps route handlers free of repetitive error formatting.
export function notFound(req: Request, res: Response, _next: NextFunction): void {
    res.status(404).json({
        message: `Not found: ${req.method} ${req.originalUrl}`,
    });
}

export function errorHandler(
    err: HttpError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal server error';
    if (status >= 500) {
        console.error(err);
    }
    res.status(status).json({ message });
}
