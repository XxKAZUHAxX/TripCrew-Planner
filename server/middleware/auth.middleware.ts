import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { AuthUser } from '../types/express.js';

// This module is the SINGLE place that understands JWT. To migrate to
// Firebase Auth later, rewrite only this file to verify a Firebase ID token
// and populate req.user — no downstream code needs to change.

interface TokenSubject {
    _id: { toString(): string };
    email: string;
}

function getSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined');
    }
    return secret;
}

export function issueToken(user: TokenSubject): string {
    const payload = { sub: user._id.toString(), email: user.email };
    const options: SignOptions = {
        expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
    };
    return jwt.sign(payload, getSecret(), options);
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    try {
        const header = req.headers.authorization || '';
        const [scheme, token] = header.split(' ');
        if (scheme !== 'Bearer' || !token) {
            res.status(401).json({ message: 'Missing or malformed Authorization header' });
            return;
        }
        const payload = jwt.verify(token, getSecret()) as { sub: string; email: string };
        const user: AuthUser = { id: payload.sub, email: payload.email };
        req.user = user;
        next();
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
}
