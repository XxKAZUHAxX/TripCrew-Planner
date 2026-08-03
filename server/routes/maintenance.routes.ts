import { Router } from 'express';
import { triggerCleanup } from '../controllers/maintenance.controller.js';

const router = Router();

router.post('/cleanup', triggerCleanup);

export default router;
