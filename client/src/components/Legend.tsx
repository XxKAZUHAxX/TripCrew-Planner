interface LegendStep {
    color: string;
    label: string;
}

interface LegendProps {
    /** Total members in the trip, used to label the top step (Issue 4/5). */
    totalMembers?: number;
}

export default function Legend({ totalMembers }: LegendProps) {
    const topLabel =
        totalMembers && totalMembers > 0 ? `All ${totalMembers} available` : '3+ available';
    const steps: LegendStep[] = [
        { color: '#ffffff', label: '0 available' },
        { color: '#C0DD97', label: '1 available' },
        { color: '#5DCAA5', label: '2 available' },
        { color: '#0F6E56', label: topLabel },
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
