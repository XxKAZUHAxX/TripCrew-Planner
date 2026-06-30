import { describe, it, expect } from 'vitest';
import { refId } from './refs';

describe('refId', () => {
    it('returns undefined for null or undefined', () => {
        expect(refId(null)).toBeUndefined();
        expect(refId(undefined)).toBeUndefined();
    });

    it('returns a raw string id unchanged', () => {
        expect(refId('abc123')).toBe('abc123');
    });

    it('extracts _id from a populated reference', () => {
        expect(refId({ _id: 'xyz789' })).toBe('xyz789');
    });
});
