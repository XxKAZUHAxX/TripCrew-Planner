import { describe, it, beforeAll, afterAll } from 'vitest';
import { boot, assert, type Harness } from './harness.js';

describe('destinations', () => {
    let h: Harness;
    beforeAll(async () => {
        h = await boot();
    });
    afterAll(async () => {
        await h.teardown();
    });

    it('proposes, validates, lists and authorizes deletion', async () => {
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

        const base = `/api/trips/${trip._id}/destinations`;

        const d1 = await api('POST', base, {
            token: alice,
            body: { name: 'Tokyo', description: 'sushi', estimatedCost: 8000 },
        });
        assert(d1.status === 201 && d1.data.destination.name === 'Tokyo', 'propose destination');
        assert(d1.data.destination.estimatedCost === 8000, 'estimatedCost stored');

        const badCost = await api('POST', base, {
            token: alice,
            body: { name: 'X', estimatedCost: -5 },
        });
        assert(badCost.status === 400, 'negative estimatedCost rejected');

        const d2 = await api('POST', base, {
            token: bob,
            body: { name: 'Bali', estimatedCost: null },
        });
        assert(d2.data.destination.estimatedCost === null, 'null estimatedCost allowed');
        const list = await api('GET', base, { token: bob });
        assert(list.data.destinations.length === 2, 'list returns both destinations');

        // Bob (proposer) can edit his destination's cost; validation applies.
        const edit = await api('PATCH', `${base}/${d2.data.destination._id}`, {
            token: bob,
            body: { estimatedCost: 3500 },
        });
        assert(
            edit.status === 200 && edit.data.destination.estimatedCost === 3500,
            'proposer can edit estimatedCost'
        );
        const badEdit = await api('PATCH', `${base}/${d2.data.destination._id}`, {
            token: bob,
            body: { estimatedCost: -1 },
        });
        assert(badEdit.status === 400, 'negative estimatedCost edit rejected');

        // Alice (creator) can delete Bob's destination.
        const del = await api('DELETE', `${base}/${d2.data.destination._id}`, { token: alice });
        assert(del.status === 200, 'creator can delete any destination');

        // Bob cannot delete Alice's destination (not proposer, not creator).
        const forbiddenDel = await api('DELETE', `${base}/${d1.data.destination._id}`, {
            token: bob,
        });
        assert(forbiddenDel.status === 403, 'non-proposer/non-creator cannot delete');
    });

    it('lets any member add details and comments, gates comment deletion (F4)', async () => {
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

        const host = await makeUser('Host', 'host-f4@example.com');
        const member = await makeUser('Member', 'member-f4@example.com');
        const trip = (
            await api('POST', '/api/trips', { token: host.token, body: { title: 'F4 Trip' } })
        ).data.trip;
        await api('POST', `/api/trips/join/${trip.inviteCode}`, { token: member.token });
        const base = `/api/trips/${trip._id}/destinations`;

        const dest = (await api('POST', base, { token: host.token, body: { name: 'Cebu' } })).data
            .destination;
        const dBase = `${base}/${dest._id}`;

        // A non-proposer member can add notes/links/tags; bad links are dropped.
        const details = await api('PATCH', dBase, {
            token: member.token,
            body: {
                notes: '# Why Cebu\nGreat beaches',
                links: ['https://cebu.example.com', 'javascript:alert(1)', 'not a url'],
                tags: ['Beach', 'beach', ' Foodie '],
            },
        });
        assert(details.status === 200, 'any member can edit details');
        assert(
            details.data.destination.links.length === 1 &&
                details.data.destination.links[0].startsWith('https://'),
            'only safe http(s) links are stored'
        );
        assert(details.data.destination.tags.length === 2, 'tags trimmed + de-duplicated');
        assert(details.data.destination.notes.includes('Why Cebu'), 'notes stored');

        // Empty comment rejected.
        const empty = await api('POST', `${dBase}/comments`, {
            token: member.token,
            body: { text: '   ' },
        });
        assert(empty.status === 400, 'empty comment rejected');

        // Member adds a comment; author is populated.
        const comment = await api('POST', `${dBase}/comments`, {
            token: member.token,
            body: { text: 'I vote for this!' },
        });
        assert(comment.status === 201, 'member adds a comment');
        const c = comment.data.destination.comments[0];
        assert(
            c.text === 'I vote for this!' && c.userId.name === 'Member',
            'comment stored + author'
        );

        // Host (creator) may delete anyone's comment; a non-author member may not.
        const other = await makeUser('Other', 'other-f4@example.com');
        await api('POST', `/api/trips/join/${trip.inviteCode}`, { token: other.token });
        const forbidden = await api('DELETE', `${dBase}/comments/${c._id}`, { token: other.token });
        assert(forbidden.status === 403, 'non-author/non-creator cannot delete comment');
        const removed = await api('DELETE', `${dBase}/comments/${c._id}`, { token: host.token });
        assert(
            removed.status === 200 && removed.data.destination.comments.length === 0,
            'creator deletes comment'
        );
    });

    it('validates and stores a map pin location (F5)', async () => {
        const { api } = h;
        const reg = await api('POST', '/api/auth/register', {
            body: { name: 'Pin', email: 'pin-f5@example.com', password: 'pw12345' },
        });
        const token = reg.data.token;
        const trip = (await api('POST', '/api/trips', { token, body: { title: 'F5 Trip' } })).data
            .trip;
        const base = `/api/trips/${trip._id}/destinations`;
        const dest = (await api('POST', base, { token, body: { name: 'Baguio' } })).data.destination;
        const dBase = `${base}/${dest._id}`;

        const bad = await api('PATCH', dBase, {
            token,
            body: { location: { lat: 200, lng: 0 } },
        });
        assert(bad.status === 400, 'out-of-range latitude rejected');

        const ok = await api('PATCH', dBase, {
            token,
            body: { location: { lat: 16.4023, lng: 120.596 } },
        });
        assert(
            ok.status === 200 &&
                ok.data.destination.location.lat === 16.4023 &&
                ok.data.destination.location.lng === 120.596,
            'valid pin stored'
        );

        const cleared = await api('PATCH', dBase, { token, body: { location: null } });
        assert(cleared.status === 200 && cleared.data.destination.location === null, 'pin cleared');
    });
});
