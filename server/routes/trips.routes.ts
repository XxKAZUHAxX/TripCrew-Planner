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
    previewTrip,
    deleteTrip,
    leaveTrip,
    concludeVoting,
    updatePlaybookEditors,
} from '../controllers/trips.controller.js';

const router = Router();

router.post('/', requireAuth, createTrip);
router.get('/', requireAuth, listMyTrips);
router.get('/preview/:inviteCode', requireAuth, previewTrip);
router.post('/join/:inviteCode', requireAuth, joinTrip);
router.get('/:tripId', requireAuth, requireMembership, getTrip);
router.patch('/:tripId', requireAuth, requireMembership, requireCreator, updateTrip);
router.delete('/:tripId', requireAuth, requireMembership, requireCreator, deleteTrip);
router.post('/:tripId/leave', requireAuth, requireMembership, leaveTrip);
router.post('/:tripId/conclude', requireAuth, requireMembership, concludeVoting);
router.patch('/:tripId/invite', requireAuth, requireMembership, requireCreator, toggleInvite);

router.patch(
    '/:tripId/playbook-editors',
    requireAuth,
    requireMembership,
    requireCreator,
    updatePlaybookEditors
);

export default router;
