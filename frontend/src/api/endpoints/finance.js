import api from '../axios';

export const recordTransaction = async (data) => {
  const response = await api.post('/finance/transactions', data);
  return response.data?.data || response.data;
};

export const getAllTransactions = async (params) => {
  const response = await api.get('/finance/transactions', { params });
  return response.data?.data || response.data;
};

export const getTransactionSummary = async (params) => {
  const response = await api.get('/finance/transactions/summary', { params });
  return response.data?.data || response.data;
};

export const getMemberGivingHistory = async (memberId, params) => {
  const response = await api.get(`/finance/transactions/by-member/${memberId}`, { params });
  return response.data?.data || response.data;
};

export const getTransactionById = async (id) => {
  const response = await api.get(`/finance/transactions/${id}`);
  return response.data?.data || response.data;
};

export const verifyTransaction = async (id) => {
  const response = await api.patch(`/finance/transactions/${id}/verify`);
  return response.data?.data || response.data;
};

export const reverseTransaction = async (id, reason) => {
  const response = await api.patch(`/finance/transactions/${id}/reverse`, { reason });
  return response.data?.data || response.data;
};

export const getReceipt = (id) => `${api.defaults.baseURL}/finance/transactions/${id}/receipt`;

export const createPledge = async (data) => {
  const response = await api.post('/finance/pledges', data);
  return response.data?.data || response.data;
};

export const getAllPledges = async (params) => {
  const response = await api.get('/finance/pledges', { params });
  return response.data?.data || response.data;
};

export const getPledgeById = async (pledgeId) => {
  const response = await api.get(`/finance/pledges/${pledgeId}`);
  return response.data?.data || response.data;
};

export const recordPledgePayment = async (pledgeId, data) => {
  const response = await api.post(`/finance/pledges/${pledgeId}/payment`, data);
  return response.data?.data || response.data;
};

export const updatePledge = async (pledgeId, data) => {
  const response = await api.patch(`/finance/pledges/${pledgeId}`, data);
  return response.data?.data || response.data;
};

export const recordExpense = async (data) => {
  const response = await api.post('/finance/expenses', data);
  return response.data?.data || response.data;
};

export const getAllExpenses = async (params) => {
  const response = await api.get('/finance/expenses', { params });
  return response.data?.data || response.data;
};

export const getExpenseById = async (expenseId) => {
  const response = await api.get(`/finance/expenses/${expenseId}`);
  return response.data?.data || response.data;
};

export const updateExpense = async (expenseId, data) => {
  const response = await api.patch(`/finance/expenses/${expenseId}`, data);
  return response.data?.data || response.data;
};

export const approveExpense = async (expenseId) => {
  const response = await api.patch(`/finance/expenses/${expenseId}/approve`);
  return response.data?.data || response.data;
};

export const rejectExpense = async (expenseId, reason) => {
  const response = await api.patch(`/finance/expenses/${expenseId}/reject`, { reason });
  return response.data?.data || response.data;
};

export const createBudget = async (data) => {
  const response = await api.post('/finance/budgets', data);
  return response.data?.data || response.data;
};

export const getAllBudgets = async (params) => {
  const response = await api.get('/finance/budgets', { params });
  return response.data?.data || response.data;
};

export const getBudgetById = async (budgetId) => {
  const response = await api.get(`/finance/budgets/${budgetId}`);
  return response.data?.data || response.data;
};

export const updateBudget = async (budgetId, data) => {
  const response = await api.patch(`/finance/budgets/${budgetId}`, data);
  return response.data?.data || response.data;
};

export const activateBudget = async (budgetId) => {
  const response = await api.patch(`/finance/budgets/${budgetId}/activate`);
  return response.data?.data || response.data;
};

export const getFinancialSummary = async (year) => {
  const response = await api.get('/finance/reports/summary', { params: { year } });
  return response.data?.data || response.data;
};

export const getMonthlyReport = async (params) => {
  const response = await api.get('/finance/reports/monthly', { params });
  return response.data?.data || response.data;
};

export const getAnnualReport = async (params) => {
  const response = await api.get('/finance/reports/annual', { params });
  return response.data?.data || response.data;
};

export const getGivingTrends = async (params) => {
  const response = await api.get('/finance/reports/giving-trends', { params });
  return response.data?.data || response.data;
};

export const getTopGivers = async (params) => {
  const response = await api.get('/finance/reports/top-givers', { params });
  return response.data?.data || response.data;
};

export const getMemberAnnualStatement = async (memberId, year) => {
  const response = await api.get(`/finance/reports/member-statement/${memberId}`, {
    params: { year },
  });
  return response.data?.data || response.data;
};

export const getSmartGivingIntelligence = async () => {
  const response = await api.get('/finance/reports/smart-intelligence');
  return response.data?.data || response.data;
};

export const setGivingGoal = async (data) => {
  const response = await api.post('/finance/goals', data);
  return response.data?.data || response.data;
};

export const getGivingGoals = async (params) => {
  const response = await api.get('/finance/goals', { params });
  return response.data?.data || response.data;
};

export const getAuditLog = async (params) => {
  const response = await api.get('/finance/audit-log', { params });
  return response.data?.data || response.data;
};
