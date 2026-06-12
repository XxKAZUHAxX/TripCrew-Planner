import { useState } from 'react';

// Reusable auth form for both login and register.
export default function AuthForm({ mode, onSubmit }) {
  const isRegister = mode === 'register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(isRegister ? { name, email, password } : { email, password });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
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
