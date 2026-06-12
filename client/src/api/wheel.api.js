import api from './axiosInstance.js';

export async function getWheelStatus(tripId) {
  const { data } = await api.get(`/trips/${tripId}/wheel/status`);
  return data;
}

export async function spinWheel(tripId) {
  const { data } = await api.post(`/trips/${tripId}/wheel/spin`);
  return data;
}
