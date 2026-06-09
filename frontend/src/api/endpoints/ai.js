import api from '../axios';

const unwrap = (response) => response.data?.data || response.data;

export const generateSermonDraft = async (data) => unwrap(await api.post('/ai/sermon-draft', data));
export const generateAnnouncement = async (data) => unwrap(await api.post('/ai/announcement', data));
export const generateMeetingSummary = async (data) => unwrap(await api.post('/ai/meeting-summary', data));
export const generateMemberNarrative = async (data) => unwrap(await api.post('/ai/member-narrative', data));
export const generateGrowthAnalysis = async (data) => unwrap(await api.post('/ai/growth-analysis', data));
export const generatePrayerPoints = async (data) => unwrap(await api.post('/ai/prayer-points', data));
export const generateDevotional = async (data) => unwrap(await api.post('/ai/devotional', data));
export const getAIHistory = async (params = {}) => unwrap(await api.get('/ai/history', { params }));
