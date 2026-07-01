import type {
    ConcludeResponse,
    CreateTripRequest,
    CreateTripResponse,
    DashboardResponse,
    ListTripsResponse,
    OkResponse,
    Trip,
    TripDetailResponse,
    TripPreviewResponse,
    TripResponse,
    UpdateTripRequest,
} from '@tripcrew/shared';
import api from './axiosInstance';

export async function createTrip(payload: CreateTripRequest): Promise<Trip> {
    const { data } = await api.post<CreateTripResponse>('/trips', payload);
    return data.trip;
}

export async function listMyTrips(): Promise<Trip[]> {
    const { data } = await api.get<ListTripsResponse>('/trips');
    return data.trips;
}

export async function getTrip(tripId: string): Promise<TripDetailResponse> {
    const { data } = await api.get<TripDetailResponse>(`/trips/${tripId}`);
    return data;
}

export async function updateTrip(tripId: string, payload: UpdateTripRequest): Promise<Trip> {
    const { data } = await api.patch<TripResponse>(`/trips/${tripId}`, payload);
    return data.trip;
}

export async function joinTrip(inviteCode: string): Promise<Trip> {
    const { data } = await api.post<TripResponse>(`/trips/join/${inviteCode}`);
    return data.trip;
}

export async function toggleInvite(tripId: string, inviteActive: boolean): Promise<Trip> {
    const { data } = await api.patch<TripResponse>(`/trips/${tripId}/invite`, { inviteActive });
    return data.trip;
}

export async function getDashboard(tripId: string): Promise<DashboardResponse> {
    const { data } = await api.get<DashboardResponse>(`/trips/${tripId}/dashboard`);
    return data;
}

export async function previewTrip(inviteCode: string): Promise<TripPreviewResponse> {
    const { data } = await api.get<TripPreviewResponse>(`/trips/preview/${inviteCode}`);
    return data;
}

export async function deleteTrip(tripId: string): Promise<OkResponse> {
    const { data } = await api.delete<OkResponse>(`/trips/${tripId}`);
    return data;
}

export async function leaveTrip(tripId: string): Promise<OkResponse> {
    const { data } = await api.post<OkResponse>(`/trips/${tripId}/leave`);
    return data;
}

export async function concludeVoting(tripId: string): Promise<ConcludeResponse> {
    const { data } = await api.post<ConcludeResponse>(`/trips/${tripId}/conclude`);
    return data;
}
