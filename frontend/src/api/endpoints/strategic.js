import api from '../axios';

const unwrap = (response) => response.data?.data || response.data;

export const createStrategicPlan = async (data) =>
  unwrap(await api.post('/strategic/plans', data));

export const getStrategicPlan = async () => {
  const data = unwrap(await api.get('/strategic/plans'));
  return data?.plans?.find((item) => item.status === 'active') || data?.plans?.[0] || null;
};

export const updateStrategicPlan = async (planId, data) =>
  unwrap(await api.patch(`/strategic/plans/${planId}`, data));

export const activatePlan = async (planId) =>
  updateStrategicPlan(planId, { status: 'active' });

export const createKPI = async (data) => unwrap(await api.post('/strategic/kpis', data));

export const getAllKPIs = async (params) =>
  unwrap(await api.get('/strategic/kpis', { params }));

export const getBalancedScorecard = async () =>
  unwrap(await api.get('/strategic/scorecard'));

export const getStrategicDashboard = async () =>
  unwrap(await api.get('/strategic/reports/overview'));

export const getKPIById = async (id) => {
  const data = await getAllKPIs({ limit: 200 });
  return (data?.kpis || data?.items || []).find((item) => item.kpiId === id) || null;
};

export const updateKPI = async (id, data) =>
  unwrap(await api.patch(`/strategic/kpis/${id}`, data));

export const deactivateKPI = async (id) => updateKPI(id, { status: 'off_track' });

export const recordKPIValue = async (id, data) => {
  const current = await getKPIById(id);
  const measurements = [
    ...(current?.measurements || []),
    {
      period: data.period,
      value: Number(data.value || 0),
      notes: data.notes || '',
    },
  ];

  const targetValue = Number(current?.targetValue || 0);
  const value = Number(data.value || 0);
  const status =
    targetValue > 0
      ? value >= targetValue
        ? 'on_track'
        : value >= targetValue * 0.75
          ? 'at_risk'
          : 'off_track'
      : current?.status || 'on_track';

  return updateKPI(id, {
    currentValue: value,
    measurements,
    status,
  });
};

export const getKPIHistory = async (id) => (await getKPIById(id))?.measurements || [];

export const autoRefreshKPIs = async () => ({
  refreshedAt: new Date().toISOString(),
});

export const seedDefaultKPIs = async () => ({
  seeded: false,
});

export const getScorecardReport = async () => getBalancedScorecard();

export const getPillarReport = async () => getStrategicDashboard();

export const getQuarterlyReport = async () => getStrategicDashboard();

export const getAnnualReport = async () => getStrategicDashboard();
