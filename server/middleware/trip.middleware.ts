import type { Request, Response, NextFunction } from 'express';
import Trip from '../models/Trip.js';

// Loads the trip from :tripId and verifies the authenticated user is a member.
// Attaches req.trip so controllers avoid a second fetch.
export async function requireMembership(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const trip = await Trip.findById(req.params.tripId);
        if (!trip) {
            res.status(404).json({ message: 'Trip not found' });
            return;
        }
        if (!trip.isMember(req.user.id)) {
            res.status(403).json({ message: 'You are not a member of this trip' });
            return;
        }
        req.trip = trip;
        next();
    } catch (err) {
        next(err);
    }
}

// Must run AFTER requireMembership (relies on req.trip).
export function requireCreator(req: Request, res: Response, next: NextFunction): void {
    if (!req.trip) {
        res.status(500).json({ message: 'requireCreator used without requireMembership' });
        return;
    }
    if (!req.trip.isCreator(req.user.id)) {
        res.status(403).json({ message: 'Only the trip creator can perform this action' });
        return;
    }
    next();
}

// Playbook gate: blocks access while the trip is still in the voting phase.
export function requireDecided(req: Request, res: Response, next: NextFunction): void {
    if (!req.trip) {
        res.status(500).json({ message: 'requireDecided used without requireMembership' });
        return;
    }
    if (req.trip.status === 'voting') {
        res.status(403).json({ message: 'Playbook is locked until a destination is decided' });
        return;
    }
    next();
}

// Playbook edit gate (Feature 9): the creator or any granted editor may pass.
// Must run AFTER requireMembership (relies on req.trip).
export function requirePlaybookEditor(req: Request, res: Response, next: NextFunction): void {
    if (!req.trip) {
        res.status(500).json({ message: 'requirePlaybookEditor used without requireMembership' });
        return;
    }
    if (!req.trip.canEditPlaybook(req.user.id)) {
        res.status(403).json({ message: 'You do not have permission to edit the playbook' });
        return;
    }
    next();
}
