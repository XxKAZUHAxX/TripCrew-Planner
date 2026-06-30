import { cn } from '@/lib/utils';

interface BadgeStyle {
    className: string;
    icon: string;
}

// Playful per-archetype colors and emoji.
const BADGE_STYLES: Record<string, BadgeStyle> = {
    'The Dictator': { className: 'bg-red-500 text-white', icon: '👑' },
    'The Ghost': { className: 'bg-slate-500 text-white', icon: '👻' },
    'The Accountant': { className: 'bg-emerald-600 text-white', icon: '🧮' },
    'The Overthinker': { className: 'bg-orange-500 text-white', icon: '🤔' },
    'The Hype Machine': { className: 'bg-blue-600 text-white', icon: '🎉' },
};

interface BadgeChipProps {
    label: string;
    description?: string;
}

export default function BadgeChip({ label, description }: BadgeChipProps) {
    const style = BADGE_STYLES[label] || { className: 'bg-foreground text-background', icon: '🏷️' };
    return (
        <span
            className={cn(
                'inline-flex cursor-default items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium shadow-sm',
                style.className
            )}
            title={description || label}
        >
            {style.icon} {label}
        </span>
    );
}
