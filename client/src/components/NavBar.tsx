import { Link, useNavigate } from 'react-router-dom';
import { Compass, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';

export default function NavBar() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                <Link to="/" className="flex items-center gap-2 text-lg font-bold">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                        <Compass className="size-5" />
                    </span>
                    <span>TripCrew</span>
                </Link>
                <nav className="flex items-center gap-2 sm:gap-4">
                    {token ? (
                        <>
                            <Link
                                to="/trips"
                                className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
                            >
                                My Trips
                            </Link>
                            {user?.name && (
                                <span className="hidden text-sm text-muted-foreground sm:inline">
                                    {user.name}
                                </span>
                            )}
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                <LogOut className="size-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Login
                            </Link>
                            <Link to="/register" className={cn(buttonVariants({ size: 'sm' }))}>
                                Sign up
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
