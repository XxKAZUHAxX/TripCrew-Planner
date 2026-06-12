import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  requireMembership,
  requireCreator,
  requireDecided,
} from '../middleware/trip.middleware.js';
import {
  getPlaybook,
  updateInstructions,
  addTask,
  toggleTask,
  deleteTask,
} from '../controllers/playbook.controller.js';

// Mounted at /api/trips/:tripId/playbook
// Every route is gated by requireDecided -> 403 while status is 'voting'.
const router = Router({ mergeParams: true });

router.get('/', requireAuth, requireMembership, requireDecided, getPlaybook);
router.patch(
  '/instructions',
  requireAuth,
  requireMembership,
  requireDecided,
  requireCreator,
  updateInstructions
);
router.post('/tasks', requireAuth, requireMembership, requireDecided, addTask);
router.patch('/tasks/:taskId/toggle', requireAuth, requireMembership, requireDecided, toggleTask);
router.delete('/tasks/:taskId', requireAuth, requireMembership, requireDecided, deleteTask);

export default router;
