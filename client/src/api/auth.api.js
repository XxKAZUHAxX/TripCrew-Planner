import api from './axiosInstance.js';

export async function register({ name, email, password }) {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
}

export async function login({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data.user;
}
