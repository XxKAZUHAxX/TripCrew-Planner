import { useState, type FormEvent } from 'react';
import type { LoginRequest, RegisterRequest } from '@tripcrew/shared';
import { getErrorMessage } from '../utils/errors';

export type AuthMode = 'login' | 'register';
export type AuthSubmit = (payload: LoginRequest | RegisterRequest) => Promise<void>;

interface AuthFormProps {
    mode: AuthMode;
    onSubmit: AuthSubmit;
}

// Reusable auth form for both login and register.
export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
    const isRegister = mode === 'register';
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await onSubmit(isRegister ? { name, email, password } : { email, password });
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card p-4 shadow-sm" style={{ maxWidth: 420 }}>
            <h2 className="h4 mb-3">{isRegister ? 'Create your account' : 'Welcome back'}</h2>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            {isRegister && (
                <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
            )}
            <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                />
            </div>
            <button className="btn btn-primary w-100" disabled={submitting}>
                {submitting ? 'Please wait…' : isRegister ? 'Sign up' : 'Login'}
            </button>
        </form>
    );
}
