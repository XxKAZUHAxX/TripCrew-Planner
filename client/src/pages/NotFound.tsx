import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function NotFound() {
    return (
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
            <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Compass className="size-7" />
            </span>
            <h1 className="text-3xl font-bold">404 — Page not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
                The page you’re looking for doesn’t exist or may have moved.
            </p>
            <Link to="/trips" className={cn(buttonVariants({ variant: 'default' }), 'mt-6')}>
                Back to my trips
            </Link>
        </div>
    );
}
