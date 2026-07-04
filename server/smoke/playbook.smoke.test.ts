import { describe, it, beforeAll, afterAll } from 'vitest';
import { boot, assert, type Harness } from './harness.js';

describe('playbook', () => {
    let h: Harness;
    beforeAll(async () => {
        h = await boot();
    });
    afterAll(async () => {
        await h.teardown();
    });

    it('gates on decided status, edits instructions and tracks per-member checklist', async () => {
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
        const pBase = `${tBase}/playbook`;

        // Locked while voting.
        const locked = await api('GET', pBase, { token: alice.token });
        assert(locked.status === 403, 'playbook locked (403) while voting');

        // Decide via wheel.
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
        await api('PUT', `${tBase}/vote`, {
            token: alice.token,
            body: { ranking: [t._id, b._id] },
        });
        await api('PUT', `${tBase}/vote`, { token: bob.token, body: { ranking: [b._id, t._id] } });
        await api('POST', `${tBase}/wheel/spin`, { token: alice.token });

        // Now unlocked.
        const open = await api('GET', pBase, { token: alice.token });
        assert(open.status === 200, 'playbook unlocked after decided');
        assert(!!open.data.winningDestination, 'playbook shows winning destination');

        // Creator edits instructions.
        const edit = await api('PATCH', `${pBase}/instructions`, {
            token: alice.token,
            body: { instructions: '# Meeting point\nLobby at 9am' },
        });
        assert(
            edit.status === 200 && edit.data.instructions.includes('Meeting point'),
            'creator edits instructions'
        );

        // Non-creator cannot edit instructions.
        const bobEdit = await api('PATCH', `${pBase}/instructions`, {
            token: bob.token,
            body: { instructions: 'hacked' },
        });
        assert(bobEdit.status === 403, 'non-creator cannot edit instructions');

        // Add a task.
        const task = await api('POST', `${pBase}/tasks`, {
            token: alice.token,
            body: { label: 'Book flights' },
        });
        assert(task.status === 201, 'add checklist task');
        const taskId = task.data.task.id;

        // Alice toggles her own completion.
        const aliceToggle = await api('PATCH', `${pBase}/tasks/${taskId}/toggle`, {
            token: alice.token,
        });
        assert(aliceToggle.data.task.completedByMe === true, 'alice marks task done for herself');
        assert(aliceToggle.data.task.completedByCount === 1, 'count = 1');

        // Bob toggles his own; alice unaffected.
        const bobToggle = await api('PATCH', `${pBase}/tasks/${taskId}/toggle`, {
            token: bob.token,
        });
        assert(bobToggle.data.task.completedByCount === 2, 'count = 2 after bob');

        // Bob's view shows his own state true, but he never touched alice's.
        const bobView = await api('GET', pBase, { token: bob.token });
        assert(bobView.data.checklist[0].completedByMe === true, 'bob sees his own completion');
        assert(bobView.data.checklist[0].completedByCount === 2, 'shared count is 2');

        // Alice un-toggles; her state flips, bob remains done.
        await api('PATCH', `${pBase}/tasks/${taskId}/toggle`, { token: alice.token });
        const aliceView = await api('GET', pBase, { token: alice.token });
        assert(aliceView.data.checklist[0].completedByMe === false, 'alice un-completed');
        assert(aliceView.data.checklist[0].completedByCount === 1, 'only bob remains done');
    });

    it('grants and revokes playbook edit access to specific members (F9)', async () => {
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

        const host = await makeUser('Host', 'host-f9@example.com');
        const editor = await makeUser('Editor', 'editor-f9@example.com');
        const other = await makeUser('Other', 'other-f9@example.com');
        const trip = (
            await api('POST', '/api/trips', {
                token: host.token,
                body: { title: 'F9 Trip', votingDeadline: '2020-01-01T00:00:00.000Z' },
            })
        ).data.trip;
        await api('POST', `/api/trips/join/${trip.inviteCode}`, { token: editor.token });
        await api('POST', `/api/trips/join/${trip.inviteCode}`, { token: other.token });
        const tBase = `/api/trips/${trip._id}`;
        const pBase = `${tBase}/playbook`;

        // Decide the trip so the playbook unlocks. With a past voting deadline and
        // low turnout, the wheel is eligible via timeout without any votes.
        await api('POST', `${tBase}/destinations`, {
            token: host.token,
            body: { name: 'Osaka' },
        });
        await api('POST', `${tBase}/destinations`, {
            token: host.token,
            body: { name: 'Kyoto' },
        });
        const spin = await api('POST', `${tBase}/wheel/spin`, { token: host.token });
        assert(spin.status === 200, 'wheel decides the trip via timeout');

        // Before a grant, the editor cannot edit.
        const denied = await api('PATCH', `${pBase}/instructions`, {
            token: editor.token,
            body: { instructions: 'nope' },
        });
        assert(denied.status === 403, 'member cannot edit before grant');

        // Only the host may set editors.
        const forbidden = await api('PATCH', `${tBase}/playbook-editors`, {
            token: editor.token,
            body: { editorIds: [editor.id] },
        });
        assert(forbidden.status === 403, 'non-host cannot set playbook editors');

        // Host grants edit access to the editor only.
        const grant = await api('PATCH', `${tBase}/playbook-editors`, {
            token: host.token,
            body: { editorIds: [editor.id, host.id, 'notamember'] },
        });
        assert(grant.status === 200, 'host grants editors');
        // Creator and non-members are filtered out.
        assert(
            grant.data.trip.playbookEditors.length === 1 &&
                grant.data.trip.playbookEditors[0] === editor.id,
            'only the valid member is stored as editor'
        );

        // The granted editor can now edit; the other member still cannot.
        const editorEdit = await api('PATCH', `${pBase}/instructions`, {
            token: editor.token,
            body: { instructions: '# By editor' },
        });
        assert(
            editorEdit.status === 200 && editorEdit.data.instructions.includes('By editor'),
            'granted editor edits instructions'
        );
        const otherEdit = await api('PATCH', `${pBase}/instructions`, {
            token: other.token,
            body: { instructions: 'nope' },
        });
        assert(otherEdit.status === 403, 'ungranted member still cannot edit');

        // Host revokes access.
        const revoke = await api('PATCH', `${tBase}/playbook-editors`, {
            token: host.token,
            body: { editorIds: [] },
        });
        assert(revoke.status === 200 && revoke.data.trip.playbookEditors.length === 0, 'revoked');
        const afterRevoke = await api('PATCH', `${pBase}/instructions`, {
            token: editor.token,
            body: { instructions: 'nope again' },
        });
        assert(afterRevoke.status === 403, 'editor cannot edit after revoke');
    });
});
