import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ScoredDestination } from '@tripcrew/shared';
import ScoreBoard from './ScoreBoard';

describe('ScoreBoard', () => {
    it('shows an empty state when there are no scores', () => {
        render(<ScoreBoard scores={[]} />);
        expect(screen.getByText('No scores yet.')).toBeInTheDocument();
    });

    it('renders each destination name and score', () => {
        const scores: ScoredDestination[] = [
            { destId: '1', name: 'Tokyo', estimatedCost: 5000, score: 5 },
            { destId: '2', name: 'Bali', estimatedCost: null, score: 3 },
        ];
        render(<ScoreBoard scores={scores} />);
        expect(screen.getByText('Tokyo')).toBeInTheDocument();
        expect(screen.getByText('Bali')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });
});
