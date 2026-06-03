import api from '../axios';

const unwrap = (response) => response.data?.data || response.data;

export const createCase = async (data) => unwrap(await api.post('/pastoral/cases', data));
export const getAllCases = async (params = {}) => unwrap(await api.get('/pastoral/cases', { params }));
export const getCareStats = async () => unwrap(await api.get('/pastoral/cases/stats'));
export const getMyCases = async (params = {}) => unwrap(await api.get('/pastoral/cases/my', { params }));
export const getUrgentCases = async () => unwrap(await api.get('/pastoral/cases/urgent'));
export const getMemberCases = async (memberId) => unwrap(await api.get(`/pastoral/cases/member/${memberId}`));
export const getCaseById = async (caseId) => unwrap(await api.get(`/pastoral/cases/${caseId}`));
export const updateCase = async (caseId, data) => unwrap(await api.patch(`/pastoral/cases/${caseId}`, data));
export const assignCase = async (caseId, userId) =>
  unwrap(await api.patch(`/pastoral/cases/${caseId}/assign`, { assignedTo: userId }));
export const updateCaseStatus = async (caseId, status, resolutionNotes = '') =>
  unwrap(await api.patch(`/pastoral/cases/${caseId}/status`, { status, resolutionNotes }));
export const addInteraction = async (caseId, data) =>
  unwrap(await api.post(`/pastoral/cases/${caseId}/interactions`, data));
export const updateInteraction = async (caseId, interactionId, data) =>
  unwrap(await api.patch(`/pastoral/cases/${caseId}/interactions/${interactionId}`, data));
export const addMilestone = async (caseId, data) =>
  unwrap(await api.post(`/pastoral/cases/${caseId}/milestones`, data));
export const addPrayerRequest = async (caseId, data) =>
  unwrap(await api.post(`/pastoral/cases/${caseId}/prayer-requests`, data));
export const markPrayerAnswered = async (caseId, prId, testimonial) =>
  unwrap(await api.patch(`/pastoral/cases/${caseId}/prayer-requests/${prId}/answered`, { testimonial }));

export const createAppointment = async (data) => unwrap(await api.post('/pastoral/appointments', data));
export const getAllAppointments = async (params = {}) =>
  unwrap(await api.get('/pastoral/appointments', { params }));
export const getTodayAppointments = async () => unwrap(await api.get('/pastoral/appointments/today'));
export const getUpcomingAppointments = async () => unwrap(await api.get('/pastoral/appointments/upcoming'));
export const getMyAppointments = async () => unwrap(await api.get('/pastoral/appointments/my'));
export const getAppointmentById = async (id) => unwrap(await api.get(`/pastoral/appointments/${id}`));
export const updateAppointment = async (id, data) => unwrap(await api.patch(`/pastoral/appointments/${id}`, data));
export const updateAppointmentStatus = async (id, status, completionNotes = '') =>
  unwrap(await api.patch(`/pastoral/appointments/${id}/status`, { status, completionNotes }));
export const cancelAppointment = async (id) => unwrap(await api.delete(`/pastoral/appointments/${id}`));

export const createTrack = async (data) => unwrap(await api.post('/pastoral/tracks', data));
export const getAllTracks = async (params = {}) => unwrap(await api.get('/pastoral/tracks', { params }));
export const updateTrack = async (trackId, data) => unwrap(await api.patch(`/pastoral/tracks/${trackId}`, data));
export const enrollMember = async (data) => unwrap(await api.post('/pastoral/discipleship/enroll', data));
export const getAllEnrollments = async (params = {}) =>
  unwrap(await api.get('/pastoral/discipleship', { params }));
export const getMemberDiscipleship = async (memberId) =>
  unwrap(await api.get(`/pastoral/discipleship/member/${memberId}`));
export const completeStep = async (enrollmentId, stepNumber, data = {}) =>
  unwrap(await api.patch(`/pastoral/discipleship/${enrollmentId}/step`, { stepNumber, ...data }));
export const updateEnrollmentStatus = async (enrollmentId, status, notes = '') =>
  unwrap(await api.patch(`/pastoral/discipleship/${enrollmentId}/status`, { status, notes }));

export const getPastoralCareReport = async () => unwrap(await api.get('/pastoral/reports/summary'));
export const getPastorWorkloadReport = async () => unwrap(await api.get('/pastoral/reports/workload'));
export const getWelfareReport = async () => unwrap(await api.get('/pastoral/reports/welfare'));
export const getDiscipleshipReport = async () => unwrap(await api.get('/pastoral/reports/discipleship'));

export const getPlatformPastoralOverview = async () => unwrap(await api.get('/admin/pastoral/overview'));
