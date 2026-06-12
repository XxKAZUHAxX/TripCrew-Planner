import api from './axiosInstance.js';

export async function getMyVote(tripId) {
  const { data } = await api.get(`/trips/${tripId}/vote`);
  return data.vote;
}

export async function submitVote(tripId, ranking) {
  const { data } = await api.put(`/trips/${tripId}/vote`, { ranking });
  return data.vote;
}

export async function getTally(tripId) {
  const { data } = await api.get(`/trips/${tripId}/tally`);
  return data.scores;
}
