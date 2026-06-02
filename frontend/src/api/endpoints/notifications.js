import api from '../axios';

export const getNotifications = async (params) => {
  const response = await api.get('/notifications', { params });
  return response.data?.data || response.data;
};

export const markNotificationRead = async (notificationId, payload) => {
  const response = await api.patch(`/notifications/${notificationId}/read`, payload);
  return response.data?.data || response.data;
};

export const markAllNotificationsRead = async (payload) => {
  const response = await api.patch('/notifications/read-all', payload);
  return response.data?.data || response.data;
};
