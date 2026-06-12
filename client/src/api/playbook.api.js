import api from './axiosInstance.js';

export async function getPlaybook(tripId) {
  const { data } = await api.get(`/trips/${tripId}/playbook`);
  return data;
}

export async function updateInstructions(tripId, instructions) {
  const { data } = await api.patch(`/trips/${tripId}/playbook/instructions`, { instructions });
  return data.instructions;
}

export async function addTask(tripId, label) {
  const { data } = await api.post(`/trips/${tripId}/playbook/tasks`, { label });
  return data.task;
}

export async function toggleTask(tripId, taskId) {
  const { data } = await api.patch(`/trips/${tripId}/playbook/tasks/${taskId}/toggle`);
  return data.task;
}

export async function deleteTask(tripId, taskId) {
  const { data } = await api.delete(`/trips/${tripId}/playbook/tasks/${taskId}`);
  return data;
}
