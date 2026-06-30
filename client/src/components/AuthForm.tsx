import { useState, type FormEvent } from 'react';
import type { LoginRequest, RegisterRequest } from '@tripcrew/shared';
import { getErrorMessage } from '@/utils/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-2xl">
                    {isRegister ? 'Create your account' : 'Welcome back'}
                </CardTitle>
                <CardDescription>
                    {isRegister
                        ? 'Start planning trips your whole crew will love.'
                        : 'Log in to pick up where your crew left off.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {isRegister && (
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? 'Please wait…' : isRegister ? 'Sign up' : 'Login'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
