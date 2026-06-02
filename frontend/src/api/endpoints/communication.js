import api from '../axios';

export const getCommunicationDashboard = async (params) => {
  const response = await api.get('/communication/dashboard', { params });
  return response.data?.data || response.data;
};

export const previewBroadcastAudience = async (payload, params) => {
  const response = await api.post('/communication/broadcasts/preview', payload, { params });
  return response.data?.data || response.data;
};

export const createBroadcast = async (payload, params) => {
  const response = await api.post('/communication/broadcasts', payload, { params });
  return response.data?.data || response.data;
};

export const updateBroadcast = async (broadcastId, payload, params) => {
  const response = await api.patch(`/communication/broadcasts/${broadcastId}`, payload, { params });
  return response.data?.data || response.data;
};

export const getBroadcasts = async (params) => {
  const response = await api.get('/communication/broadcasts', { params });
  return response.data?.data || response.data;
};

export const getBroadcastById = async (broadcastId, params) => {
  const response = await api.get(`/communication/broadcasts/${broadcastId}`, { params });
  return response.data?.data || response.data;
};

export const getBroadcastLogs = async (broadcastId, params) => {
  const response = await api.get(`/communication/broadcasts/${broadcastId}/logs`, { params });
  return response.data?.data || response.data;
};

export const duplicateBroadcast = async (broadcastId, payload) => {
  const response = await api.post(`/communication/broadcasts/${broadcastId}/duplicate`, payload);
  return response.data?.data || response.data;
};

export const cancelBroadcast = async (broadcastId, payload) => {
  const response = await api.post(`/communication/broadcasts/${broadcastId}/cancel`, payload);
  return response.data?.data || response.data;
};

export const resendFailedBroadcast = async (broadcastId, payload) => {
  const response = await api.post(`/communication/broadcasts/${broadcastId}/resend-failed`, payload);
  return response.data?.data || response.data;
};

export const deleteBroadcast = async (broadcastId, payload) => {
  const response = await api.delete(`/communication/broadcasts/${broadcastId}`, { data: payload });
  return response.data?.data || response.data;
};

export const getTemplates = async (params) => {
  const response = await api.get('/communication/templates', { params });
  return response.data?.data || response.data;
};

export const createTemplate = async (payload, params) => {
  const response = await api.post('/communication/templates', payload, { params });
  return response.data?.data || response.data;
};

export const updateTemplate = async (templateId, payload, params) => {
  const response = await api.patch(`/communication/templates/${templateId}`, payload, { params });
  return response.data?.data || response.data;
};

export const deleteTemplate = async (templateId, payload) => {
  const response = await api.delete(`/communication/templates/${templateId}`, { data: payload });
  return response.data?.data || response.data;
};

export const previewTemplate = async (payload, params) => {
  const response = await api.post('/communication/templates/preview', payload, { params });
  return response.data?.data || response.data;
};

export const getPrayerRequests = async (params) => {
  const response = await api.get('/communication/prayer-requests', { params });
  return response.data?.data || response.data;
};

export const createPrayerRequest = async (payload, params) => {
  const response = await api.post('/communication/prayer-requests', payload, { params });
  return response.data?.data || response.data;
};

export const updatePrayerRequest = async (requestId, payload, params) => {
  const response = await api.patch(`/communication/prayer-requests/${requestId}`, payload, { params });
  return response.data?.data || response.data;
};

export const prayForRequest = async (requestId, payload) => {
  const response = await api.post(`/communication/prayer-requests/${requestId}/pray`, payload);
  return response.data?.data || response.data;
};

export const getPolls = async (params) => {
  const response = await api.get('/communication/polls', { params });
  return response.data?.data || response.data;
};

export const createPoll = async (payload, params) => {
  const response = await api.post('/communication/polls', payload, { params });
  return response.data?.data || response.data;
};

export const closePoll = async (pollId, payload) => {
  const response = await api.post(`/communication/polls/${pollId}/close`, payload);
  return response.data?.data || response.data;
};

export const voteOnPoll = async (pollId, optionId, params) => {
  const response = await api.post(`/communication/polls/${pollId}/vote`, { optionId }, { params });
  return response.data?.data || response.data;
};

export const getInbox = async (params) => {
  const response = await api.get('/communication/inbox', { params });
  return response.data?.data || response.data;
};

export const getPlatformCommunicationStats = async (params) => {
  const response = await api.get('/communication/platform', { params });
  return response.data?.data || response.data;
};
