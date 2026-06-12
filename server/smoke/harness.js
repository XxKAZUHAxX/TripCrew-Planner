// Reusable smoke-test harness: boots an in-memory MongoDB + the real Express app,
// then exposes a small fetch helper. Used to exercise each milestone in isolation.
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { createApp } from '../app.js';

export async function boot() {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  process.env.JWT_EXPIRES_IN = '1h';

  const mongod = await MongoMemoryServer.create();
  await connectDB(mongod.getUri());

  const app = createApp();
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const { port } = server.address();
  const base = `http://localhost:${port}`;

  async function api(method, path, { token, body } = {}) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(base + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, data };
  }

  async function teardown() {
    await mongoose.disconnect();
    await mongod.stop();
    server.close();
  }

  return { api, teardown };
}

export function assert(cond, label) {
  if (!cond) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${label}`);
  }
}
