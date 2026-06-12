import { boot, assert } from './harness.js';

const { api, teardown } = await boot();

async function makeUser(name, email) {
  const r = await api('POST', '/api/auth/register', {
    body: { name, email, password: 'pw12345' },
  });
  return { token: r.data.token, id: r.data.user.id };
}

try {
  const alice = await makeUser('Alice', 'alice@example.com');
  const bob = await makeUser('Bob', 'bob@example.com');
  const trip = (await api('POST', '/api/trips', { token: alice.token, body: { title: 'Trip' } })).data.trip;
  await api('POST', `/api/trips/join/${trip.inviteCode}`, { token: bob.token });
  const tBase = `/api/trips/${trip._id}`;
  const pBase = `${tBase}/playbook`;

  // Locked while voting.
  const locked = await api('GET', pBase, { token: alice.token });
  assert(locked.status === 403, 'playbook locked (403) while voting');

  // Decide via wheel.
  const t = (await api('POST', `${tBase}/destinations`, { token: alice.token, body: { name: 'Tokyo' } })).data.destination;
  const b = (await api('POST', `${tBase}/destinations`, { token: alice.token, body: { name: 'Bali' } })).data.destination;
  await api('PUT', `${tBase}/vote`, { token: alice.token, body: { ranking: [t._id, b._id] } });
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
  assert(edit.status === 200 && edit.data.instructions.includes('Meeting point'), 'creator edits instructions');

  // Non-creator cannot edit instructions.
  const bobEdit = await api('PATCH', `${pBase}/instructions`, {
    token: bob.token,
    body: { instructions: 'hacked' },
  });
  assert(bobEdit.status === 403, 'non-creator cannot edit instructions');

  // Add a task.
  const task = await api('POST', `${pBase}/tasks`, { token: alice.token, body: { label: 'Book flights' } });
  assert(task.status === 201, 'add checklist task');
  const taskId = task.data.task.id;

  // Alice toggles her own completion.
  const aliceToggle = await api('PATCH', `${pBase}/tasks/${taskId}/toggle`, { token: alice.token });
  assert(aliceToggle.data.task.completedByMe === true, 'alice marks task done for herself');
  assert(aliceToggle.data.task.completedByCount === 1, 'count = 1');

  // Bob toggles his own; alice unaffected.
  const bobToggle = await api('PATCH', `${pBase}/tasks/${taskId}/toggle`, { token: bob.token });
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
} finally {
  await teardown();
}
