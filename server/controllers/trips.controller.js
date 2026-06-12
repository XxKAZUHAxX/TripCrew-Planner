import Trip from '../models/Trip.js';
import Destination from '../models/Destination.js';

export async function createTrip(req, res, next) {
  try {
    const { title, startDate, endDate, votingDeadline } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'title is required' });
    }
    const trip = await Trip.create({
      title,
      creator: req.user.id,
      members: [req.user.id],
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      votingDeadline: votingDeadline ? new Date(votingDeadline) : null,
    });
    res.status(201).json({ trip });
  } catch (err) {
    next(err);
  }
}

export async function listMyTrips(req, res, next) {
  try {
    const trips = await Trip.find({ members: req.user.id }).sort({ updatedAt: -1 });
    res.json({ trips });
  } catch (err) {
    next(err);
  }
}

export async function getTrip(req, res, next) {
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

export async function updateTrip(req, res, next) {
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

export async function joinTrip(req, res, next) {
  try {
    const { inviteCode } = req.params;
    const trip = await Trip.findOne({ inviteCode });
    if (!trip) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }
    if (!trip.inviteActive) {
      return res.status(403).json({ message: 'This invite link has been deactivated' });
    }
    if (trip.isMember(req.user.id)) {
      return res.json({ trip });
    }
    trip.members.push(req.user.id);
    await trip.save();
    res.json({ trip });
  } catch (err) {
    next(err);
  }
}

export async function toggleInvite(req, res, next) {
  try {
    const { inviteActive } = req.body;
    if (typeof inviteActive !== 'boolean') {
      return res.status(400).json({ message: 'inviteActive must be a boolean' });
    }
    req.trip.inviteActive = inviteActive;
    await req.trip.save();
    res.json({ trip: req.trip });
  } catch (err) {
    next(err);
  }
}
