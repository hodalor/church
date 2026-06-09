import mongoose from 'mongoose';

const { Schema } = mongoose;

const aiRequestSchema = new Schema(
  {
    tenantId: { type: String, trim: true, lowercase: true, index: true },
    requestedBy: { type: String, trim: true, index: true },
    feature: {
      type: String,
      enum: [
        'sermon_draft',
        'announcement_draft',
        'meeting_summary',
        'member_report_narrative',
        'growth_analysis_narrative',
        'prayer_points',
        'devotional',
      ],
      required: true,
    },
    prompt: { type: String, trim: true },
    response: { type: String, trim: true },
    tokensUsed: { type: Number, default: 0 },
    model: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    collection: 'ai_requests',
  },
);

aiRequestSchema.index({ tenantId: 1, createdAt: -1 });
aiRequestSchema.index({ requestedBy: 1, createdAt: -1 });

const AiRequest = mongoose.model('AiRequest', aiRequestSchema);

export default AiRequest;
