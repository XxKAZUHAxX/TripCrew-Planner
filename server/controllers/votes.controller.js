import Vote from '../models/Vote.js';
import Destination from '../models/Destination.js';
import { rankByScore } from '../utils/borda.js';

// Upsert the caller's ranked vote. On any re-submission, changeCount increments.
export async function submitVote(req, res, next) {
  try {
    const { ranking } = req.body;
    if (!Array.isArray(ranking)) {
      return res.status(400).json({ message: 'ranking must be an array of destination ids' });
    }
    // Validate every id belongs to this trip.
    const tripDestinations = await Destination.find({ tripId: req.trip._id }).select('_id');
    const validIds = new Set(tripDestinations.map((d) => d._id.toString()));
    for (const id of ranking) {
      if (!validIds.has(String(id))) {
        return res.status(400).json({ message: `Invalid destination id in ranking: ${id}` });
      }
    }
    const uniqueCount = new Set(ranking.map(String)).size;
    if (uniqueCount !== ranking.length) {
      return res.status(400).json({ message: 'ranking must not contain duplicates' });
    }

    const existing = await Vote.findOne({ tripId: req.trip._id, userId: req.user.id });
    let vote;
    if (existing) {
      existing.ranking = ranking;
      existing.changeCount += 1;
      vote = await existing.save();
    } else {
      vote = await Vote.create({
        tripId: req.trip._id,
        userId: req.user.id,
        ranking,
        changeCount: 0,
      });
    }
    res.json({ vote });
  } catch (err) {
    next(err);
  }
}

export async function getMyVote(req, res, next) {
  try {
    const vote = await Vote.findOne({ tripId: req.trip._id, userId: req.user.id });
    res.json({ vote });
  } catch (err) {
    next(err);
  }
}

export async function getTally(req, res, next) {
  try {
    const [votes, destinations] = await Promise.all([
      Vote.find({ tripId: req.trip._id }),
      Destination.find({ tripId: req.trip._id }),
    ]);
    const scores = rankByScore(votes, destinations);
    res.json({ scores });
  } catch (err) {
    next(err);
  }
}
