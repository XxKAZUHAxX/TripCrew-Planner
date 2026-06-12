import api from './axiosInstance.js';

export async function getMyAvailability(tripId) {
  const { data } = await api.get(`/trips/${tripId}/availability/me`);
  return data.dates;
}

export async function saveAvailability(tripId, dates) {
  const { data } = await api.put(`/trips/${tripId}/availability`, { dates });
  return data.availability;
}

export async function getHeatmap(tripId) {
  const { data } = await api.get(`/trips/${tripId}/availability/heatmap`);
  return data;
}
