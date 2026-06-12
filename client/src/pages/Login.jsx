import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthForm from '../components/AuthForm.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/trips';

  async function handleSubmit(credentials) {
    await login(credentials);
    navigate(from, { replace: true });
  }

  return (
    <div className="container py-5 d-flex flex-column align-items-center">
      <AuthForm mode="login" onSubmit={handleSubmit} />
      <p className="mt-3">
        No account? <Link to="/register">Sign up</Link>
      </p>
    </div>
  );
}
