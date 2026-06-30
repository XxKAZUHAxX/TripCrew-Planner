import { describe, it, beforeAll, afterAll } from 'vitest';
import { boot, assert, type Harness } from './harness.js';

describe('trips', () => {
    let h: Harness;
    beforeAll(async () => {
        h = await boot();
    });
    afterAll(async () => {
        await h.teardown();
    });

    it('handles creation, membership, join and creator-only invite toggle', async () => {
        const { api } = h;

        async function makeUser(name: string, email: string): Promise<string> {
            const r = await api('POST', '/api/auth/register', {
                body: { name, email, password: 'pw12345' },
            });
            return r.data.token;
        }

        const alice = await makeUser('Alice', 'alice@example.com');
        const bob = await makeUser('Bob', 'bob@example.com');

        const created = await api('POST', '/api/trips', {
            token: alice,
            body: { title: 'Summer Trip' },
        });
        assert(created.status === 201, 'create trip returns 201');
        assert(created.data.trip.inviteCode?.length === 10, 'invite code generated (10 chars)');
        assert(created.data.trip.status === 'voting', 'new trip status is voting');
        assert(created.data.trip.members.length === 1, 'creator auto-added as member');

        const tripId = created.data.trip._id;
        const code = created.data.trip.inviteCode;

        const list = await api('GET', '/api/trips', { token: alice });
        assert(list.data.trips.length === 1, 'list my trips returns the trip');

        // Bob is not a member yet.
        const forbidden = await api('GET', `/api/trips/${tripId}`, { token: bob });
        assert(forbidden.status === 403, 'non-member blocked from trip detail (403)');

        const joined = await api('POST', `/api/trips/join/${code}`, { token: bob });
        assert(
            joined.status === 200 && joined.data.trip.members.length === 2,
            'bob joins via code'
        );

        const detail = await api('GET', `/api/trips/${tripId}`, { token: bob });
        assert(detail.status === 200, 'member can fetch trip detail');
        assert(Array.isArray(detail.data.destinations), 'detail includes destinations array');

        // Creator-only: Bob cannot toggle invite.
        const bobToggle = await api('PATCH', `/api/trips/${tripId}/invite`, {
            token: bob,
            body: { inviteActive: false },
        });
        assert(bobToggle.status === 403, 'non-creator blocked from invite toggle (403)');

        const aliceToggle = await api('PATCH', `/api/trips/${tripId}/invite`, {
            token: alice,
            body: { inviteActive: false },
        });
        assert(
            aliceToggle.status === 200 && aliceToggle.data.trip.inviteActive === false,
            'creator toggles invite off'
        );

        // Carol cannot join via a deactivated link.
        const carol = await makeUser('Carol', 'carol@example.com');
        const carolJoin = await api('POST', `/api/trips/join/${code}`, { token: carol });
        assert(carolJoin.status === 403, 'join blocked when inviteActive is false');
    });
});
