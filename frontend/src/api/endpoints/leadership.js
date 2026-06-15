import api from '../axios';

const unwrap = (response) => response.data?.data || response.data;

export const createLeadershipProfile = async (data) =>
  unwrap(await api.post('/leadership/candidates', data));

export const getAllProfiles = async (params) =>
  unwrap(await api.get('/leadership/candidates', { params }));

export const getLeadershipStats = async () => unwrap(await api.get('/leadership/stats'));

export const getDevelopmentPipeline = async () => {
  const data = await getAllProfiles({ limit: 200 });
  const items = data?.candidates || data?.items || [];

  return items.reduce((accumulator, item) => {
    const key = item.successionStatus || 'identified';
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(item);
    return accumulator;
  }, {});
};

export const getProfileById = async (id) =>
  unwrap(await api.get(`/leadership/candidates/${id}`));

export const getProfileByMember = async (memberId) => {
  const data = await getAllProfiles({ limit: 200 });
  return (data?.candidates || data?.items || []).find((item) => item.memberId === memberId) || null;
};

export const updateProfile = async (id, data) =>
  unwrap(await api.patch(`/leadership/candidates/${id}`, data));

export const updateDevelopmentStatus = async (id, status) =>
  updateProfile(id, { successionStatus: status });

export const addAssessment = async (id, data) =>
  updateProfile(id, {
    notes: `${data?.type || 'Assessment'}\n${data?.notes || data?.confidentialNotes || ''}`.trim(),
  });

export const addMilestone = async (id, data) => {
  const profile = await getProfileById(id);
  const developmentPlan = [
    ...(profile?.developmentPlan || []),
    {
      title: data.title || data.type || 'Milestone',
      dueDate: data.date || data.dueDate,
      isCompleted: false,
    },
  ];
  return updateProfile(id, { developmentPlan });
};

export const addQualification = async (id, data) =>
  updateProfile(id, {
    notes: `${data?.title || 'Qualification'}\n${data?.institution || ''}`.trim(),
  });

export const createSuccessionPlan = async (data) =>
  unwrap(await api.post('/leadership/plans', data));

export const getAllSuccessionPlans = async (params) =>
  unwrap(await api.get('/leadership/plans', { params }));

export const getSuccessionPlanById = async (id) =>
  unwrap(await api.get(`/leadership/plans/${id}`));

export const updateSuccessionPlan = async (id, data) =>
  unwrap(await api.patch(`/leadership/plans/${id}`, data));

export const getSuccessionRiskReport = async () => {
  const data = await getAllSuccessionPlans({ limit: 200 });
  return (data?.plans || data?.items || []).map((plan) => ({
    ...plan,
    successorCount: plan.candidates?.length || 0,
    risk:
      (plan.candidates?.length || 0) === 0
        ? 'critical'
        : (plan.candidates?.length || 0) === 1
          ? 'high'
          : 'low',
  }));
};

export const getLeadershipReport = async () =>
  unwrap(await api.get('/leadership/reports/overview'));

export const getReadinessReport = async () => {
  const data = await getAllProfiles({ limit: 200 });
  return (data?.candidates || data?.items || []).map((item) => ({
    candidateId: item.candidateId,
    memberName: item.memberName,
    readinessScore: item.readinessScore || 0,
    currentRole: item.currentRole,
    targetRole: item.targetRole,
  }));
};
