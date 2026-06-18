import api from '../axios';

export const loginUser = async (payload) => {
  const response = await api.post('/auth/login', payload);
  return response.data?.data || response.data;
};

export const refreshToken = async (payload) => {
  const response = await api.post('/auth/refresh', payload);
  return response.data?.data || response.data;
};

export const logoutUser = async (payload = {}) => {
  const response = await api.post('/auth/logout', payload);
  return response.data?.data || response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data?.data || response.data;
};
