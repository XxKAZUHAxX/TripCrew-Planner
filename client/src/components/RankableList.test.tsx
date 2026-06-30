import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RankableList, { type RankableItem } from './RankableList';

const tokyo: RankableItem = { _id: 'a', name: 'Tokyo' };
const bali: RankableItem = { _id: 'b', name: 'Bali' };

describe('RankableList', () => {
    it('adds an unranked item to the ranking', async () => {
        const onRankingChange = vi.fn();
        render(<RankableList ranked={[]} unranked={[tokyo]} onRankingChange={onRankingChange} />);

        await userEvent.click(screen.getByRole('button', { name: 'Add to ranking' }));

        expect(onRankingChange).toHaveBeenCalledWith(['a']);
    });

    it('reorders ranked items with the up control', async () => {
        const onRankingChange = vi.fn();
        render(
            <RankableList ranked={[tokyo, bali]} unranked={[]} onRankingChange={onRankingChange} />
        );

        // The second row's up button moves Bali above Tokyo.
        const upButtons = screen.getAllByRole('button', { name: '↑' });
        await userEvent.click(upButtons[1]!);

        expect(onRankingChange).toHaveBeenCalledWith(['b', 'a']);
    });
});
