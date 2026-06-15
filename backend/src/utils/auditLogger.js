import SystemAuditLog from '../modules/audit/models/systemAuditLog.model.js';
import NotificationLog from '../modules/notifications/notification.model.js';
import User from '../modules/users/model.js';

const SENSITIVE_FIELDS = new Set(['pinHash', 'password', 'twoFactorSecret', 'backupCodes', 'fcmToken']);

const resolveLegacyAction = (action) => {
  const legacyMap = {
    TRANSACTION_RECORDED: 'CREATE',
    TRANSACTION_VERIFIED: 'APPROVE',
    TRANSACTION_REVERSED: 'STATUS_CHANGE',
    PLEDGE_UPDATED: 'UPDATE',
    PLEDGE_PAYMENT_RECORDED: 'CREATE',
    EXPENSE_RECORDED: 'CREATE',
    EXPENSE_APPROVED: 'APPROVE',
    EXPENSE_REJECTED: 'REJECT',
  };

  return legacyMap[action] || action || 'UPDATE';
};

const resolveLegacyDescription = (action, entityType, notes) => {
  const actionLabel = String(action || '')
    .replaceAll('_', ' ')
    .toLowerCase();

  return notes || `${actionLabel.charAt(0).toUpperCase()}${actionLabel.slice(1)} ${entityType || 'record'}`.trim();
};

const redactSensitiveFields = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => redactSensitiveFields(entry));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      if (SENSITIVE_FIELDS.has(key)) {
        return [key, '[REDACTED]'];
      }

      return [key, redactSensitiveFields(entry)];
    }),
  );
};

const resolveIpAddress = (req) => {
  const forwardedFor = req?.headers?.['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req?.ip || req?.socket?.remoteAddress || undefined;
};

const normalizePayload = (...args) => {
  if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
    return args[0];
  }

  const [tenantId, action, entityType, entityId, performedBy, changes, req, notes] = args;

  return {
    tenantId,
    userId: performedBy,
    action: resolveLegacyAction(action),
    module: 'finance',
    entityType,
    entityId,
    description: resolveLegacyDescription(action, entityType, notes),
    changes,
    req,
  };
};

const shouldFlagSuspicious = async ({ tenantId, userId, action, module, changes, ipAddress }) => {
  let isSuspicious = false;

  if (action === 'LOGIN_FAILED') {
    const recentFailures = await SystemAuditLog.countDocuments({
      tenantId,
      userId,
      action: 'LOGIN_FAILED',
      createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
    });
    if (recentFailures >= 2) {
      isSuspicious = true;
    }
  }

  if (action === 'DELETE' && ['members', 'finance'].includes(module)) {
    isSuspicious = true;
  }

  if (action === 'BULK_ACTION' && Number(changes?.count || 0) > 50) {
    isSuspicious = true;
  }

  if (!isSuspicious && userId && ipAddress) {
    const recentKnownIp = await SystemAuditLog.findOne({
      tenantId,
      userId,
      ipAddress,
      action: { $ne: 'LOGIN_FAILED' },
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }).select('_id');

    if (!recentKnownIp) {
      const priorActivity = await SystemAuditLog.findOne({
        tenantId,
        userId,
        ipAddress: { $exists: true, $ne: ipAddress },
        action: { $ne: 'LOGIN_FAILED' },
      }).select('_id');

      if (priorActivity) {
        isSuspicious = true;
      }
    }
  }

  return isSuspicious;
};

const createSuspiciousNotifications = async ({ tenantId, userName, description }) => {
  const recipients = await User.find({
    tenantId,
    role: { $in: ['head_pastor', 'super_admin'] },
    isActive: true,
  }).select('_id');

  if (!recipients.length) {
    return;
  }

  await NotificationLog.insertMany(
    recipients.map((recipient) => ({
      tenantId,
      type: 'system',
      targetUserId: String(recipient._id),
      title: 'Suspicious activity detected',
      message: `⚠️ Suspicious activity detected: ${description} by ${userName || 'Unknown user'}`,
      createdAt: new Date(),
    })),
    { ordered: false },
  );
};

export const logAudit = (...args) => {
  const payload = normalizePayload(...args);

  setImmediate(async () => {
    try {
      if (!payload?.tenantId || !payload?.action || !payload?.module) {
        return;
      }

      const ipAddress = resolveIpAddress(payload.req);
      const redactedChanges = payload.changes
        ? {
            ...(typeof payload.changes.before !== 'undefined'
              ? { before: redactSensitiveFields(payload.changes.before) }
              : {}),
            ...(typeof payload.changes.after !== 'undefined'
              ? { after: redactSensitiveFields(payload.changes.after) }
              : {}),
            ...(typeof payload.changes.count !== 'undefined'
              ? { count: Number(payload.changes.count) || 0 }
              : {}),
          }
        : undefined;

      const isSuspicious = await shouldFlagSuspicious({
        tenantId: payload.tenantId,
        userId: payload.userId,
        action: payload.action,
        module: payload.module,
        changes: redactedChanges,
        ipAddress,
      });

      await SystemAuditLog.create({
        tenantId: payload.tenantId,
        userId: payload.userId,
        userName: payload.userName,
        userRole: payload.userRole,
        action: payload.action,
        module: payload.module,
        entityType: payload.entityType,
        entityId: payload.entityId,
        entityName: payload.entityName,
        description: payload.description,
        changes: redactedChanges,
        ipAddress,
        userAgent: payload.req?.headers?.['user-agent'],
        requestPath: payload.req?.originalUrl,
        requestMethod: payload.req?.method,
        statusCode: payload.statusCode,
        isSuspicious,
        createdAt: payload.createdAt || new Date(),
      });

      if (isSuspicious) {
        await createSuspiciousNotifications({
          tenantId: payload.tenantId,
          userName: payload.userName,
          description: payload.description,
        });
      }
    } catch (error) {
      console.error('Failed to write system audit log:', error.message);
    }
  });
};

export default logAudit;
