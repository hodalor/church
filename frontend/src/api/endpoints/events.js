import api from '../axios';

const unwrap = (response) => response.data?.data || response.data;

export const createEvent = async (data) => unwrap(await api.post('/events', data));
export const getAllEvents = async (params = {}) => unwrap(await api.get('/events', { params }));
export const getUpcomingEvents = async (params = {}) =>
  unwrap(await api.get('/events/upcoming', { params }));
export const getEventStats = async (params = {}) => unwrap(await api.get('/events/stats', { params }));
export const getEventById = async (id, params = {}) => unwrap(await api.get(`/events/${id}`, { params }));
export const updateEvent = async (id, data) => unwrap(await api.patch(`/events/${id}`, data));
export const deleteEvent = async (id) => unwrap(await api.delete(`/events/${id}`));
export const updateEventStatus = async (id, status) =>
  unwrap(await api.patch(`/events/${id}/status`, { status }));
export const publishEvent = async (id) => unwrap(await api.post(`/events/${id}/publish`));
export const registerForEvent = async (eventId, data) =>
  unwrap(await api.post(`/events/${eventId}/register`, data));
export const getEventRegistrations = async (eventId, params = {}) =>
  unwrap(await api.get(`/events/${eventId}/registrations`, { params }));
export const updateRegistration = async (eventId, regId, data) =>
  unwrap(await api.patch(`/events/${eventId}/registrations/${regId}`, data));
export const checkInToEvent = async (eventId, regId, data = {}) =>
  unwrap(await api.patch(`/events/${eventId}/registrations/${regId}/checkin`, data));
export const approveRegistration = async (eventId, regId, approvalStatus = 'approved') =>
  unwrap(await api.patch(`/events/${eventId}/registrations/${regId}/approve`, { approvalStatus }));
export const getRegistrationStats = async (eventId, params = {}) =>
  unwrap(await api.get(`/events/${eventId}/registrations/stats`, { params }));
export const getMyRegistrations = async (params = {}) =>
  unwrap(await api.get('/events/my-registrations', { params }));
export const getPlatformEventsOverview = async (params = {}) =>
  unwrap(await api.get('/admin/events/overview', { params }));
export const getPlatformVolunteerOverview = async (params = {}) =>
  unwrap(await api.get('/admin/volunteers/overview', { params }));
