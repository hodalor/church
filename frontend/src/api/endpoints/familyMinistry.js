import api from '../axios';

const unwrap = (response) => response.data?.data || response.data;

export const getFamilyMinistryDashboard = async () => {
  const [overview, segments, atRisk] = await Promise.all([
    unwrap(await api.get('/family-analytics/overview')),
    unwrap(await api.get('/family-analytics/segments')),
    unwrap(await api.get('/family-analytics/at-risk')),
  ]);

  return {
    overview,
    segments,
    atRisk,
  };
};
