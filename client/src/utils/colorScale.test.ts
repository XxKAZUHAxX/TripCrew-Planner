import { describe, it, expect } from 'vitest';
import { countToColor } from './colorScale';

describe('countToColor', () => {
    it('returns white for zero or falsy counts', () => {
        expect(countToColor(0)).toBe('#ffffff');
        expect(countToColor(undefined)).toBe('#ffffff');
    });

    it('maps small counts to the lighter scale steps', () => {
        expect(countToColor(1)).toBe('#C0DD97');
        expect(countToColor(2)).toBe('#5DCAA5');
    });

    it('caps at the darkest color for three or more', () => {
        expect(countToColor(3)).toBe('#0F6E56');
        expect(countToColor(99)).toBe('#0F6E56');
    });
});
