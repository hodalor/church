import api from '../axios';

const unwrap = (response) => response.data?.data || response.data;

export const getHQOverview = async (params = {}) => unwrap(await api.get('/hq/overview', { params }));
export const getBranchComparison = async (params = {}) =>
  unwrap(await api.get('/hq/branch-comparison', { params }));
export const getGrowthTrends = async (params = {}) =>
  unwrap(await api.get('/hq/growth-trends', { params }));
export const getFinancialIntelligence = async (params = {}) =>
  unwrap(await api.get('/hq/financial-intelligence', { params }));
export const getMemberIntelligence = async (params = {}) =>
  unwrap(await api.get('/hq/member-intelligence', { params }));
export const getOperationalHealth = async (params = {}) =>
  unwrap(await api.get('/hq/operational-health', { params }));
export const getConsolidatedReport = async (params = {}) =>
  unwrap(await api.get('/hq/consolidated-report', { params }));
