import api from '../axios';

const unwrap = (response) => response.data?.data || response.data;

export const getAllInsights = async (params = {}) => unwrap(await api.get('/insights', { params }));
export const getCriticalInsights = async (params = {}) =>
  unwrap(await api.get('/insights/critical', { params }));
export const markInsightRead = async (insightId) =>
  unwrap(await api.patch(`/insights/${insightId}/read`));
export const markInsightActioned = async (insightId) =>
  unwrap(await api.patch(`/insights/${insightId}/actioned`));
export const generateInsights = async () => unwrap(await api.post('/insights/generate'));
