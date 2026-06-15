import api from '../axios';

const unwrap = (response) => response.data?.data || response.data;

export const getAuditLogs = async (params) =>
  unwrap(await api.get('/audit', { params }));

export const getSuspiciousActivity = async () =>
  unwrap(await api.get('/audit/suspicious'));

export const getUserAuditTrail = async (userId, params) =>
  unwrap(await api.get(`/audit/user/${userId}`, { params }));

export const getModuleAuditTrail = async (module, params) =>
  unwrap(await api.get(`/audit/module/${module}`, { params }));

export const getEntityAuditTrail = async (entityType, entityId, params) =>
  unwrap(await api.get(`/audit/entity/${entityType}/${entityId}`, { params }));

export const getLoginHistory = async (params) =>
  unwrap(await api.get('/audit/logins', { params }));

export const getExportHistory = async (params) =>
  unwrap(await api.get('/audit/exports', { params }));
