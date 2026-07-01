import * as React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TooltipProps {
    /** The trigger element that reveals the tooltip on hover/focus. */
    children: React.ReactNode;
    /** Tooltip content. */
    content: React.ReactNode;
    className?: string;
    /** Extra classes for the floating bubble. */
    contentClassName?: string;
}

/**
 * A lightweight, dependency-free tooltip. Shows on hover and keyboard focus so
 * it stays accessible without pulling in a portal/positioning library.
 */
export function Tooltip({ children, content, className, contentClassName }: TooltipProps) {
    return (
        <span className={cn('group/tooltip relative inline-flex items-center', className)}>
            <span tabIndex={0} className="inline-flex items-center outline-none">
                {children}
            </span>
            <span
                role="tooltip"
                className={cn(
                    'pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2',
                    'w-max max-w-xs rounded-md border border-border bg-popover px-2.5 py-1.5',
                    'text-xs font-normal text-popover-foreground shadow-md',
                    'group-hover/tooltip:block group-focus-within/tooltip:block',
                    contentClassName
                )}
            >
                {content}
            </span>
        </span>
    );
}

/** An `ⓘ` info icon that reveals a tooltip on hover/focus. */
export function InfoTooltip({
    content,
    className,
    label = 'More information',
}: {
    content: React.ReactNode;
    className?: string;
    label?: string;
}) {
    return (
        <Tooltip content={content}>
            <Info
                aria-label={label}
                className={cn('size-3.5 cursor-help text-muted-foreground', className)}
            />
        </Tooltip>
    );
}
