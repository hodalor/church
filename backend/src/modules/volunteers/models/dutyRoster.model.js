import mongoose from 'mongoose';

const { Schema } = mongoose;

export const assignmentStatuses = ['assigned', 'confirmed', 'declined', 'attended', 'absent'];

const assignmentSchema = new Schema(
  {
    assignmentId: { type: String, trim: true },
    department: { type: String, trim: true },
    role: { type: String, trim: true },
    volunteerId: { type: String, trim: true },
    memberId: { type: String, trim: true },
    memberName: { type: String, trim: true },
    memberPhoto: { type: String, trim: true },
    status: { type: String, enum: assignmentStatuses, default: 'assigned' },
    confirmedAt: Date,
    declinedReason: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

const buildRosterId = async (tenantId, Model) => {
  const count = await Model.countDocuments({ tenantId });
  return `RST-${String(tenantId).toUpperCase()}-${String(count + 1).padStart(5, '0')}`;
};

const dutyRosterSchema = new Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    rosterId: { type: String, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    serviceId: { type: String, trim: true },
    eventId: { type: String, trim: true },
    date: { type: Date, required: true },
    branch: { type: String, trim: true },
    assignments: { type: [assignmentSchema], default: () => [] },
    isPublished: { type: Boolean, default: false },
    publishedAt: Date,
    createdBy: { type: String, required: true, trim: true },
    updatedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    collection: 'duty_rosters',
  },
);

dutyRosterSchema.index({ tenantId: 1, date: 1 });
dutyRosterSchema.index({ tenantId: 1, serviceId: 1 });
dutyRosterSchema.index({ tenantId: 1, eventId: 1 });

dutyRosterSchema.pre('save', async function dutyRosterPreSave(next) {
  this.updatedAt = new Date();
  if (!this.rosterId) {
    this.rosterId = await buildRosterId(this.tenantId, this.constructor);
  }
  next();
});

const DutyRoster = mongoose.model('DutyRoster', dutyRosterSchema);

export default DutyRoster;
