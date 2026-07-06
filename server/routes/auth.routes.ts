import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, me, resetPassword } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Unauthenticated + weak (name+email) identity check, so throttle by IP.
const resetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many password reset attempts. Please try again later.' },
});

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetLimiter, resetPassword);
router.get('/me', requireAuth, me);

export default router;
