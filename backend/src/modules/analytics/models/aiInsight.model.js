import mongoose from 'mongoose';

const { Schema } = mongoose;

const aiInsightSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true, trim: true, lowercase: true },
    branchId: { type: String, trim: true },
    type: {
      type: String,
      enum: [
        'member_risk',
        'finance_alert',
        'attendance_drop',
        'growth_opportunity',
        'volunteer_shortage',
        'visitor_pipeline',
        'pastoral_alert',
        'event_performance',
        'branch_comparison',
        'general_insight',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
    title: { type: String, trim: true },
    message: { type: String, trim: true },
    data: { type: Schema.Types.Mixed, default: () => ({}) },
    recommendations: { type: [String], default: () => [] },
    isRead: { type: Boolean, default: false },
    isActioned: { type: Boolean, default: false },
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    collection: 'ai_insights',
  },
);

aiInsightSchema.index({ tenantId: 1, isRead: 1 });
aiInsightSchema.index({ tenantId: 1, type: 1 });
aiInsightSchema.index({ tenantId: 1, severity: 1 });

const AiInsight = mongoose.model('AiInsight', aiInsightSchema);

export default AiInsight;
