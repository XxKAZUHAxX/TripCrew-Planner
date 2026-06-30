import { describe, it, beforeAll, afterAll } from 'vitest';
import { boot, assert, type Harness } from './harness.js';

describe('wheel of destiny', () => {
    let h: Harness;
    beforeAll(async () => {
        h = await boot();
    });
    afterAll(async () => {
        await h.teardown();
    });

    it('gates spinning, resolves a tie and persists the winner', async () => {
        const { api } = h;

        async function makeUser(
            name: string,
            email: string
        ): Promise<{ token: string; id: string }> {
            const r = await api('POST', '/api/auth/register', {
                body: { name, email, password: 'pw12345' },
            });
            return { token: r.data.token, id: r.data.user.id };
        }

        const alice = await makeUser('Alice', 'alice@example.com');
        const bob = await makeUser('Bob', 'bob@example.com');
        const trip = (
            await api('POST', '/api/trips', { token: alice.token, body: { title: 'Trip' } })
        ).data.trip;
        await api('POST', `/api/trips/join/${trip.inviteCode}`, { token: bob.token });
        const tBase = `/api/trips/${trip._id}`;

        const t = (
            await api('POST', `${tBase}/destinations`, {
                token: alice.token,
                body: { name: 'Tokyo' },
            })
        ).data.destination;
        const b = (
            await api('POST', `${tBase}/destinations`, {
                token: alice.token,
                body: { name: 'Bali' },
            })
        ).data.destination;

        // No deadlock yet -> not eligible, spin rejected.
        const status0 = await api('GET', `${tBase}/wheel/status`, { token: alice.token });
        assert(status0.data.eligible === false, 'wheel not eligible before deadlock');
        const earlySpin = await api('POST', `${tBase}/wheel/spin`, { token: alice.token });
        assert(earlySpin.status === 409, 'spin rejected without deadlock');

        // Create a tie: Alice [t,b], Bob [b,t] -> 3 each.
        await api('PUT', `${tBase}/vote`, {
            token: alice.token,
            body: { ranking: [t._id, b._id] },
        });
        await api('PUT', `${tBase}/vote`, { token: bob.token, body: { ranking: [b._id, t._id] } });

        const status1 = await api('GET', `${tBase}/wheel/status`, { token: alice.token });
        assert(status1.data.eligible === true, 'wheel eligible on tie');
        assert(status1.data.slices.length === 2, 'two tied slices');

        // Bob (non-creator) cannot spin.
        const bobSpin = await api('POST', `${tBase}/wheel/spin`, { token: bob.token });
        assert(bobSpin.status === 403, 'non-creator cannot spin');

        // Alice spins.
        const spin = await api('POST', `${tBase}/wheel/spin`, { token: alice.token });
        assert(spin.status === 200, 'creator spins successfully');
        assert(
            [t._id, b._id].includes(spin.data.winningDestinationId),
            'winner is one of the slices'
        );
        assert(spin.data.status === 'decided', 'status becomes decided');
        assert(
            typeof spin.data.winnerIndex === 'number',
            'winnerIndex returned for deterministic animation'
        );

        // Trip is now decided; spinning again is rejected.
        const reSpin = await api('POST', `${tBase}/wheel/spin`, { token: alice.token });
        assert(reSpin.status === 409, 'cannot spin a decided trip');

        // Detail reflects winning destination.
        const detail = await api('GET', tBase, { token: alice.token });
        assert(detail.data.trip.status === 'decided', 'trip detail shows decided');
        assert(!!detail.data.trip.winningDestination, 'winning destination persisted');
    });
});
