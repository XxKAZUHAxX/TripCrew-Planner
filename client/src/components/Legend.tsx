interface LegendStep {
    color: string;
    label: string;
}

interface LegendProps {
    /** Total members in the trip, used to label steps with actual headcounts (Issue 4/5). */
    totalMembers?: number;
}

export default function Legend({ totalMembers }: LegendProps) {
    const of = (pct: number): string => {
        if (!totalMembers || totalMembers <= 0) return `${pct}%`;
        return `~${Math.round((totalMembers * pct) / 100)} of ${totalMembers}`;
    };
    const steps: LegendStep[] = [
        { color: '#ffffff', label: 'None available' },
        { color: '#C0DD97', label: `${of(25)} available` },
        { color: '#5DCAA5', label: `${of(50)} available` },
        { color: '#2E9E7A', label: `${of(75)} available` },
        {
            color: '#0F6E56',
            label: totalMembers && totalMembers > 0 ? `All ${totalMembers} available` : 'Everyone available',
        },
    ];
    return (
        <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted-foreground">Members free:</span>
            {steps.map((s) => (
                <span key={s.label} className="flex items-center gap-1">
                    <span
                        className="size-4 rounded border border-border"
                        style={{ backgroundColor: s.color }}
                    />
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                </span>
            ))}
        </div>
    );
}
