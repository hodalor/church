import api from '../axios';

const unwrap = (response) => response.data?.data || response.data;

export const createRoster = async (data) => unwrap(await api.post('/rosters', data));
export const getAllRosters = async (params = {}) => unwrap(await api.get('/rosters', { params }));
export const getUpcomingRosters = async (params = {}) =>
  unwrap(await api.get('/rosters/upcoming', { params }));
export const getRosterById = async (id, params = {}) => unwrap(await api.get(`/rosters/${id}`, { params }));
export const updateRoster = async (id, data) => unwrap(await api.patch(`/rosters/${id}`, data));
export const deleteRoster = async (id) => unwrap(await api.delete(`/rosters/${id}`));
export const addAssignment = async (rosterId, data) =>
  unwrap(await api.post(`/rosters/${rosterId}/assign`, data));
export const updateAssignment = async (rosterId, assignmentId, data) =>
  unwrap(await api.patch(`/rosters/${rosterId}/assignments/${assignmentId}`, data));
export const removeAssignment = async (rosterId, assignmentId) =>
  unwrap(await api.delete(`/rosters/${rosterId}/assignments/${assignmentId}`));
export const publishRoster = async (rosterId) => unwrap(await api.patch(`/rosters/${rosterId}/publish`));
export const autoGenerateRoster = async (data) => unwrap(await api.post('/rosters/auto-generate', data));
export const markAttendance = async (rosterId, assignmentId, status) =>
  unwrap(await api.patch(`/rosters/${rosterId}/assignments/${assignmentId}/attendance`, { status }));
