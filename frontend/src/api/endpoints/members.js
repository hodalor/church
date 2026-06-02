import api from '../axios';

export const getMembers = async (params) => {
  const response = await api.get('/members', { params });
  return response.data?.data || response.data;
};

export const getMemberStats = async (params) => {
  const response = await api.get('/members/stats', { params });
  return response.data?.data || response.data;
};

export const createMember = async (payload) => {
  const response = await api.post('/members', payload);
  return response.data?.data || response.data;
};

export const getMemberById = async (memberId) => {
  const response = await api.get(`/members/${memberId}`);
  return response.data?.data || response.data;
};

export const searchMembers = async (params) => {
  const response = await api.get('/members/search', { params });
  return response.data?.data || response.data;
};

export const updateMember = async (memberId, payload) => {
  const response = await api.patch(`/members/${memberId}`, payload);
  return response.data?.data || response.data;
};

export const softDeleteMember = async (memberId) => {
  const response = await api.delete(`/members/${memberId}`);
  return response.data?.data || response.data;
};

export const restoreMember = async (memberId) => {
  const response = await api.post(`/members/${memberId}/restore`);
  return response.data?.data || response.data;
};

export const recalculateHealthScore = async (memberId, payload) => {
  const response = await api.patch(`/members/${memberId}/health-score`, payload);
  return response.data?.data || response.data;
};

export const getMembersByHealthStatus = async (params) => {
  const response = await api.get('/members/health-scores', { params });
  return response.data?.data || response.data;
};

export const getMemberQrCode = async (memberId, params) => {
  const response = await api.get(`/members/${memberId}/qr-code`, { params });
  return response.data?.data || response.data;
};

export const getFamilyGroup = async (familyGroupId, params) => {
  const response = await api.get(`/members/family/${familyGroupId}`, { params });
  return response.data?.data || response.data;
};

export const exportMembers = async (params) => {
  const response = await api.get('/members/export', { params });
  return response.data?.data || response.data;
};

export const bulkImportMembers = async (payload, params) => {
  const response = await api.post('/members/bulk-import', payload, { params });
  return response.data?.data || response.data;
};

export const updateMemberPhoto = async (memberId, photoUrl, params) => {
  const response = await api.patch(`/members/${memberId}/photo`, { photoUrl }, { params });
  return response.data?.data || response.data;
};
