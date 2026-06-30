import type {
    MyVoteResponse,
    ScoredDestination,
    TallyResponse,
    Vote,
    VoteResponse,
} from '@tripcrew/shared';
import api from './axiosInstance';

export async function getMyVote(tripId: string): Promise<Vote | null> {
    const { data } = await api.get<MyVoteResponse>(`/trips/${tripId}/vote`);
    return data.vote;
}

export async function submitVote(tripId: string, ranking: string[]): Promise<Vote> {
    const { data } = await api.put<VoteResponse>(`/trips/${tripId}/vote`, { ranking });
    return data.vote;
}

export async function getTally(tripId: string): Promise<ScoredDestination[]> {
    const { data } = await api.get<TallyResponse>(`/trips/${tripId}/tally`);
    return data.scores;
}
