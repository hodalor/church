import api from '../axios';

const unwrap = (response) => response.data?.data || response.data;

export const getPlatformOverview = async (params = {}) =>
  unwrap(await api.get('/admin/platform/overview', { params }));
export const getPlatformGrowthTrends = async (params = {}) =>
  unwrap(await api.get('/admin/platform/growth', { params }));
export const getPlatformHealthScores = async (params = {}) =>
  unwrap(await api.get('/admin/platform/health', { params }));
export const getPlatformRevenue = async (params = {}) =>
  unwrap(await api.get('/admin/platform/revenue', { params }));
export const getTenantComparison = async (params = {}) =>
  unwrap(await api.get('/admin/platform/comparison', { params }));
