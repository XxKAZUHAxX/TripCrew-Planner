import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Compass, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';

export default function NavBar() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close the mobile menu on route change.
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    // Close the mobile menu when clicking outside it.
    useEffect(() => {
        if (!menuOpen) return;
        function onPointerDown(e: PointerEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [menuOpen]);

    function handleLogout() {
        setMenuOpen(false);
        logout();
        navigate('/login');
    }

    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`);

    // Animated underline that grows on hover and stays lit on the active route.
    const navLinkClass = (active: boolean) =>
        cn(
            'relative text-sm font-medium transition-colors hover:text-foreground',
            'after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left',
            'after:scale-x-0 after:bg-primary after:transition-transform after:duration-200',
            'hover:after:scale-x-100',
            active ? 'text-foreground after:scale-x-100' : 'text-muted-foreground'
        );

    // Full-width row used inside the mobile dropdown.
    const mobileLinkClass = (active: boolean) =>
        cn(
            'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
            active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
        );

    return (
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                <Link to="/" className="flex items-center gap-2 text-lg font-bold">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                        <Compass className="size-5" />
                    </span>
                    <span>TripCrew</span>
                </Link>

                {token ? (
                    <>
                        {/* Desktop / tablet nav */}
                        <nav className="hidden items-center gap-4 sm:flex">
                            <Link to="/trips" className={navLinkClass(isActive('/trips'))}>
                                My Trips
                            </Link>
                            {user?.name && (
                                <span className="text-sm text-muted-foreground">{user.name}</span>
                            )}
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                <LogOut className="size-4" />
                                <span>Logout</span>
                            </Button>
                        </nav>

                        {/* Mobile menu */}
                        <div className="relative sm:hidden" ref={menuRef}>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setMenuOpen((v) => !v)}
                                aria-label="Toggle navigation menu"
                                aria-expanded={menuOpen}
                            >
                                {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                            </Button>
                            {menuOpen && (
                                <div className="absolute right-0 top-12 w-48 rounded-lg border bg-background p-2 shadow-lg">
                                    {user?.name && (
                                        <p className="px-3 py-1.5 text-xs text-muted-foreground">
                                            Signed in as {user.name}
                                        </p>
                                    )}
                                    <Link
                                        to="/trips"
                                        className={mobileLinkClass(isActive('/trips'))}
                                    >
                                        My Trips
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
                                    >
                                        <LogOut className="size-4" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <nav className="flex items-center gap-4">
                        <Link to="/login" className={navLinkClass(isActive('/login'))}>
                            Login
                        </Link>
                        <Link to="/register" className={cn(buttonVariants({ size: 'sm' }))}>
                            Sign up
                        </Link>
                    </nav>
                )}
            </div>
        </header>
    );
}
