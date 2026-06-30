interface LegendStep {
    color: string;
    label: string;
}

export default function Legend() {
    const steps: LegendStep[] = [
        { color: '#ffffff', label: '0' },
        { color: '#C0DD97', label: '1' },
        { color: '#5DCAA5', label: '2' },
        { color: '#0F6E56', label: `3+` },
    ];
    return (
        <div className="mt-3 flex items-center gap-3">
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
