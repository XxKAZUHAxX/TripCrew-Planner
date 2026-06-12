import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireMembership, requireCreator } from '../middleware/trip.middleware.js';
import {
  createTrip,
  listMyTrips,
  getTrip,
  updateTrip,
  joinTrip,
  toggleInvite,
} from '../controllers/trips.controller.js';

const router = Router();

router.post('/', requireAuth, createTrip);
router.get('/', requireAuth, listMyTrips);
router.post('/join/:inviteCode', requireAuth, joinTrip);
router.get('/:tripId', requireAuth, requireMembership, getTrip);
router.patch('/:tripId', requireAuth, requireMembership, requireCreator, updateTrip);
router.patch('/:tripId/invite', requireAuth, requireMembership, requireCreator, toggleInvite);

export default router;
