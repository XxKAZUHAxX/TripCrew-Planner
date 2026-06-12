import api from './axiosInstance.js';

export async function getArchetypes(tripId) {
  const { data } = await api.get(`/trips/${tripId}/archetypes`);
  return data;
}
