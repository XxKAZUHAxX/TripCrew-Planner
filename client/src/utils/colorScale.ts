// Maps an availability count to a heatmap color (Feature 2 scale).
export function countToColor(count: number | undefined): string {
    if (!count || count === 0) return '#ffffff';
    if (count === 1) return '#C0DD97';
    if (count === 2) return '#5DCAA5';
    return '#0F6E56';
}
