import { useNavigate, useLocation, Link } from 'react-router-dom';
import type { LoginRequest, RegisterRequest } from '@tripcrew/shared';
import AuthForm from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';

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
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
            <AuthForm mode="login" onSubmit={handleSubmit} />
            <p className="mt-4 text-sm text-muted-foreground">
                <Link className="font-medium text-primary hover:underline" to="/reset-password">
                    Forgot password?
                </Link>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
                No account?{' '}
                <Link className="font-medium text-primary hover:underline" to="/register">
                    Sign up
                </Link>
            </p>
        </div>
    );
}
