import api from '../axios';

export const createTenant = async (data) => {
  const response = await api.post('/admin/tenants', data);
  return response.data?.data || response.data;
};

export const getAllTenants = async (params) => {
  const response = await api.get('/admin/tenants', { params });
  return response.data?.data || response.data;
};

export const getTenantById = async (tenantId) => {
  const response = await api.get(`/admin/tenants/${tenantId}`);
  return response.data?.data || response.data;
};

export const getCurrentTenant = async () => {
  const response = await api.get('/tenants/me');
  return response.data?.data || response.data;
};

export const updateCurrentTenant = async (data) => {
  const response = await api.patch('/tenants/me', data);
  return response.data?.data || response.data;
};

export const updateTenant = async (tenantId, data) => {
  const response = await api.patch(`/admin/tenants/${tenantId}`, data);
  return response.data?.data || response.data;
};

export const suspendTenant = async (tenantId, reason) => {
  const response = await api.patch(`/admin/tenants/${tenantId}/suspend`, { reason });
  return response.data?.data || response.data;
};

export const activateTenant = async (tenantId) => {
  const response = await api.patch(`/admin/tenants/${tenantId}/activate`);
  return response.data?.data || response.data;
};

export const deleteTenant = async (tenantId) => {
  const response = await api.delete(`/admin/tenants/${tenantId}`);
  return response.data?.data || response.data;
};

export const getPlatformAnalytics = async () => {
  const response = await api.get('/admin/tenants/analytics/overview');
  return response.data?.data || response.data;
};
