import api from '../axios';

const unwrap = (response) => response.data?.data || response.data;

export const createMinistry = async (data) => unwrap(await api.post('/ministry', data));

export const getAllMinistries = async (params) =>
  unwrap(await api.get('/ministry', { params }));

export const getMinistryStats = async () => unwrap(await api.get('/ministry/stats'));

export const getMinistryById = async (id) => unwrap(await api.get(`/ministry/${id}`));

export const updateMinistry = async (id, data) =>
  unwrap(await api.patch(`/ministry/${id}`, data));

export const deactivateMinistry = async (id) =>
  unwrap(await api.delete(`/ministry/${id}`));

export const addMemberToMinistry = async (ministryId, data) =>
  unwrap(await api.post(`/ministry/${ministryId}/members`, data));

export const getMinistryMembers = async (ministryId, params) =>
  unwrap(await api.get(`/ministry/${ministryId}/members`, { params }));

export const updateMemberRole = async (ministryId, memberId, data) =>
  unwrap(await api.patch(`/ministry/${ministryId}/members/${memberId}`, data));

export const removeMemberFromMinistry = async (ministryId, memberId) =>
  unwrap(await api.delete(`/ministry/${ministryId}/members/${memberId}`));

export const bulkAddMembers = async (ministryId, data) =>
  unwrap(await api.post(`/ministry/${ministryId}/members/bulk`, data));

export const getMemberMinistries = async (memberId) =>
  unwrap(await api.get(`/ministry/member/${memberId}/ministries`));

export const createMeeting = async (ministryId, data) =>
  unwrap(await api.post(`/ministry/${ministryId}/meetings`, data));

export const getMinistryMeetings = async (ministryId, params) =>
  unwrap(await api.get(`/ministry/${ministryId}/meetings`, { params }));

export const getMeetingById = async (ministryId, meetingId) =>
  unwrap(await api.get(`/ministry/${ministryId}/meetings/${meetingId}`));

export const updateMeeting = async (ministryId, meetingId, data) =>
  unwrap(await api.patch(`/ministry/${ministryId}/meetings/${meetingId}`, data));

export const recordMeetingAttendance = async (ministryId, meetingId, data) =>
  unwrap(await api.post(`/ministry/${ministryId}/meetings/${meetingId}/attendance`, data));

export const getMinistryOverviewReport = async () =>
  unwrap(await api.get('/ministry/reports/overview'));

export const getMinistryReport = async (ministryId) =>
  unwrap(await api.get(`/ministry/reports/${ministryId}`));
