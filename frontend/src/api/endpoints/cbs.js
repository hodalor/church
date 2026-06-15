import api from '../axios';

const unwrap = (response) => response.data?.data || response.data;

const fullName = (prospect) =>
  [prospect?.firstName, prospect?.lastName].filter(Boolean).join(' ').trim();

export const createGroup = async (data) => unwrap(await api.post('/cbs/groups', data));

export const getAllGroups = async (params) =>
  unwrap(await api.get('/cbs/groups', { params }));

export const getCBSStats = async () => unwrap(await api.get('/cbs/groups/stats'));

export const getGroupById = async (id) => unwrap(await api.get(`/cbs/groups/${id}`));

export const updateGroup = async (id, data) =>
  unwrap(await api.patch(`/cbs/groups/${id}`, data));

export const getMyGroup = async () => {
  const data = await getAllGroups({ limit: 1 });
  return data?.groups?.[0] || data?.items?.[0] || null;
};

export const addProspect = async (groupId, data) =>
  unwrap(await api.post(`/cbs/groups/${groupId}/prospects`, data));

export const getGroupProspects = async (groupId, params) =>
  unwrap(await api.get(`/cbs/groups/${groupId}/prospects`, { params }));

export const getAllProspects = async () => {
  const groupsData = await getAllGroups({ limit: 200 });
  const groups = groupsData?.groups || groupsData?.items || [];
  const prospectLists = await Promise.all(
    groups.map((group) => getGroupProspects(group.groupId, { limit: 200 })),
  );

  return {
    prospects: prospectLists.flatMap((item) => item?.prospects || item?.items || []),
  };
};

export const getProspectsPipeline = async () => {
  const data = await getAllProspects();
  return (data.prospects || []).reduce((accumulator, prospect) => {
    accumulator[prospect.studyStage] = (accumulator[prospect.studyStage] || 0) + 1;
    return accumulator;
  }, {});
};

export const getProspectById = async (id) => {
  const data = await getAllProspects();
  return (data.prospects || []).find((prospect) => prospect.prospectId === id) || null;
};

export const updateProspect = async (id, data) => {
  const prospect = await getProspectById(id);
  if (!prospect?.groupId) {
    throw new Error('Prospect group could not be resolved.');
  }

  return unwrap(await api.patch(`/cbs/groups/${prospect.groupId}/prospects/${id}`, data));
};

export const updateStudyStage = async (id, stage) =>
  updateProspect(id, { studyStage: stage });

export const convertToMember = async (id, data) => {
  const prospect = await getProspectById(id);
  if (!prospect?.groupId) {
    throw new Error('Prospect group could not be resolved.');
  }

  return unwrap(await api.post(`/cbs/groups/${prospect.groupId}/prospects/${id}/convert`, data));
};

export const recordSession = async (groupId, data) =>
  unwrap(await api.post(`/cbs/groups/${groupId}/sessions`, data));

export const getGroupSessions = async (groupId, params) =>
  unwrap(await api.get(`/cbs/groups/${groupId}/sessions`, { params }));

export const getSessionById = async (id, groupId) =>
  unwrap(await api.get(`/cbs/groups/${groupId}/sessions/${id}`));

export const updateSession = async (id, data, groupId) =>
  unwrap(await api.patch(`/cbs/groups/${groupId}/sessions/${id}`, data));

export const getCBSOverviewReport = async () =>
  unwrap(await api.get('/cbs/reports/overview'));

export const getCBSPipelineReport = async () => {
  const stats = await getCBSStats();
  return stats?.studyPipeline || {};
};

export const getCBSConversionReport = async () => {
  const report = await getCBSOverviewReport();
  return (report || []).map((group) => ({
    groupId: group.groupId,
    name: group.name,
    zone: group.zone,
    convertedCount: group.convertedCount || 0,
    prospectCount: group.prospectCount || 0,
    conversionRate: group.prospectCount
      ? ((group.convertedCount || 0) / group.prospectCount) * 100
      : 0,
  }));
};

export const getGroupReport = async (id) => unwrap(await api.get(`/cbs/reports/${id}`));

export const getLeaderReport = async (leaderId) => {
  const groupsData = await getAllGroups({ limit: 200 });
  const groups = (groupsData?.groups || groupsData?.items || []).filter(
    (group) => group.leaderId === leaderId,
  );
  return Promise.all(groups.map((group) => getGroupReport(group.groupId)));
};

export const getRecentBaptisms = async () => {
  const data = await getAllProspects();
  return (data.prospects || [])
    .filter((prospect) => prospect.studyStage === 'baptised' || prospect.baptismDate)
    .map((prospect) => ({
      ...prospect,
      fullName: fullName(prospect),
    }))
    .sort(
      (left, right) =>
        new Date(right.baptismDate || right.updatedAt || 0) -
        new Date(left.baptismDate || left.updatedAt || 0),
    )
    .slice(0, 5);
};
