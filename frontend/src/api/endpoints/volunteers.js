import api from '../axios';

const unwrap = (response) => response.data?.data || response.data;

export const registerVolunteer = async (data) => unwrap(await api.post('/volunteers', data));
export const getAllVolunteers = async (params = {}) => unwrap(await api.get('/volunteers', { params }));
export const getVolunteerStats = async (params = {}) =>
  unwrap(await api.get('/volunteers/stats', { params }));
export const getAvailableVolunteers = async (params = {}) =>
  unwrap(await api.get('/volunteers/available', { params }));
export const getVolunteerById = async (id, params = {}) =>
  unwrap(await api.get(`/volunteers/${id}`, { params }));
export const getVolunteerByMemberId = async (memberId, params = {}) =>
  unwrap(await api.get(`/volunteers/member/${memberId}`, { params }));
export const updateVolunteer = async (id, data) => unwrap(await api.patch(`/volunteers/${id}`, data));
export const updateVolunteerStatus = async (id, status) =>
  unwrap(await api.patch(`/volunteers/${id}/status`, { status }));
export const updatePerformance = async (id, data) =>
  unwrap(await api.patch(`/volunteers/${id}/performance`, data));
export const addTraining = async (id, data) => unwrap(await api.post(`/volunteers/${id}/training`, data));
export const removeVolunteer = async (id) => unwrap(await api.delete(`/volunteers/${id}`));
