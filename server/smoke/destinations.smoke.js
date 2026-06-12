import { boot, assert } from './harness.js';

const { api, teardown } = await boot();

async function makeUser(name, email) {
  const r = await api('POST', '/api/auth/register', {
    body: { name, email, password: 'pw12345' },
  });
  return r.data.token;
}

try {
  const alice = await makeUser('Alice', 'alice@example.com');
  const bob = await makeUser('Bob', 'bob@example.com');
  const trip = (await api('POST', '/api/trips', { token: alice, body: { title: 'Trip' } })).data.trip;
  await api('POST', `/api/trips/join/${trip.inviteCode}`, { token: bob });

  const base = `/api/trips/${trip._id}/destinations`;

  const d1 = await api('POST', base, {
    token: alice,
    body: { name: 'Tokyo', description: 'sushi', budgetTier: 'high' },
  });
  assert(d1.status === 201 && d1.data.destination.name === 'Tokyo', 'propose destination');

  const badTier = await api('POST', base, {
    token: alice,
    body: { name: 'X', budgetTier: 'ultra' },
  });
  assert(badTier.status === 400, 'invalid budgetTier rejected');

  const d2 = await api('POST', base, { token: bob, body: { name: 'Bali', budgetTier: 'low' } });
  const list = await api('GET', base, { token: bob });
  assert(list.data.destinations.length === 2, 'list returns both destinations');

  // Alice (creator) can delete Bob's destination.
  const del = await api('DELETE', `${base}/${d2.data.destination._id}`, { token: alice });
  assert(del.status === 200, 'creator can delete any destination');

  // Bob cannot delete Alice's destination (not proposer, not creator).
  const forbiddenDel = await api('DELETE', `${base}/${d1.data.destination._id}`, { token: bob });
  assert(forbiddenDel.status === 403, 'non-proposer/non-creator cannot delete');
} finally {
  await teardown();
}
