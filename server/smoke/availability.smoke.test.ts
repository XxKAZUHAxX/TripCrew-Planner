import { describe, it, beforeAll, afterAll } from 'vitest';
import { boot, assert, type Harness } from './harness.js';

describe('availability', () => {
    let h: Harness;
    beforeAll(async () => {
        h = await boot();
    });
    afterAll(async () => {
        await h.teardown();
    });

    it('saves dates and aggregates the heatmap per member', async () => {
        const { api } = h;

        async function makeUser(name: string, email: string): Promise<string> {
            const r = await api('POST', '/api/auth/register', {
                body: { name, email, password: 'pw12345' },
            });
            return r.data.token;
        }

        const alice = await makeUser('Alice', 'alice@example.com');
        const bob = await makeUser('Bob', 'bob@example.com');
        const trip = (await api('POST', '/api/trips', { token: alice, body: { title: 'Trip' } }))
            .data.trip;
        await api('POST', `/api/trips/join/${trip.inviteCode}`, { token: bob });
        const aBase = `/api/trips/${trip._id}/availability`;

        const save = await api('PUT', aBase, {
            token: alice,
            body: { dates: ['2025-07-04', '2025-07-05'] },
        });
        assert(
            save.status === 200 && save.data.availability.dates.length === 2,
            'alice saves dates'
        );

        await api('PUT', aBase, { token: bob, body: { dates: ['2025-07-05', '2025-07-06'] } });

        const heatmap = await api('GET', `${aBase}/heatmap`, { token: alice });
        assert(heatmap.data['2025-07-04'] === 1, 'Jul 4 count = 1');
        assert(heatmap.data['2025-07-05'] === 2, 'Jul 5 count = 2 (overlap)');
        assert(heatmap.data['2025-07-06'] === 1, 'Jul 6 count = 1');

        const mine = await api('GET', `${aBase}/me`, { token: alice });
        assert(mine.data.dates.length === 2, 'get my availability');

        // Update one member without touching the other.
        await api('PUT', aBase, { token: alice, body: { dates: ['2025-07-06'] } });
        const heatmap2 = await api('GET', `${aBase}/heatmap`, { token: alice });
        assert(heatmap2.data['2025-07-04'] === undefined, 'alice removed Jul 4');
        assert(heatmap2.data['2025-07-06'] === 2, 'Jul 6 now 2 after alice moved');

        const bad = await api('PUT', aBase, { token: alice, body: { dates: ['07/04/2025'] } });
        assert(bad.status === 400, 'invalid date format rejected');

        // Empty heatmap shape.
        const trip2 = (await api('POST', '/api/trips', { token: alice, body: { title: 'Empty' } }))
            .data.trip;
        const emptyHeat = await api('GET', `/api/trips/${trip2._id}/availability/heatmap`, {
            token: alice,
        });
        assert(JSON.stringify(emptyHeat.data) === '{}', 'empty heatmap returns {}');
    });

    it('supports opting out and rejoining (Feature 1)', async () => {
        const { api } = h;

        async function makeUser(name: string, email: string): Promise<string> {
            const r = await api('POST', '/api/auth/register', {
                body: { name, email, password: 'pw12345' },
            });
            return r.data.token;
        }

        const host = await makeUser('Hank', 'hank@example.com');
        const guest = await makeUser('Gina', 'gina@example.com');
        const trip = (await api('POST', '/api/trips', { token: host, body: { title: 'Opt Trip' } }))
            .data.trip;
        await api('POST', `/api/trips/join/${trip.inviteCode}`, { token: guest });
        const aBase = `/api/trips/${trip._id}/availability`;

        // Default status is pending before any response.
        const before = await api('GET', `${aBase}/me`, { token: guest });
        assert(before.data.status === 'pending', 'status defaults to pending');

        // Opt out flips status and clears dates.
        const opt = await api('POST', `${aBase}/opt-out`, { token: guest });
        assert(
            opt.status === 200 && opt.data.availability.status === 'opted_out',
            'opt-out sets opted_out status'
        );
        assert(opt.data.availability.dates.length === 0, 'opt-out clears dates');

        const mine = await api('GET', `${aBase}/me`, { token: guest });
        assert(mine.data.status === 'opted_out', 'status persists as opted_out');

        // Saving availability again re-engages the member.
        const rejoin = await api('PUT', aBase, { token: guest, body: { dates: ['2025-08-01'] } });
        assert(
            rejoin.data.availability.status === 'submitted',
            'saving dates rejoins as submitted'
        );
    });
});
