import { logAudit } from '../utils/auditLogger.js';

const methodToAction = {
  POST: 'CREATE',
  PATCH: 'UPDATE',
  PUT: 'UPDATE',
  DELETE: 'DELETE',
  GET: 'VIEW',
};

const defaultEntityParamKeys = [
  'id',
  'memberId',
  'pledgeId',
  'expenseId',
  'budgetId',
  'transactionId',
  'caseId',
  'eventId',
  'broadcastId',
  'volunteerId',
  'visitorId',
  'conversionId',
  'ministryId',
  'meetingId',
  'groupId',
  'prospectId',
  'sessionId',
  'trackId',
  'planId',
  'goalId',
  'kpiId',
  'initiativeId',
  'userId',
];

const cloneValue = (value) => {
  if (typeof value === 'undefined') {
    return undefined;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_error) {
    return undefined;
  }
};

const resolveEntityId = (req, responseBody, paramKeys = defaultEntityParamKeys) => {
  for (const key of paramKeys) {
    if (req.params?.[key]) {
      return req.params[key];
    }
  }

  const data = responseBody?.data;
  if (typeof data === 'string' || typeof data === 'number') {
    return String(data);
  }

  if (data && typeof data === 'object') {
    const keys = [
      '_id',
      'id',
      'memberId',
      'transactionId',
      'expenseId',
      'pledgeId',
      'budgetId',
      'ministryId',
      'meetingId',
      'groupId',
      'prospectId',
      'sessionId',
      'planId',
      'goalId',
      'kpiId',
      'initiativeId',
    ];

    for (const key of keys) {
      if (data[key]) {
        return String(data[key]);
      }
    }
  }

  return undefined;
};

const resolveEntityName = (responseBody, req) => {
  const auditContext = req.auditTrail || {};
  if (auditContext.entityName) {
    return auditContext.entityName;
  }

  const data = responseBody?.data;
  if (data && typeof data === 'object') {
    return data.name || data.title || data.memberName || data.fullName || data.description;
  }

  return undefined;
};

const buildDefaultDescription = ({ action, module, entityType }) => {
  const actionVerb = {
    CREATE: 'Created',
    UPDATE: 'Updated',
    DELETE: 'Deleted',
    VIEW: 'Viewed',
  };

  return `${actionVerb[action] || action} ${entityType || module}`;
};

export const setAuditTrailContext = (req, context = {}) => {
  req.auditTrail = {
    ...(req.auditTrail || {}),
    ...context,
  };
};

const auditMiddleware = (module, entityType, options = {}) => (req, res, next) => {
  const action = options.action || methodToAction[req.method];
  if (!action) {
    return next();
  }

  if (action === 'VIEW' && options.logView !== true) {
    return next();
  }

  const requestSnapshot = cloneValue(req.body);
  let responseBody;

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    responseBody = body;
    return originalJson(body);
  };

  res.on('finish', () => {
    if (res.statusCode >= 400 || !req.user) {
      return;
    }

    const auditContext = req.auditTrail || {};
    const entityId = auditContext.entityId || resolveEntityId(req, responseBody, options.paramKeys);
    const changes = {
      before:
        auditContext.before ||
        (action === 'UPDATE' || action === 'DELETE' ? requestSnapshot : undefined),
      after:
        auditContext.after ||
        (action === 'CREATE' || action === 'UPDATE'
          ? cloneValue(responseBody?.data || req.body)
          : undefined),
      ...(typeof auditContext.count === 'number' ? { count: auditContext.count } : {}),
    };

    logAudit({
      tenantId:
        req.user.role === 'super_admin'
          ? String(
              req.query?.tenantId ||
                req.body?.tenantId ||
                req.headers['x-tenant-id'] ||
                req.user.tenantId ||
                '',
            )
              .trim()
              .toLowerCase()
          : req.tenantId || req.user.tenantId,
      userId: req.user.userId,
      userName: req.user.fullName || req.user.username,
      userRole: req.user.role,
      action,
      module,
      entityType,
      entityId,
      entityName: resolveEntityName(responseBody, req),
      description:
        auditContext.description ||
        options.description ||
        buildDefaultDescription({ action, module, entityType }),
      changes,
      req,
      statusCode: res.statusCode,
    });
  });

  return next();
};

export default auditMiddleware;
