import AuditLog from '../modules/finance/models/auditLog.model.js';

export const logAudit = (
  tenantId,
  action,
  entityType,
  entityId,
  performedBy,
  changes,
  req,
  notes,
) => {
  setImmediate(async () => {
    try {
      await AuditLog.create({
        tenantId,
        action,
        entityType,
        entityId,
        performedBy,
        changes,
        ipAddress:
          req?.headers?.['x-forwarded-for'] ||
          req?.ip ||
          req?.socket?.remoteAddress ||
          undefined,
        notes,
      });
    } catch (error) {
      console.error('Failed to write finance audit log:', error.message);
    }
  });
};

export default logAudit;
