import api from '../axios';

const unwrap = (response) => response.data?.data || response.data;

export const getVisitorAssignableLeaders = async () => {
  const response = await api.get('/visitors/assignable-leaders');
  return unwrap(response);
};

export const searchVisitors = async ({ search = '', phone = '', limit = 8 } = {}) => {
  const response = await api.get('/visitors/search', {
    params: {
      search,
      phone,
      limit,
    },
  });
  return unwrap(response);
};

export const checkVisitorDuplicateByPhone = async (phone) => {
  if (!String(phone || '').trim()) {
    return null;
  }

  const response = await api.get('/visitors/duplicate-check', {
    params: { phone },
  });
  return unwrap(response);
};

export const registerVisitor = async (payload) => {
  const response = await api.post('/visitors', payload);
  return unwrap(response);
};

export const getVisitors = async ({ page = 1, limit = 10, ...filters } = {}) => {
  const response = await api.get('/visitors', {
    params: {
      page,
      limit,
      ...filters,
    },
  });
  return unwrap(response);
};

export const getVisitorById = async (visitorId) => {
  const response = await api.get(`/visitors/${visitorId}`);
  return unwrap(response);
};

export const updateVisitorStage = async (visitorId, stage, note = '') => {
  const response = await api.patch(`/visitors/${visitorId}/stage`, {
    stage,
    note,
  });
  return unwrap(response);
};

export const assignVisitorsToCareLeader = async (visitorIds = [], leaderId) => {
  const response = await api.post('/visitors/assign', {
    visitorIds,
    leaderId,
  });
  return unwrap(response);
};

export const recordVisitorReturnVisit = async (visitorId, payload) => {
  const response = await api.post(`/visitors/${visitorId}/return-visit`, payload);
  return unwrap(response);
};

export const createVisitorFollowUp = async (visitorId, payload) => {
  const response = await api.post(`/visitors/${visitorId}/follow-ups`, payload);
  return unwrap(response);
};

export const completeVisitorFollowUp = async (visitorId, followUpId, payload) => {
  const response = await api.post(`/visitors/${visitorId}/follow-ups/${followUpId}/complete`, payload);
  return unwrap(response);
};

export const rescheduleVisitorFollowUp = async (visitorId, followUpId, payload) => {
  const response = await api.patch(`/visitors/${visitorId}/follow-ups/${followUpId}/reschedule`, payload);
  return unwrap(response);
};

export const convertVisitorToMember = async (visitorId, payload) => {
  const response = await api.post(`/visitors/${visitorId}/convert`, payload);
  return unwrap(response);
};

export const getVisitorPipeline = async (filters = {}) => {
  const response = await api.get('/visitors/pipeline', {
    params: filters,
  });
  return unwrap(response);
};

export const getVisitorFollowUps = async (filters = {}) => {
  const response = await api.get('/visitors/follow-ups', {
    params: filters,
  });
  return unwrap(response);
};

export const getVisitorWorkflow = async () => {
  const response = await api.get('/visitors/workflow');
  return unwrap(response);
};

export const saveVisitorWorkflow = async (steps) => {
  const response = await api.put('/visitors/workflow', steps);
  return unwrap(response);
};

export const testVisitorWorkflow = async (steps) => {
  const response = await api.post('/visitors/workflow/test', steps);
  return unwrap(response);
};

export const getVisitorReports = async () => {
  const response = await api.get('/visitors/reports');
  return unwrap(response);
};

export const getPlatformVisitorOverview = async (params) => {
  const response = await api.get('/admin/visitors/overview', { params });
  return unwrap(response);
};
