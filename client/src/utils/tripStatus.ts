import type { TripStatus } from '@tripcrew/shared';

/** Plain-language, emoji-prefixed labels for trip status (Issue 4). */
export const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
    voting: '🗳️ Voting in progress',
    decided: '✅ Destination decided',
    archived: '📦 Archived',
};
