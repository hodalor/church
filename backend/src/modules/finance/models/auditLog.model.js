import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    tenantId: { type: String, trim: true, lowercase: true, index: true },
    action: { type: String, trim: true, required: true },
    entityType: { type: String, trim: true, required: true },
    entityId: { type: String, trim: true, required: true },
    performedBy: { type: String, trim: true },
    performedAt: { type: Date, default: Date.now },
    changes: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  {
    versionKey: false,
  },
);

auditLogSchema.index({ tenantId: 1, performedAt: -1 });
auditLogSchema.index({ tenantId: 1, entityType: 1, entityId: 1 });
auditLogSchema.index({ tenantId: 1, action: 1 });

const AuditLog = mongoose.model('FinanceAuditLog', auditLogSchema);

export default AuditLog;
