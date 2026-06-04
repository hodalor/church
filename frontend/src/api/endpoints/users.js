import api from '../axios';

export const getUsers = async (params) => {
  const response = await api.get('/users', { params });
  return response.data?.data || response.data;
};

export const createUser = async (payload) => {
  const response = await api.post('/users', payload);
  return response.data?.data || response.data;
};

export const updateUser = async (userId, payload, params) => {
  const response = await api.patch(`/users/${userId}`, payload, { params });
  return response.data?.data || response.data;
};
