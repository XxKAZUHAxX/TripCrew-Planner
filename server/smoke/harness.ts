// Reusable smoke-test harness: boots an in-memory MongoDB + the real Express app,
// then exposes a small fetch helper. Used to exercise each feature end-to-end.
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { expect } from 'vitest';
import { connectDB } from '../config/db.js';
import { createApp } from '../app.js';

export interface ApiOptions {
    token?: string;
    body?: unknown;
    headers?: Record<string, string>;
}

export interface ApiResponse {
    status: number;
    // Response bodies are intentionally untyped here; suites assert on shape.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
}

export interface Harness {
    api(method: string, path: string, opts?: ApiOptions): Promise<ApiResponse>;
    teardown(): Promise<void>;
}

export async function boot(): Promise<Harness> {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';

    const mongod = await MongoMemoryServer.create();
    await connectDB(mongod.getUri());

    const app = createApp();
    const server = app.listen(0);
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    const base = `http://localhost:${port}`;

    async function api(method: string, path: string, opts: ApiOptions = {}): Promise<ApiResponse> {
        const { token, body, headers: extraHeaders } = opts;
        const headers: Record<string, string> = { ...extraHeaders };
        if (body) headers['Content-Type'] = 'application/json';
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(base + path, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        let data: unknown;
        try {
            data = await res.json();
        } catch {
            data = null;
        }
        return { status: res.status, data };
    }

    async function teardown(): Promise<void> {
        await mongoose.disconnect();
        await mongod.stop();
        server.close();
    }

    return { api, teardown };
}

export function assert(cond: unknown, label: string): void {
    expect(cond, label).toBeTruthy();
}
