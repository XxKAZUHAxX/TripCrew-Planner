import { useNavigate, Link } from 'react-router-dom';
import type { LoginRequest, RegisterRequest } from '@tripcrew/shared';
import AuthForm from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(payload: LoginRequest | RegisterRequest) {
        await register(payload as RegisterRequest);
        navigate('/trips', { replace: true });
    }

    return (
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
            <AuthForm mode="register" onSubmit={handleSubmit} />
            <p className="mt-4 text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link className="font-medium text-primary hover:underline" to="/login">
                    Login
                </Link>
            </p>
        </div>
    );
}
