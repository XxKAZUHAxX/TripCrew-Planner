import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import Trip from '../models/Trip.js';
import Destination from '../models/Destination.js';
import Vote from '../models/Vote.js';
import Availability from '../models/Availability.js';
import { evaluateDeadlock } from '../utils/deadlock.js';
import { rankByScore } from '../utils/borda.js';

// The availability deadline may never precede the voting deadline: dates are
// only meaningful once a destination race is closing. Returns an error message
// when the pair is invalid, or null when it's acceptable.
function deadlineOrderError(
    votingDeadline: Date | null,
    availabilityDeadline: Date | null
): string | null {
    if (votingDeadline && availabilityDeadline && availabilityDeadline < votingDeadline) {
        return 'Availability deadline must be on or after the voting deadline.';
    }
    return null;
}

export async function createTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { title, startDate, endDate, votingDeadline, availabilityDeadline } = req.body;
        if (!title) {
            res.status(400).json({ message: 'title is required' });
            return;
        }
        const voting = votingDeadline ? new Date(votingDeadline) : null;
        const availability = availabilityDeadline ? new Date(availabilityDeadline) : null;
        const deadlineError = deadlineOrderError(voting, availability);
        if (deadlineError) {
            res.status(400).json({ message: deadlineError });
            return;
        }
        const userId = new Types.ObjectId(req.user.id);
        const trip = await Trip.create({
            title,
            creator: userId,
            members: [userId],
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            votingDeadline: voting,
            availabilityDeadline: availability,
        });
        res.status(201).json({ trip });
    } catch (err) {
        next(err);
    }
}

export async function listMyTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const trips = await Trip.find({ members: req.user.id }).sort({ updatedAt: -1 });
        res.json({ trips });
    } catch (err) {
        next(err);
    }
}

export async function getTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const trip = await req.trip.populate([
            { path: 'members', select: 'name email' },
            { path: 'creator', select: 'name email' },
            { path: 'winningDestination' },
        ]);
        const destinations = await Destination.find({ tripId: trip._id }).sort({ createdAt: 1 });
        res.json({ trip, members: trip.members, destinations });
    } catch (err) {
        next(err);
    }
}

export async function updateTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { title, startDate, endDate, votingDeadline, availabilityDeadline } = req.body;
        const trip = req.trip;

        // Resolve the post-update deadline pair so the ordering rule holds even
        // when only one of the two is being changed in this request.
        const nextVoting =
            votingDeadline !== undefined
                ? votingDeadline
                    ? new Date(votingDeadline)
                    : null
                : trip.votingDeadline;
        const nextAvailability =
            availabilityDeadline !== undefined
                ? availabilityDeadline
                    ? new Date(availabilityDeadline)
                    : null
                : trip.availabilityDeadline;
        const deadlineError = deadlineOrderError(nextVoting, nextAvailability);
        if (deadlineError) {
            res.status(400).json({ message: deadlineError });
            return;
        }

        if (title !== undefined) trip.title = title;
        if (startDate !== undefined) trip.startDate = startDate ? new Date(startDate) : null;
        if (endDate !== undefined) trip.endDate = endDate ? new Date(endDate) : null;
        if (votingDeadline !== undefined) trip.votingDeadline = nextVoting;
        if (availabilityDeadline !== undefined) trip.availabilityDeadline = nextAvailability;
        await trip.save();
        res.json({ trip });
    } catch (err) {
        next(err);
    }
}

export async function joinTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { inviteCode } = req.params;
        const trip = await Trip.findOne({ inviteCode });
        if (!trip) {
            res.status(404).json({ message: 'Invalid invite code' });
            return;
        }
        if (!trip.inviteActive) {
            res.status(403).json({ message: 'This invite link has been deactivated' });
            return;
        }
        if (trip.isMember(req.user.id)) {
            res.json({ trip });
            return;
        }
        trip.members.push(new Types.ObjectId(req.user.id));
        await trip.save();
        res.json({ trip });
    } catch (err) {
        next(err);
    }
}

export async function toggleInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { inviteActive } = req.body;
        if (typeof inviteActive !== 'boolean') {
            res.status(400).json({ message: 'inviteActive must be a boolean' });
            return;
        }
        req.trip.inviteActive = inviteActive;
        await req.trip.save();
        res.json({ trip: req.trip });
    } catch (err) {
        next(err);
    }
}

// Membership-free preview so an invitee can see what they're joining.
export async function previewTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { inviteCode } = req.params;
        const trip = await Trip.findOne({ inviteCode });
        if (!trip) {
            res.status(404).json({ message: 'This invite code is invalid or has expired.' });
            return;
        }
        res.json({
            title: trip.title,
            memberCount: trip.members.length,
            alreadyMember: trip.isMember(req.user.id),
            inviteActive: trip.inviteActive,
        });
    } catch (err) {
        next(err);
    }
}

// Creator-only: permanently delete the trip and all associated data.
export async function deleteTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const trip = req.trip;
        await Promise.all([
            Destination.deleteMany({ tripId: trip._id }),
            Vote.deleteMany({ tripId: trip._id }),
            Availability.deleteMany({ tripId: trip._id }),
        ]);
        await trip.deleteOne();
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}

// Non-creator member leaves the trip. Their vote/availability are removed.
export async function leaveTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const trip = req.trip;
        if (trip.isCreator(req.user.id)) {
            res.status(403).json({
                message: 'The host cannot leave the trip. Delete the trip instead.',
            });
            return;
        }
        trip.members = trip.members.filter((m) => !m.equals(req.user.id)) as typeof trip.members;
        await Promise.all([
            trip.save(),
            Vote.deleteOne({ tripId: trip._id, userId: req.user.id }),
            Availability.deleteOne({ tripId: trip._id, userId: req.user.id }),
        ]);
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}

// Conclude voting: the host may end early anytime; any member may trigger the
// post-deadline auto-resolution. A clear winner decides the trip; a tie routes
// to the Wheel of Destiny (status stays 'voting').
export async function concludeVoting(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const trip = req.trip;
        const [votes, destinations] = await Promise.all([
            Vote.find({ tripId: trip._id }),
            Destination.find({ tripId: trip._id }),
        ]);
        const deadlock = evaluateDeadlock(votes, destinations, {
            memberCount: trip.members.length,
            votingDeadline: trip.votingDeadline,
        });
        const deadlockStatus = {
            eligible: deadlock.eligible,
            tie: deadlock.tie,
            timeout: deadlock.timeout,
            slices: deadlock.slices,
        };

        // Already resolved — report current state idempotently.
        if (trip.status !== 'voting') {
            res.json({
                status: trip.status,
                winningDestinationId: trip.winningDestination
                    ? String(trip.winningDestination)
                    : undefined,
                wheel: false,
                deadlock: deadlockStatus,
            });
            return;
        }

        const isCreator = trip.isCreator(req.user.id);
        const deadlinePassed = trip.votingDeadline
            ? new Date() >= new Date(trip.votingDeadline)
            : false;

        // Non-hosts can only trigger auto-resolution once the deadline has passed.
        if (!isCreator && !deadlinePassed) {
            res.status(403).json({
                message: 'Only the host can conclude voting before the deadline.',
            });
            return;
        }

        const ranked = rankByScore(votes, destinations);
        const [first, second] = ranked;
        const noClearWinner =
            deadlock.tie ||
            deadlock.timeout ||
            !first ||
            first.score <= 0 ||
            Boolean(second && first.score === second.score);

        // A tie/deadlock cannot be auto-decided — the Wheel is required.
        if (noClearWinner) {
            res.json({ status: 'voting', wheel: true, deadlock: deadlockStatus });
            return;
        }

        trip.winningDestination = new Types.ObjectId(first!.destId);
        trip.status = 'decided';
        await trip.save();
        res.json({
            status: 'decided',
            winningDestinationId: first!.destId,
            wheel: false,
            deadlock: deadlockStatus,
        });
    } catch (err) {
        next(err);
    }
}
