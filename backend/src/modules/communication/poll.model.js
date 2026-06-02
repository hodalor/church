import mongoose from 'mongoose';

const pollOptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    votes: { type: Number, default: 0, min: 0 },
    voterUserIds: { type: [String], default: [] },
  },
  { _id: false },
);

const audienceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['all_members', 'branch', 'department', 'cell_group', 'role', 'specific_members', 'first_timers'],
      default: 'all_members',
    },
    branch: { type: String, trim: true },
    departments: [{ type: String, trim: true }],
    cellGroup: { type: String, trim: true },
    role: { type: String, trim: true },
    memberIds: [{ type: String, trim: true }],
    estimatedReach: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const pollSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    question: { type: String, required: true, trim: true },
    options: {
      type: [pollOptionSchema],
      validate: {
        validator: (value) => Array.isArray(value) && value.length >= 2,
        message: 'At least two poll options are required.',
      },
    },
    audience: { type: audienceSchema, default: () => ({ type: 'all_members' }) },
    isAnonymous: { type: Boolean, default: false },
    expiresAt: { type: Date, index: true },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
      index: true,
    },
    totalVotes: { type: Number, default: 0, min: 0 },
    createdBy: {
      userId: { type: String, trim: true },
      name: { type: String, trim: true },
      role: { type: String, trim: true },
    },
    closedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

pollSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

pollSchema.pre('save', function pollPreSave(next) {
  this.updatedAt = new Date();
  next();
});

const Poll = mongoose.model('Poll', pollSchema);

export default Poll;
