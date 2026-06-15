import mongoose from 'mongoose';

const { Schema } = mongoose;

const actionValues = [
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'CREATE',
  'UPDATE',
  'DELETE',
  'VIEW',
  'EXPORT',
  'PUBLISH',
  'APPROVE',
  'REJECT',
  'ASSIGN',
  'STATUS_CHANGE',
  'BULK_ACTION',
];

const moduleValues = [
  'auth',
  'members',
  'finance',
  'attendance',
  'communication',
  'visitors',
  'pastoral',
  'volunteers',
  'events',
  'analytics',
  'ministry',
  'cbs',
  'leadership',
  'strategic',
  'audit',
  'family',
  'exports',
];

const systemAuditLogSchema = new Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    userId: { type: String, trim: true },
    userName: { type: String, trim: true },
    userRole: { type: String, trim: true },
    action: { type: String, enum: actionValues, required: true },
    module: { type: String, enum: moduleValues, required: true },
    entityType: { type: String, trim: true },
    entityId: { type: String, trim: true },
    entityName: { type: String, trim: true },
    description: { type: String, trim: true },
    changes: {
      before: { type: Schema.Types.Mixed },
      after: { type: Schema.Types.Mixed },
      count: { type: Number },
    },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    requestPath: { type: String, trim: true },
    requestMethod: { type: String, trim: true },
    statusCode: { type: Number },
    isSuspicious: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

systemAuditLogSchema.index({ tenantId: 1, createdAt: -1 });
systemAuditLogSchema.index({ tenantId: 1, userId: 1 });
systemAuditLogSchema.index({ tenantId: 1, module: 1 });
systemAuditLogSchema.index({ tenantId: 1, action: 1 });
systemAuditLogSchema.index({ tenantId: 1, isSuspicious: 1 });
systemAuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

const SystemAuditLog = mongoose.model('SystemAuditLog', systemAuditLogSchema);

export { actionValues, moduleValues };
export default SystemAuditLog;
