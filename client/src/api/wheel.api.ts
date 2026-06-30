import type { SpinResponse, WheelStatusResponse } from '@tripcrew/shared';
import api from './axiosInstance';

export async function getWheelStatus(tripId: string): Promise<WheelStatusResponse> {
    const { data } = await api.get<WheelStatusResponse>(`/trips/${tripId}/wheel/status`);
    return data;
}

export async function spinWheel(tripId: string): Promise<SpinResponse> {
    const { data } = await api.post<SpinResponse>(`/trips/${tripId}/wheel/spin`);
    return data;
}
