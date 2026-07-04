import type {
    Availability,
    AvailabilitySummaryResponse,
    Heatmap,
    MyAvailabilityResponse,
    OptOutResponse,
    SaveAvailabilityResponse,
} from '@tripcrew/shared';
import api from './axiosInstance';

export async function getMyAvailability(tripId: string): Promise<MyAvailabilityResponse> {
    const { data } = await api.get<MyAvailabilityResponse>(`/trips/${tripId}/availability/me`);
    return data;
}

export async function saveAvailability(tripId: string, dates: string[]): Promise<Availability> {
    const { data } = await api.put<SaveAvailabilityResponse>(`/trips/${tripId}/availability`, {
        dates,
    });
    return data.availability;
}

export async function optOutOfTrip(tripId: string): Promise<Availability> {
    const { data } = await api.post<OptOutResponse>(`/trips/${tripId}/availability/opt-out`);
    return data.availability;
}

export async function getHeatmap(tripId: string): Promise<Heatmap> {
    const { data } = await api.get<Heatmap>(`/trips/${tripId}/availability/heatmap`);
    return data;
}

export async function getAvailabilitySummary(tripId: string): Promise<AvailabilitySummaryResponse> {
    const { data } = await api.get<AvailabilitySummaryResponse>(
        `/trips/${tripId}/availability/summary`
    );
    return data;
}
