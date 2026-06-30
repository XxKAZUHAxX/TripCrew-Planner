import { Link } from 'react-router-dom';
import {
    CalendarHeart,
    ClipboardList,
    Compass,
    Sparkles,
    Vote,
    type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Feature {
    icon: LucideIcon;
    title: string;
    text: string;
}

const features: Feature[] = [
    {
        icon: Vote,
        title: 'Ranked-choice voting',
        text: 'Borda count keeps every voice fair — your 1st pick earns the most points.',
    },
    {
        icon: CalendarHeart,
        title: 'Availability heatmap',
        text: 'Drag across the calendar to find the dates that work for the whole crew.',
    },
    {
        icon: Sparkles,
        title: 'Wheel of Destiny',
        text: 'Deadlocked? Spin a server-fair wheel and let fate break the tie.',
    },
    {
        icon: ClipboardList,
        title: 'Trip Playbook',
        text: 'Once decided, share instructions and track everyone’s prep checklist.',
    },
];

export default function Landing() {
    const { token } = useAuth();
    return (
        <div>
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-accent/10 to-background" />
                <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
                    <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                        <Compass className="size-3.5 text-primary" />
                        Group trips, finally sorted
                    </span>
                    <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
                        Plan group trips <span className="text-primary">without the chaos.</span>
                    </h1>
                    <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
                        Propose destinations, vote with ranked choices, settle on dates, and let the
                        Wheel of Destiny break the ties. TripCrew solves group indecision.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        {token ? (
                            <Link className={cn(buttonVariants({ size: 'lg' }))} to="/trips">
                                Go to my trips
                            </Link>
                        ) : (
                            <>
                                <Link className={cn(buttonVariants({ size: 'lg' }))} to="/register">
                                    Get started
                                </Link>
                                <Link
                                    className={cn(
                                        buttonVariants({ variant: 'outline', size: 'lg' })
                                    )}
                                    to="/login"
                                >
                                    Login
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-5xl px-4 pb-24">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((f) => (
                        <Card key={f.title} className="transition-shadow hover:shadow-md">
                            <CardContent className="p-5">
                                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <f.icon className="size-5" />
                                </span>
                                <h3 className="mt-3 font-semibold">{f.title}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}
