import { describe, it, beforeAll, afterAll } from 'vitest';
import { Types } from 'mongoose';
import { boot, assert, type Harness } from './harness.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import Vote from '../models/Vote.js';

describe('maintenance (Feature 8)', () => {
    let h: Harness;
    beforeAll(async () => {
        h = await boot();
        process.env.MAINTENANCE_SECRET = 'test-maintenance-secret';
    });
    afterAll(async () => {
        delete process.env.MAINTENANCE_SECRET;
        await h.teardown();
    });

    function cleanup(): Promise<{ status: number; data: Record<string, unknown> }> {
        return h.api('POST', '/api/maintenance/cleanup', {
            headers: { 'x-maintenance-key': 'test-maintenance-secret' },
        });
    }

    it('requires the maintenance secret', async () => {
        const missing = await h.api('POST', '/api/maintenance/cleanup', {});
        assert(missing.status === 403, 'missing key rejected');
        const wrong = await h.api('POST', '/api/maintenance/cleanup', {
            headers: { 'x-maintenance-key': 'nope' },
        });
        assert(wrong.status === 403, 'wrong key rejected');
    });

    it('deletes stale Vote records for long-decided trips but keeps the trip itself', async () => {
        const { api } = h;
        const reg = await api('POST', '/api/auth/register', {
            body: { name: 'Stale', email: 'stale-f8@example.com', password: 'pw12345' },
        });
        const token = reg.data.token;
        const trip = (await api('POST', '/api/trips', { token, body: { title: 'Stale Trip' } }))
            .data.trip;
        const base = `/api/trips/${trip._id}/destinations`;
        const dest = (await api('POST', base, { token, body: { name: 'Old Town' } })).data
            .destination;
        await api('PUT', `/api/trips/${trip._id}/vote`, {
            token,
            body: { ranking: [dest._id] },
        });

        // Force the trip into a long-decided, untouched state (bypassing
        // timestamps so `updatedAt` reflects "90+ days ago" like production data).
        await Trip.collection.updateOne(
            { _id: new Types.ObjectId(trip._id) },
            {
                $set: {
                    status: 'decided',
                    updatedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
                },
            }
        );

        const voteCountBefore = await Vote.countDocuments({ tripId: trip._id });
        assert(voteCountBefore === 1, 'vote exists before cleanup');

        const result = await cleanup();
        assert(
            result.status === 200 && (result.data.staleTripsCleaned as number) >= 1,
            'cleanup ran'
        );

        const voteCountAfter = await Vote.countDocuments({ tripId: trip._id });
        assert(voteCountAfter === 0, 'stale vote removed');
        const stillThere = await Trip.findById(trip._id);
        assert(stillThere !== null, 'trip document itself is preserved');
    });

    it('marks dormant users inactive, then deletes ones with no trip footprint', async () => {
        const { api } = h;
        const reg = await api('POST', '/api/auth/register', {
            body: { name: 'Dormant', email: 'dormant-f8@example.com', password: 'pw12345' },
        });
        const userId = reg.data.user.id;

        // Simulate 400 days of no login.
        await User.collection.updateOne(
            { _id: new Types.ObjectId(userId) },
            { $set: { lastLoginAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000) } }
        );

        const first = await cleanup();
        assert(
            first.status === 200 && (first.data.usersMarkedInactive as number) >= 1,
            'flagged inactive'
        );

        const flagged = await User.findById(userId);
        assert(flagged !== null && flagged.inactiveAt !== null, 'inactiveAt set');

        // Push the inactive flag back far enough to cross the delete threshold.
        await User.collection.updateOne(
            { _id: flagged!._id },
            { $set: { inactiveAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000) } }
        );

        const second = await cleanup();
        assert(
            second.status === 200 && (second.data.usersDeleted as number) >= 1,
            'dormant user deleted'
        );

        const gone = await User.findById(userId);
        assert(gone === null, 'user document removed');
    });

    it('never deletes an inactive user who still owns a trip', async () => {
        const { api } = h;
        const reg = await api('POST', '/api/auth/register', {
            body: { name: 'Owner', email: 'owner-f8@example.com', password: 'pw12345' },
        });
        const userId = reg.data.user.id;
        await api('POST', '/api/trips', { token: reg.data.token, body: { title: 'Kept trip' } });

        await User.collection.updateOne(
            { _id: new Types.ObjectId(userId) },
            {
                $set: {
                    lastLoginAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
                    inactiveAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
                },
            }
        );

        await cleanup();
        const stillHere = await User.findById(userId);
        assert(stillHere !== null, 'trip owner is protected from deletion');
    });
});
