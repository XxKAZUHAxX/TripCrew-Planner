import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import Trip from '../models/Trip.js';
import Destination from '../models/Destination.js';

export async function createTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { title, startDate, endDate, votingDeadline } = req.body;
        if (!title) {
            res.status(400).json({ message: 'title is required' });
            return;
        }
        const userId = new Types.ObjectId(req.user.id);
        const trip = await Trip.create({
            title,
            creator: userId,
            members: [userId],
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            votingDeadline: votingDeadline ? new Date(votingDeadline) : null,
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
        const { title, startDate, endDate, votingDeadline } = req.body;
        const trip = req.trip;
        if (title !== undefined) trip.title = title;
        if (startDate !== undefined) trip.startDate = startDate ? new Date(startDate) : null;
        if (endDate !== undefined) trip.endDate = endDate ? new Date(endDate) : null;
        if (votingDeadline !== undefined) {
            trip.votingDeadline = votingDeadline ? new Date(votingDeadline) : null;
        }
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
