import Trip from '../models/Trip.js';

// Loads the trip from :tripId and verifies the authenticated user is a member.
// Attaches req.trip so controllers avoid a second fetch.
export async function requireMembership(req, res, next) {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    if (!trip.isMember(req.user.id)) {
      return res.status(403).json({ message: 'You are not a member of this trip' });
    }
    req.trip = trip;
    next();
  } catch (err) {
    next(err);
  }
}

// Must run AFTER requireMembership (relies on req.trip).
export function requireCreator(req, res, next) {
  if (!req.trip) {
    return res.status(500).json({ message: 'requireCreator used without requireMembership' });
  }
  if (!req.trip.isCreator(req.user.id)) {
    return res.status(403).json({ message: 'Only the trip creator can perform this action' });
  }
  next();
}

// Playbook gate: blocks access while the trip is still in the voting phase.
export function requireDecided(req, res, next) {
  if (!req.trip) {
    return res.status(500).json({ message: 'requireDecided used without requireMembership' });
  }
  if (req.trip.status === 'voting') {
    return res.status(403).json({ message: 'Playbook is locked until a destination is decided' });
  }
  next();
}
