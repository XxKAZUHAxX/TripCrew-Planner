import { describe, it, expect } from 'vitest';
import { countToColor, isDarkShade } from './colorScale';

describe('countToColor', () => {
    it('returns white for zero, falsy, or missing total', () => {
        expect(countToColor(0, 4)).toBe('#ffffff');
        expect(countToColor(undefined, 4)).toBe('#ffffff');
        expect(countToColor(2, 0)).toBe('#ffffff');
        expect(countToColor(2, undefined)).toBe('#ffffff');
    });

    it('scales proportionally to the total member count', () => {
        // 1 of 4 = 25% -> light green step
        expect(countToColor(1, 4)).toBe('#c0dd97');
        // 2 of 4 = 50% -> green step
        expect(countToColor(2, 4)).toBe('#5dcaa5');
        // 3 of 4 = 75% -> darker green step
        expect(countToColor(3, 4)).toBe('#2e9e7a');
    });

    it('reserves the darkest color for full turnout only', () => {
        expect(countToColor(4, 4)).toBe('#0f6e56');
        // Same headcount, larger group -> lighter shade, not the darkest.
        expect(countToColor(3, 10)).not.toBe('#0f6e56');
    });
});

describe('isDarkShade', () => {
    it('is false with no total or low ratio', () => {
        expect(isDarkShade(1, undefined)).toBe(false);
        expect(isDarkShade(1, 4)).toBe(false);
    });

    it('is true once the ratio crosses the contrast threshold', () => {
        expect(isDarkShade(3, 4)).toBe(true);
        expect(isDarkShade(4, 4)).toBe(true);
    });
});
