import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const { token, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border" role="status" aria-hidden="true" />
            </div>
        );
    }

    if (!token) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <>{children}</>;
}
