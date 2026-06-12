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

  // Deadline 12h from now so "Ghost" can trigger.
  const deadline = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
  const trip = (
    await api('POST', '/api/trips', { token: alice.token, body: { title: 'Trip', votingDeadline: deadline } })
  ).data.trip;
  await api('POST', `/api/trips/join/${trip.inviteCode}`, { token: bob.token });
  const tBase = `/api/trips/${trip._id}`;

  // Alice proposes two low-budget destinations -> Accountant qualifier.
  const t = (await api('POST', `${tBase}/destinations`, { token: alice.token, body: { name: 'Tokyo', budgetTier: 'low' } })).data.destination;
  const b = (await api('POST', `${tBase}/destinations`, { token: alice.token, body: { name: 'Bali', budgetTier: 'low' } })).data.destination;

  // Alice votes (first voter -> Hype Machine); Bob does not (Ghost, deadline <24h).
  await api('PUT', `${tBase}/vote`, { token: alice.token, body: { ranking: [t._id, b._id] } });

  const dash = await api('GET', `${tBase}/dashboard`, { token: alice.token });
  assert(dash.status === 200, 'dashboard returns 200');
  assert(dash.data.scores.length === 2, 'dashboard returns scores');

  const aliceBadges = dash.data.badges[alice.id];
  const bobBadges = dash.data.badges[bob.id];
  assert(aliceBadges.includes('The Accountant'), 'Alice is The Accountant (2 low proposals)');
  assert(aliceBadges.includes('The Hype Machine'), 'Alice is The Hype Machine (first voter)');
  assert(bobBadges.includes('The Ghost'), 'Bob is The Ghost (no vote, deadline <24h)');

  // Overthinker: change vote 4 times (changeCount > 3).
  for (let i = 0; i < 4; i++) {
    await api('PUT', `${tBase}/vote`, { token: alice.token, body: { ranking: [b._id, t._id] } });
  }
  const dash2 = await api('GET', `${tBase}/dashboard`, { token: alice.token });
  assert(dash2.data.badges[alice.id].includes('The Overthinker'), 'Alice is The Overthinker (changeCount>3)');

  // Deadlock TIE: make Tokyo and Bali tie. Bob votes opposite to Alice.
  // Alice currently [b,t]. Bob votes [t,b]. N=2 -> each gets 2+1 / 1+2 = 3 each -> tie.
  await api('PUT', `${tBase}/vote`, { token: bob.token, body: { ranking: [t._id, b._id] } });
  await api('PUT', `${tBase}/vote`, { token: alice.token, body: { ranking: [b._id, t._id] } });
  const dash3 = await api('GET', `${tBase}/dashboard`, { token: alice.token });
  assert(dash3.data.deadlock.tie === true, 'deadlock tie detected');
  assert(dash3.data.deadlock.eligible === true, 'wheel eligible on tie');
  assert(dash3.data.deadlock.slices.length === 2, 'tie produces 2 slices');
} finally {
  await teardown();
}
