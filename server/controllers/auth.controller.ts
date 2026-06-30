import type { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';
import { issueToken } from '../middleware/auth.middleware.js';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ message: 'name, email and password are required' });
            return;
        }
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            res.status(409).json({ message: 'Email already registered' });
            return;
        }
        const user = new User({ name, email });
        await user.setPassword(password);
        await user.save();
        const token = issueToken(user);
        res.status(201).json({ token, user: user.toSafeJSON() });
    } catch (err) {
        next(err);
    }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'email and password are required' });
            return;
        }
        const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const ok = await user.verifyPassword(password);
        if (!ok) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const token = issueToken(user);
        res.json({ token, user: user.toSafeJSON() });
    } catch (err) {
        next(err);
    }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json({ user: user.toSafeJSON() });
    } catch (err) {
        next(err);
    }
}
