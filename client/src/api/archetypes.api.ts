import type { ArchetypesResponse } from '@tripcrew/shared';
import api from './axiosInstance';

export async function getArchetypes(tripId: string): Promise<ArchetypesResponse> {
    const { data } = await api.get<ArchetypesResponse>(`/trips/${tripId}/archetypes`);
    return data;
}
