import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireMembership } from '../middleware/trip.middleware.js';
import {
    saveAvailability,
    getMyAvailability,
    getHeatmap,
    getAvailabilitySummary,
    optOut,
} from '../controllers/availability.controller.js';

// Mounted at /api/trips/:tripId/availability
const router = Router({ mergeParams: true });

router.put('/', requireAuth, requireMembership, saveAvailability);
router.post('/opt-out', requireAuth, requireMembership, optOut);
router.get('/me', requireAuth, requireMembership, getMyAvailability);
router.get('/heatmap', requireAuth, requireMembership, getHeatmap);
router.get('/summary', requireAuth, requireMembership, getAvailabilitySummary);

export default router;
