import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireMembership } from "../middleware/trip.middleware.js";
import {
    submitVote,
    getMyVote,
    getTally,
} from "../controllers/votes.controller.js";

// Mounted at /api/trips/:tripId
const router = Router({ mergeParams: true });

router.put("/vote", requireAuth, requireMembership, submitVote);
router.get("/vote", requireAuth, requireMembership, getMyVote);
router.get("/tally", requireAuth, requireMembership, getTally);

export default router;
