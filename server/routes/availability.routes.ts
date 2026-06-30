import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireMembership } from '../middleware/trip.middleware.js';
import {
    saveAvailability,
    getMyAvailability,
    getHeatmap,
} from '../controllers/availability.controller.js';

// Mounted at /api/trips/:tripId/availability
const router = Router({ mergeParams: true });

router.put('/', requireAuth, requireMembership, saveAvailability);
router.get('/me', requireAuth, requireMembership, getMyAvailability);
router.get('/heatmap', requireAuth, requireMembership, getHeatmap);

export default router;
