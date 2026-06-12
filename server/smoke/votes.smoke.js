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
  const tBase = `/api/trips/${trip._id}`;

  const tokyo = (await api('POST', `${tBase}/destinations`, { token: alice, body: { name: 'Tokyo' } })).data.destination;
  const bali = (await api('POST', `${tBase}/destinations`, { token: alice, body: { name: 'Bali' } })).data.destination;
  const oslo = (await api('POST', `${tBase}/destinations`, { token: alice, body: { name: 'Oslo' } })).data.destination;

  // N = 3. Alice: Tokyo(3), Bali(2), Oslo(1). Bob: Bali(3), Tokyo(2), Oslo(1).
  const v1 = await api('PUT', `${tBase}/vote`, {
    token: alice,
    body: { ranking: [tokyo._id, bali._id, oslo._id] },
  });
  assert(v1.status === 200 && v1.data.vote.changeCount === 0, 'first vote has changeCount 0');

  await api('PUT', `${tBase}/vote`, {
    token: bob,
    body: { ranking: [bali._id, tokyo._id, oslo._id] },
  });

  const tally = await api('GET', `${tBase}/tally`, { token: alice });
  const byId = Object.fromEntries(tally.data.scores.map((s) => [s.destId, s.score]));
  // Tokyo: 3+2=5, Bali: 2+3=5, Oslo: 1+1=2
  assert(byId[tokyo._id] === 5, 'Tokyo Borda score = 5');
  assert(byId[bali._id] === 5, 'Bali Borda score = 5');
  assert(byId[oslo._id] === 2, 'Oslo Borda score = 2');

  // Re-submit Alice's vote -> changeCount increments.
  const v2 = await api('PUT', `${tBase}/vote`, {
    token: alice,
    body: { ranking: [bali._id, tokyo._id] },
  });
  assert(v2.data.vote.changeCount === 1, 're-submission increments changeCount');

  // Invalid id rejected.
  const bad = await api('PUT', `${tBase}/vote`, {
    token: alice,
    body: { ranking: ['64b0000000000000000000aa'] },
  });
  assert(bad.status === 400, 'invalid destination id rejected');

  // Duplicate ids rejected.
  const dup = await api('PUT', `${tBase}/vote`, {
    token: alice,
    body: { ranking: [tokyo._id, tokyo._id] },
  });
  assert(dup.status === 400, 'duplicate ids rejected');

  const mine = await api('GET', `${tBase}/vote`, { token: alice });
  assert(mine.data.vote.ranking.length === 2, 'get my vote returns latest ranking');
} finally {
  await teardown();
}
