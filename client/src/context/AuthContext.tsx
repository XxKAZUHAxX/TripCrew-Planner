import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    User,
} from '@tripcrew/shared';
import * as authApi from '../api/auth.api';

export interface AuthContextValue {
    user: User | null;
    token: string | null;
    loading: boolean;
    login(credentials: LoginRequest): Promise<User>;
    register(payload: RegisterRequest): Promise<User>;
    resetPassword(payload: ResetPasswordRequest): Promise<User>;
    logout(): void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'tripcrew_token';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        async function bootstrap() {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const me = await authApi.fetchMe();
                if (active) setUser(me);
            } catch {
                localStorage.removeItem(TOKEN_KEY);
                if (active) setToken(null);
            } finally {
                if (active) setLoading(false);
            }
        }
        bootstrap();
        return () => {
            active = false;
        };
    }, [token]);

    const persist = useCallback((data: AuthResponse) => {
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
    }, []);

    const login = useCallback(
        async (credentials: LoginRequest): Promise<User> => {
            const data = await authApi.login(credentials);
            persist(data);
            return data.user;
        },
        [persist]
    );

    const register = useCallback(
        async (payload: RegisterRequest): Promise<User> => {
            const data = await authApi.register(payload);
            persist(data);
            return data.user;
        },
        [persist]
    );

    const resetPassword = useCallback(
        async (payload: ResetPasswordRequest): Promise<User> => {
            const data = await authApi.resetPassword(payload);
            persist(data);
            return data.user;
        },
        [persist]
    );

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, token, loading, login, register, resetPassword, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}
