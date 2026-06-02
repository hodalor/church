import api from '../axios';

const unwrap = (response) => response.data?.data || response.data;

export const getServices = async (params) => {
  const response = await api.get('/attendance/services', { params });
  return unwrap(response);
};

export const getServiceById = async (serviceId, params) => {
  const response = await api.get(`/attendance/services/${serviceId}`, { params });
  return unwrap(response);
};

export const createService = async (payload) => {
  const response = await api.post('/attendance/services', payload);
  return unwrap(response);
};

export const updateService = async (serviceId, payload) => {
  const response = await api.patch(`/attendance/services/${serviceId}`, payload);
  return unwrap(response);
};

export const deleteService = async (serviceId) => {
  const response = await api.delete(`/attendance/services/${serviceId}`);
  return unwrap(response);
};

export const toggleServiceCheckIn = async (serviceId, isOpen) => {
  const response = await api.patch(`/attendance/services/${serviceId}/check-in`, {
    isOpen,
  });
  return unwrap(response);
};

export const computeServiceStats = async (serviceId) => {
  const response = await api.post(`/attendance/services/${serviceId}/compute-stats`);
  return unwrap(response);
};

export const updateOfflineCount = async (serviceId, payload) => {
  const response = await api.patch(`/attendance/services/${serviceId}/offline-count`, payload);
  return unwrap(response);
};

export const getServiceAttendance = async (serviceId, params) => {
  const response = await api.get(`/attendance/services/${serviceId}/check-ins`, { params });
  return unwrap(response);
};

export const removeCheckIn = async (serviceId, checkInId) => {
  const response = await api.delete(`/attendance/services/${serviceId}/check-ins/${checkInId}`);
  return unwrap(response);
};

export const searchCheckInMembers = async (params) => {
  const response = await api.get('/attendance/check-in/search', { params });
  return unwrap(response);
};

export const checkInByQr = async (serviceId, payload) => {
  const response = await api.post(`/attendance/services/${serviceId}/check-in/qr`, payload);
  return unwrap(response);
};

export const manualMemberCheckIn = async (serviceId, payload) => {
  const response = await api.post(`/attendance/services/${serviceId}/check-in/member`, payload);
  return unwrap(response);
};

export const visitorCheckIn = async (serviceId, payload) => {
  const response = await api.post(`/attendance/services/${serviceId}/check-in/visitor`, payload);
  return unwrap(response);
};

export const childCheckIn = async (serviceId, payload) => {
  const response = await api.post(`/attendance/services/${serviceId}/check-in/child`, payload);
  return unwrap(response);
};

export const getLiveCheckIns = async (serviceId, params) => {
  const response = await api.get(`/attendance/services/${serviceId}/live`, { params });
  return unwrap(response);
};

export const getAttendanceSummary = async (params) => {
  const response = await api.get('/attendance/reports/summary', { params });
  return unwrap(response);
};

export const getAttendanceTrends = async (params) => {
  const response = await api.get('/attendance/reports/trends', { params });
  return unwrap(response);
};

export const getAttendanceHeatmap = async (params) => {
  const response = await api.get('/attendance/reports/heatmap', { params });
  return unwrap(response);
};

export const getAttendanceRetention = async (params) => {
  const response = await api.get('/attendance/reports/retention', { params });
  return unwrap(response);
};

export const getBranchAttendanceComparison = async (params) => {
  const response = await api.get('/attendance/reports/branch-comparison', { params });
  return unwrap(response);
};

export const getMemberAttendanceReport = async (memberId, params) => {
  const response = await api.get(`/attendance/reports/member/${memberId}`, { params });
  return unwrap(response);
};

export const getAbsentees = async (params) => {
  const response = await api.get('/attendance/absentees', { params });
  return unwrap(response);
};

export const getPlatformAttendanceOverview = async (params) => {
  const response = await api.get('/admin/attendance/overview', { params });
  return unwrap(response);
};
