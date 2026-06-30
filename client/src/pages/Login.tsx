import { useNavigate, useLocation, Link } from 'react-router-dom';
import type { LoginRequest, RegisterRequest } from '@tripcrew/shared';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as { from?: { pathname?: string } } | null;
    const from = state?.from?.pathname || '/trips';

    async function handleSubmit(credentials: LoginRequest | RegisterRequest) {
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
