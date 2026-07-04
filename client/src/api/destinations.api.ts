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

export async function addComment(tripId: string, id: string, text: string): Promise<Destination> {
    const { data } = await api.post<DestinationResponse>(
        `/trips/${tripId}/destinations/${id}/comments`,
        { text }
    );
    return data.destination;
}

export async function deleteComment(
    tripId: string,
    id: string,
    commentId: string
): Promise<Destination> {
    const { data } = await api.delete<DestinationResponse>(
        `/trips/${tripId}/destinations/${id}/comments/${commentId}`
    );
    return data.destination;
}

export async function uploadImages(
    tripId: string,
    id: string,
    files: File[]
): Promise<Destination> {
    const form = new FormData();
    files.forEach((f) => form.append('images', f));
    const { data } = await api.post<DestinationResponse>(
        `/trips/${tripId}/destinations/${id}/images`,
        form
    );
    return data.destination;
}

export async function deleteDestinationImage(
    tripId: string,
    id: string,
    imageId: string
): Promise<Destination> {
    const { data } = await api.delete<DestinationResponse>(
        `/trips/${tripId}/destinations/${id}/images/${imageId}`
    );
    return data.destination;
}
