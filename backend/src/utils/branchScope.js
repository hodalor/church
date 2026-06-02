import { createHttpError } from './httpError.js';

export const normalizeBranchList = (value) => {
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  return [...new Set(items.map((item) => String(item || '').trim()).filter(Boolean))];
};

export const getAssignedBranches = (user = {}) => {
  if (!user || user.role === 'super_admin' || user.allBranches === true) {
    return [];
  }

  return normalizeBranchList(user.assignedBranches);
};

export const hasBranchRestriction = (user = {}) => getAssignedBranches(user).length > 0;

export const scopeBranchQuery = (query = {}, user = {}) => {
  const allowedBranches = getAssignedBranches(user);
  if (!allowedBranches.length) {
    return query;
  }

  const requestedBranches = normalizeBranchList(query.branches || query.branch);
  const scopedBranches = requestedBranches.length
    ? requestedBranches.filter((branch) => allowedBranches.includes(branch))
    : allowedBranches;

  return {
    ...query,
    branches: scopedBranches,
  };
};

export const ensureBranchAccess = (user = {}, branch, message = 'You do not have access to this branch.') => {
  const allowedBranches = getAssignedBranches(user);
  const normalizedBranch = String(branch || '').trim();

  if (!allowedBranches.length || !normalizedBranch) {
    return;
  }

  if (!allowedBranches.includes(normalizedBranch)) {
    throw createHttpError(403, message);
  }
};

export const ensureDocumentBranchAccess = (user = {}, documentBranch, message) =>
  ensureBranchAccess(user, documentBranch, message);
