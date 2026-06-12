import { useNavigate, Link } from 'react-router-dom';
import AuthForm from '../components/AuthForm.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(payload) {
    await register(payload);
    navigate('/trips', { replace: true });
  }

  return (
    <div className="container py-5 d-flex flex-column align-items-center">
      <AuthForm mode="register" onSubmit={handleSubmit} />
      <p className="mt-3">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
