import Trip from '../models/Trip.js';
import Vote from '../models/Vote.js';
import Availability from '../models/Availability.js';
import User from '../models/User.js';

// Feature 8 (DB storage optimization): periodically prune data that is no
// longer useful so the database doesn't grow with stale bookkeeping records.
//
// Policy (deliberately conservative — the Trip/Destination/Playbook data a
// group actually wants to keep is never touched):
//   1. Once a trip is decided/archived and hasn't been touched in 90 days,
//      its Vote and Availability documents are removed. The Trip, its
//      Destinations, and the Playbook (instructions/checklist) are untouched
//      so the group can still look back at what was decided.
//   2. A user who hasn't logged in for 12 months is flagged `inactiveAt`
//      (a "your account is dormant" marker). Logging in again clears it.
//   3. A user still inactive 6 months after being flagged (18 months total)
//      is hard-deleted — but ONLY if they don't own any trip and aren't a
//      member of any trip, so we never orphan a group's data or leave a
//      dangling reference behind.
const TRIP_DATA_GRACE_DAYS = 90;
const INACTIVE_AFTER_DAYS = 365;
const DELETE_AFTER_INACTIVE_DAYS = 180;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface CleanupSummary {
    staleTripsCleaned: number;
    votesDeleted: number;
    availabilityDeleted: number;
    usersMarkedInactive: number;
    usersDeleted: number;
}

// Removes Vote/Availability bookkeeping for trips that concluded long ago and
// haven't been touched since (no playbook edits, no checklist activity, etc).
async function cleanupStaleTripData(): Promise<{
    staleTripsCleaned: number;
    votesDeleted: number;
    availabilityDeleted: number;
}> {
    const cutoff = new Date(Date.now() - TRIP_DATA_GRACE_DAYS * DAY_MS);
    const staleTrips = await Trip.find(
        { status: { $ne: 'voting' }, updatedAt: { $lt: cutoff } },
        '_id'
    );
    if (staleTrips.length === 0) {
        return { staleTripsCleaned: 0, votesDeleted: 0, availabilityDeleted: 0 };
    }
    const tripIds = staleTrips.map((t) => t._id);
    const [votes, availability] = await Promise.all([
        Vote.deleteMany({ tripId: { $in: tripIds } }),
        Availability.deleteMany({ tripId: { $in: tripIds } }),
    ]);
    return {
        staleTripsCleaned: tripIds.length,
        votesDeleted: votes.deletedCount ?? 0,
        availabilityDeleted: availability.deletedCount ?? 0,
    };
}

// Flags dormant accounts, then hard-deletes ones that have stayed dormant well
// past the warning point and have no trip ownership/membership to protect.
async function cleanupInactiveUsers(): Promise<{
    usersMarkedInactive: number;
    usersDeleted: number;
}> {
    const now = new Date();
    const inactiveCutoff = new Date(now.getTime() - INACTIVE_AFTER_DAYS * DAY_MS);
    const marked = await User.updateMany(
        { lastLoginAt: { $lt: inactiveCutoff }, inactiveAt: null },
        { inactiveAt: now }
    );

    const deleteCutoff = new Date(now.getTime() - DELETE_AFTER_INACTIVE_DAYS * DAY_MS);
    const candidates = await User.find({ inactiveAt: { $ne: null, $lt: deleteCutoff } }, '_id');
    let usersDeleted = 0;
    for (const candidate of candidates) {
        const [ownsTrip, isMemberOfTrip] = await Promise.all([
            Trip.exists({ creator: candidate._id }),
            Trip.exists({ members: candidate._id }),
        ]);
        // Leave the account alone if it still has any trip footprint — the
        // user must leave/delete their trips first (or log back in).
        if (ownsTrip || isMemberOfTrip) continue;
        await candidate.deleteOne();
        usersDeleted += 1;
    }
    return { usersMarkedInactive: marked.modifiedCount ?? 0, usersDeleted };
}

// Best-effort: callers should not let a cleanup failure affect the request
// (startup or the maintenance endpoint) that triggered it.
export async function runDataCleanup(): Promise<CleanupSummary> {
    const [tripResult, userResult] = await Promise.all([
        cleanupStaleTripData(),
        cleanupInactiveUsers(),
    ]);
    return { ...tripResult, ...userResult };
}
