import api from './axiosInstance.js';

export async function createTrip(payload) {
  const { data } = await api.post('/trips', payload);
  return data.trip;
}

export async function listMyTrips() {
  const { data } = await api.get('/trips');
  return data.trips;
}

export async function getTrip(tripId) {
  const { data } = await api.get(`/trips/${tripId}`);
  return data;
}

export async function updateTrip(tripId, payload) {
  const { data } = await api.patch(`/trips/${tripId}`, payload);
  return data.trip;
}

export async function joinTrip(inviteCode) {
  const { data } = await api.post(`/trips/join/${inviteCode}`);
  return data.trip;
}

export async function toggleInvite(tripId, inviteActive) {
  const { data } = await api.patch(`/trips/${tripId}/invite`, { inviteActive });
  return data.trip;
}

export async function getDashboard(tripId) {
  const { data } = await api.get(`/trips/${tripId}/dashboard`);
  return data;
}
