import type {
    Destination,
    DestinationResponse,
    ListDestinationsResponse,
    OkResponse,
    ProposeDestinationRequest,
    UpdateDestinationRequest,
} from '@tripcrew/shared';
import api from './axiosInstance';

export async function listDestinations(tripId: string): Promise<Destination[]> {
    const { data } = await api.get<ListDestinationsResponse>(`/trips/${tripId}/destinations`);
    return data.destinations;
}

export async function proposeDestination(
    tripId: string,
    payload: ProposeDestinationRequest
): Promise<Destination> {
    const { data } = await api.post<DestinationResponse>(`/trips/${tripId}/destinations`, payload);
    return data.destination;
}

export async function updateDestination(
    tripId: string,
    id: string,
    payload: UpdateDestinationRequest
): Promise<Destination> {
    const { data } = await api.patch<DestinationResponse>(
        `/trips/${tripId}/destinations/${id}`,
        payload
    );
    return data.destination;
}

export async function deleteDestination(tripId: string, id: string): Promise<OkResponse> {
    const { data } = await api.delete<OkResponse>(`/trips/${tripId}/destinations/${id}`);
    return data;
}
