import Destination from '../models/Destination.js';
import { BUDGET_TIERS } from '../models/Destination.js';

export async function proposeDestination(req, res, next) {
  try {
    const { name, description, budgetTier } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'name is required' });
    }
    if (budgetTier && !BUDGET_TIERS.includes(budgetTier)) {
      return res.status(400).json({ message: `budgetTier must be one of ${BUDGET_TIERS.join(', ')}` });
    }
    const destination = await Destination.create({
      tripId: req.trip._id,
      name,
      description: description || '',
      budgetTier: budgetTier || 'medium',
      proposedBy: req.user.id,
    });
    res.status(201).json({ destination });
  } catch (err) {
    next(err);
  }
}

export async function listDestinations(req, res, next) {
  try {
    const destinations = await Destination.find({ tripId: req.trip._id })
      .populate('proposedBy', 'name email')
      .sort({ createdAt: 1 });
    res.json({ destinations });
  } catch (err) {
    next(err);
  }
}

export async function deleteDestination(req, res, next) {
  try {
    const destination = await Destination.findOne({
      _id: req.params.id,
      tripId: req.trip._id,
    });
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    // Only the proposer or the trip creator may delete.
    const isProposer = destination.proposedBy.equals(req.user.id);
    const isCreator = req.trip.isCreator(req.user.id);
    if (!isProposer && !isCreator) {
      return res.status(403).json({ message: 'Only the proposer or trip creator can delete this' });
    }
    await destination.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
