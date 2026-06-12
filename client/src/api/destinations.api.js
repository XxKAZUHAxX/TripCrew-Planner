import api from './axiosInstance.js';

export async function listDestinations(tripId) {
  const { data } = await api.get(`/trips/${tripId}/destinations`);
  return data.destinations;
}

export async function proposeDestination(tripId, payload) {
  const { data } = await api.post(`/trips/${tripId}/destinations`, payload);
  return data.destination;
}

export async function deleteDestination(tripId, id) {
  const { data } = await api.delete(`/trips/${tripId}/destinations/${id}`);
  return data;
}
