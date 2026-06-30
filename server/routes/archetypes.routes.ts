import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireMembership } from '../middleware/trip.middleware.js';
import { getArchetypes, getDashboard } from '../controllers/archetypes.controller.js';

// Mounted at /api/trips/:tripId
const router = Router({ mergeParams: true });

router.get('/archetypes', requireAuth, requireMembership, getArchetypes);
router.get('/dashboard', requireAuth, requireMembership, getDashboard);

export default router;
