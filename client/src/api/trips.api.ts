import type {
    CreateTripRequest,
    CreateTripResponse,
    DashboardResponse,
    ListTripsResponse,
    Trip,
    TripDetailResponse,
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
