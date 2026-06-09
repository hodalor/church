import api from '../axios';

const unwrap = (response) => response.data?.data || response.data;

export const createBranch = async (data) => unwrap(await api.post('/branches', data));
export const getAllBranches = async (params = {}) => unwrap(await api.get('/branches', { params }));
export const getBranchById = async (branchId, params = {}) =>
  unwrap(await api.get(`/branches/${branchId}`, { params }));
export const updateBranch = async (branchId, data) =>
  unwrap(await api.patch(`/branches/${branchId}`, data));
export const deactivateBranch = async (branchId) =>
  unwrap(await api.delete(`/branches/${branchId}`));
export const getBranchMetrics = async (branchId, params = {}) =>
  unwrap(await api.get(`/branches/${branchId}/metrics`, { params }));
export const getBranchSnapshot = async (branchId, params = {}) =>
  unwrap(await api.get(`/branches/${branchId}/snapshot`, { params }));
export const refreshBranchCache = async (branchId) =>
  unwrap(await api.post(`/branches/${branchId}/refresh-cache`));
