import { describe, it, beforeAll, afterAll } from 'vitest';
import { boot, assert, type Harness } from './harness.js';

describe('auth', () => {
    let h: Harness;
    beforeAll(async () => {
        h = await boot();
    });
    afterAll(async () => {
        await h.teardown();
    });

    it('registers, logs in, and authorizes /me', async () => {
        const { api } = h;

        const reg = await api('POST', '/api/auth/register', {
            body: {
                name: 'Alice',
                email: 'alice@example.com',
                password: 'pw12345',
            },
        });
        assert(reg.status === 201, 'register returns 201');
        assert(!!reg.data.token, 'register returns token');
        assert(reg.data.user.email === 'alice@example.com', 'register returns user');
        assert(reg.data.user.passwordHash === undefined, 'passwordHash not leaked');

        const dup = await api('POST', '/api/auth/register', {
            body: {
                name: 'Alice2',
                email: 'alice@example.com',
                password: 'pw12345',
            },
        });
        assert(dup.status === 409, 'duplicate email rejected with 409');

        const login = await api('POST', '/api/auth/login', {
            body: { email: 'alice@example.com', password: 'pw12345' },
        });
        assert(login.status === 200 && !!login.data.token, 'login returns token');

        const badLogin = await api('POST', '/api/auth/login', {
            body: { email: 'alice@example.com', password: 'wrong' },
        });
        assert(badLogin.status === 401, 'bad password rejected with 401');

        const meRes = await api('GET', '/api/auth/me', { token: login.data.token });
        assert(
            meRes.status === 200 && meRes.data.user.name === 'Alice',
            '/me returns current user'
        );

        const noToken = await api('GET', '/api/auth/me');
        assert(noToken.status === 401, '/me without token rejected with 401');
    });

    it('resets a password via name + email identity check (Feature 3)', async () => {
        const { api } = h;

        await api('POST', '/api/auth/register', {
            body: { name: 'Reset Rita', email: 'rita@example.com', password: 'oldpass1' },
        });

        // Wrong name -> generic error, does not reveal the email exists.
        const wrongName = await api('POST', '/api/auth/reset-password', {
            body: { name: 'Wrong', email: 'rita@example.com', password: 'newpass1' },
        });
        assert(wrongName.status === 400, 'wrong name rejected');
        assert(
            wrongName.data.message === 'Name and email do not match our records.',
            'wrong name returns generic error'
        );

        // Unknown email -> same generic error.
        const unknownEmail = await api('POST', '/api/auth/reset-password', {
            body: { name: 'Nobody', email: 'nobody@example.com', password: 'newpass1' },
        });
        assert(
            unknownEmail.status === 400 &&
                unknownEmail.data.message === 'Name and email do not match our records.',
            'unknown email returns same generic error'
        );

        // Correct name + email (case/space-insensitive) -> success, issues token.
        const ok = await api('POST', '/api/auth/reset-password', {
            body: { name: '  reset rita ', email: 'rita@example.com', password: 'newpass1' },
        });
        assert(ok.status === 200 && !!ok.data.token, 'reset succeeds and returns token');

        // New password works; old one no longer does.
        const newLogin = await api('POST', '/api/auth/login', {
            body: { email: 'rita@example.com', password: 'newpass1' },
        });
        assert(newLogin.status === 200, 'login with new password works');
        const oldLogin = await api('POST', '/api/auth/login', {
            body: { email: 'rita@example.com', password: 'oldpass1' },
        });
        assert(oldLogin.status === 401, 'old password no longer works');
    });
});
