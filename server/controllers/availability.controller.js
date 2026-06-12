import mongoose from 'mongoose';
import Availability from '../models/Availability.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Upsert the caller's available dates for this trip (idempotent).
export async function saveAvailability(req, res, next) {
  try {
    const { dates } = req.body;
    if (!Array.isArray(dates) || !dates.every((d) => typeof d === 'string' && DATE_RE.test(d))) {
      return res.status(400).json({ message: 'dates must be an array of YYYY-MM-DD strings' });
    }
    const unique = [...new Set(dates)].sort();
    const availability = await Availability.findOneAndUpdate(
      { tripId: req.trip._id, userId: req.user.id },
      { $set: { dates: unique } },
      { new: true, upsert: true }
    );
    res.json({ availability });
  } catch (err) {
    next(err);
  }
}

export async function getMyAvailability(req, res, next) {
  try {
    const doc = await Availability.findOne({ tripId: req.trip._id, userId: req.user.id });
    res.json({ dates: doc ? doc.dates : [] });
  } catch (err) {
    next(err);
  }
}

// Aggregated heatmap: { "YYYY-MM-DD": count, ... }
export async function getHeatmap(req, res, next) {
  try {
    const tripId = new mongoose.Types.ObjectId(req.trip._id);
    const result = await Availability.aggregate([
      { $match: { tripId } },
      { $unwind: '$dates' },
      { $group: { _id: '$dates', count: { $sum: 1 } } },
      { $project: { _id: 0, k: '$_id', v: '$count' } },
      { $group: { _id: null, pairs: { $push: { k: '$k', v: '$v' } } } },
      { $replaceRoot: { newRoot: { $ifNull: [{ $arrayToObject: '$pairs' }, {}] } } },
    ]);
    res.json(result[0] || {});
  } catch (err) {
    next(err);
  }
}
