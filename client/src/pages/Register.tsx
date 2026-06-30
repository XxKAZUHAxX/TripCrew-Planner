import { useNavigate, Link } from 'react-router-dom';
import type { LoginRequest, RegisterRequest } from '@tripcrew/shared';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(payload: LoginRequest | RegisterRequest) {
        await register(payload as RegisterRequest);
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
