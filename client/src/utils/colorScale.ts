// Gradient stops (ratio of available members to total trip members -> RGB).
// White at 0%, progressively darker green, capping at the darkest shade only
// when every member is available (ratio === 1).
const STOPS: Array<{ ratio: number; rgb: [number, number, number] }> = [
    { ratio: 0, rgb: [255, 255, 255] },
    { ratio: 0.25, rgb: [192, 221, 151] },
    { ratio: 0.5, rgb: [93, 202, 165] },
    { ratio: 0.75, rgb: [46, 158, 122] },
    { ratio: 1, rgb: [15, 110, 86] },
];

function lerp(a: number, b: number, t: number): number {
    return Math.round(a + (b - a) * t);
}

function rgbToHex([r, g, b]: [number, number, number]): string {
    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

// Maps an availability count to a heatmap color, scaled by the trip's total
// member count so the shade reflects the *proportion* of the group that's
// free rather than a raw headcount (Feature 2).
export function countToColor(count: number | undefined, total: number | undefined): string {
    if (!count || count <= 0 || !total || total <= 0) return '#ffffff';
    const ratio = Math.min(count / total, 1);
    for (let i = 1; i < STOPS.length; i++) {
        const prev = STOPS[i - 1]!;
        const curr = STOPS[i]!;
        if (ratio <= curr.ratio || i === STOPS.length - 1) {
            const span = curr.ratio - prev.ratio || 1;
            const t = (ratio - prev.ratio) / span;
            return rgbToHex([
                lerp(prev.rgb[0], curr.rgb[0], t),
                lerp(prev.rgb[1], curr.rgb[1], t),
                lerp(prev.rgb[2], curr.rgb[2], t),
            ]);
        }
    }
    return rgbToHex(STOPS[STOPS.length - 1]!.rgb);
}

// True when text on the cell should be white for contrast against the
// darker end of the gradient.
export function isDarkShade(count: number | undefined, total: number | undefined): boolean {
    if (!count || !total || total <= 0) return false;
    return count / total >= 0.6;
}
