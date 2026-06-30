import { ArrowRight, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WinnerBannerProps {
    destination: { name: string } | null | undefined;
    onClose: () => void;
}

// Celebratory banner displayed after the wheel lands.
export default function WinnerBanner({ destination, onClose }: WinnerBannerProps) {
    if (!destination) return null;
    return (
        <div className="mt-6 rounded-xl border border-success/30 bg-success/10 p-6 text-center shadow-sm">
            <PartyPopper className="mx-auto mb-2 size-8 text-success" />
            <h2 className="text-lg font-semibold">Destination decided!</h2>
            <p className="mb-4 mt-1 text-2xl font-bold">{destination.name}</p>
            <Button variant="success" onClick={onClose}>
                Continue to Playbook
                <ArrowRight className="size-4" />
            </Button>
        </div>
    );
}
