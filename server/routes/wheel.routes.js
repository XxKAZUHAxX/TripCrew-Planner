import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireMembership, requireCreator } from '../middleware/trip.middleware.js';
import { getWheelStatus, spinWheel } from '../controllers/wheel.controller.js';

// Mounted at /api/trips/:tripId/wheel
const router = Router({ mergeParams: true });

router.get('/status', requireAuth, requireMembership, getWheelStatus);
router.post('/spin', requireAuth, requireMembership, requireCreator, spinWheel);

export default router;
