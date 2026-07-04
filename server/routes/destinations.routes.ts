import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireMembership } from '../middleware/trip.middleware.js';
import {
    proposeDestination,
    listDestinations,
    deleteDestination,
    updateDestination,
    addComment,
    deleteComment,
} from '../controllers/destinations.controller.js';

// Mounted at /api/trips/:tripId/destinations
const router = Router({ mergeParams: true });

router.post('/', requireAuth, requireMembership, proposeDestination);
router.get('/', requireAuth, requireMembership, listDestinations);
router.patch('/:id', requireAuth, requireMembership, updateDestination);
router.delete('/:id', requireAuth, requireMembership, deleteDestination);
router.post('/:id/comments', requireAuth, requireMembership, addComment);
router.delete('/:id/comments/:commentId', requireAuth, requireMembership, deleteComment);

export default router;
