import mongoose from 'mongoose';

const { Schema } = mongoose;

const appointmentTypes = ['counseling', 'pastoral_visit', 'prayer', 'discipleship', 'group_session', 'other'];
const appointmentStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];

const appointmentSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true, trim: true, lowercase: true },
    appointmentId: { type: String, trim: true },
    caseId: { type: String, trim: true },
    memberId: { type: String, required: true, trim: true },
    memberName: { type: String, trim: true },
    memberPhone: { type: String, trim: true },
    type: { type: String, enum: appointmentTypes, default: 'other' },
    title: { type: String, trim: true },
    notes: { type: String, trim: true },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 60 },
    location: { type: String, trim: true },
    isOnline: { type: Boolean, default: false },
    meetingLink: { type: String, trim: true },
    assignedTo: { type: String, required: true, trim: true },
    assignedToName: { type: String, trim: true },
    status: { type: String, enum: appointmentStatuses, default: 'scheduled' },
    reminderSent: { type: Boolean, default: false },
    completionNotes: { type: String, trim: true },
    createdBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

appointmentSchema.index({ tenantId: 1, appointmentId: 1 }, { unique: true });
appointmentSchema.index({ tenantId: 1, scheduledAt: 1 });
appointmentSchema.index({ tenantId: 1, assignedTo: 1 });
appointmentSchema.index({ tenantId: 1, memberId: 1 });
appointmentSchema.index({ tenantId: 1, status: 1 });

appointmentSchema.statics.generateNextAppointmentId = async function generateNextAppointmentId(tenantId) {
  const normalizedTenantId = String(tenantId || '').trim().toLowerCase();
  const latestAppointment = await this.findOne({ tenantId: normalizedTenantId })
    .sort({ createdAt: -1, _id: -1 })
    .select('appointmentId');

  const currentSequence = latestAppointment?.appointmentId
    ? Number(String(latestAppointment.appointmentId).split('-').pop()) || 0
    : 0;

  return `APT-${normalizedTenantId.slice(0, 3).toUpperCase()}-${String(currentSequence + 1).padStart(4, '0')}`;
};

appointmentSchema.pre('save', async function appointmentPreSave() {
  if (!this.appointmentId) {
    this.appointmentId = await this.constructor.generateNextAppointmentId(this.tenantId);
  }

  this.updatedAt = new Date();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export { appointmentStatuses, appointmentTypes };
export default Appointment;
