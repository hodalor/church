import SystemAuditLog from './models/systemAuditLog.model.js';
import {
  buildPagination,
  escapeRegex,
  normalizeString,
  parseBoolean,
  parseDate,
} from '../../utils/phase11Helpers.js';

const buildFilters = (tenantId, query = {}) => {
  const filters = { tenantId };

  if (query.module) {
    filters.module = normalizeString(query.module);
  }

  if (query.action) {
    filters.action = normalizeString(query.action, { uppercase: true });
  }

  if (query.userId) {
    filters.userId = normalizeString(query.userId);
  }

  if (query.entityType) {
    filters.entityType = normalizeString(query.entityType);
  }

  const isSuspicious = parseBoolean(query.isSuspicious);
  if (typeof isSuspicious === 'boolean') {
    filters.isSuspicious = isSuspicious;
  }

  const fromDate = parseDate(query.dateFrom || query.from);
  const toDate = parseDate(query.dateTo || query.to);

  if (fromDate || toDate) {
    filters.createdAt = {
      ...(fromDate ? { $gte: fromDate } : {}),
      ...(toDate ? { $lte: toDate } : {}),
    };
  }

  const search = normalizeString(query.search);
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filters.$or = [
      { userName: regex },
      { entityName: regex },
      { entityId: regex },
      { description: regex },
    ];
  }

  return filters;
};

const buildSummary = async (filters) => {
  const [byModule, byAction, suspiciousCount] = await Promise.all([
    SystemAuditLog.aggregate([
      { $match: filters },
      { $group: { _id: '$module', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    SystemAuditLog.aggregate([
      { $match: filters },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    SystemAuditLog.countDocuments({ ...filters, isSuspicious: true }),
  ]);

  return {
    byModule: byModule.map((item) => ({ module: item._id, count: item.count })),
    byAction: byAction.map((item) => ({ action: item._id, count: item.count })),
    suspiciousCount,
  };
};

export const getAuditLogs = async (tenantId, query = {}) => {
  const filters = buildFilters(tenantId, query);
  const { page, limit, skip } = buildPagination(query, { defaultLimit: 25, maxLimit: 100 });

  const [logs, total, summary] = await Promise.all([
    SystemAuditLog.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    SystemAuditLog.countDocuments(filters),
    buildSummary(filters),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    summary,
  };
};

export const getSuspiciousActivity = async (tenantId) => {
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const grouped = await SystemAuditLog.aggregate([
    { $match: { tenantId, isSuspicious: true, createdAt: { $gte: last30Days } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$userId',
        user: {
          $first: {
            userId: '$userId',
            userName: '$userName',
            userRole: '$userRole',
          },
        },
        events: {
          $push: {
            action: '$action',
            module: '$module',
            entityType: '$entityType',
            entityId: '$entityId',
            entityName: '$entityName',
            description: '$description',
            ipAddress: '$ipAddress',
            createdAt: '$createdAt',
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1, _id: 1 } },
  ]);

  return grouped.map((item) => ({
    user: item.user,
    events: item.events,
    count: item.count,
  }));
};

export const getUserAuditTrail = async (tenantId, userId, query = {}) =>
  getAuditLogs(tenantId, { ...query, userId });

export const getModuleAuditTrail = async (tenantId, module, query = {}) =>
  getAuditLogs(tenantId, { ...query, module });

export const getEntityAuditTrail = async (tenantId, entityType, entityId, query = {}) => {
  const filters = {
    ...buildFilters(tenantId, query),
    entityType,
    entityId,
  };
  const { page, limit, skip } = buildPagination(query, { defaultLimit: 25, maxLimit: 100 });

  const [logs, total] = await Promise.all([
    SystemAuditLog.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    SystemAuditLog.countDocuments(filters),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getLoginHistory = async (tenantId, query = {}) => {
  const filters = buildFilters(tenantId, query);
  filters.action = { $in: ['LOGIN', 'LOGIN_FAILED', 'LOGOUT'] };

  const { page, limit, skip } = buildPagination(query, { defaultLimit: 25, maxLimit: 100 });

  const [logs, total] = await Promise.all([
    SystemAuditLog.find(filters)
      .select('userId userName ipAddress userAgent createdAt action statusCode requestPath')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SystemAuditLog.countDocuments(filters),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getExportHistory = async (tenantId, query = {}) =>
  getAuditLogs(tenantId, { ...query, action: 'EXPORT' });

export const getAllTenantsAuditSummary = async (query = {}) => {
  const dateFrom = parseDate(query.dateFrom || query.from) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateTo = parseDate(query.dateTo || query.to);

  const summary = await SystemAuditLog.aggregate([
    {
      $match: {
        createdAt: {
          $gte: dateFrom,
          ...(dateTo ? { $lte: dateTo } : {}),
        },
      },
    },
    {
      $group: {
        _id: '$tenantId',
        total: { $sum: 1 },
        suspiciousCount: {
          $sum: {
            $cond: [{ $eq: ['$isSuspicious', true] }, 1, 0],
          },
        },
        lastEventAt: { $max: '$createdAt' },
      },
    },
    { $sort: { total: -1, _id: 1 } },
  ]);

  return summary.map((item) => ({
    tenantId: item._id,
    total: item.total,
    suspiciousCount: item.suspiciousCount,
    lastEventAt: item.lastEventAt,
  }));
};
