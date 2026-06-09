import mongoose from 'mongoose';

const { Schema } = mongoose;

export const volunteerStatuses = ['active', 'inactive', 'on_leave', 'suspended'];

const availabilitySchema = new Schema(
  {
    sunday: { type: Boolean, default: true },
    monday: { type: Boolean, default: false },
    tuesday: { type: Boolean, default: false },
    wednesday: { type: Boolean, default: false },
    thursday: { type: Boolean, default: false },
    friday: { type: Boolean, default: false },
    saturday: { type: Boolean, default: false },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

const performanceSchema = new Schema(
  {
    totalAssignments: { type: Number, default: 0 },
    attended: { type: Number, default: 0 },
    absent: { type: Number, default: 0 },
    reliabilityScore: { type: Number, default: 100 },
    lastServedDate: Date,
    badges: { type: [String], default: () => [] },
  },
  { _id: false },
);

const trainingSchema = new Schema(
  {
    title: { type: String, trim: true },
    completedAt: Date,
    certUrl: { type: String, trim: true },
    conductedBy: { type: String, trim: true },
  },
  { _id: false },
);

const volunteerSchema = new Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    memberId: { type: String, required: true, trim: true },
    memberName: { type: String, trim: true },
    memberPhoto: { type: String, trim: true },
    memberPhone: { type: String, trim: true },
    departments: { type: [String], default: () => [] },
    primaryDepartment: { type: String, trim: true },
    skills: { type: [String], default: () => [] },
    availability: { type: availabilitySchema, default: () => ({}) },
    status: { type: String, enum: volunteerStatuses, default: 'active' },
    performance: { type: performanceSchema, default: () => ({}) },
    trainings: { type: [trainingSchema], default: () => [] },
    notes: { type: String, trim: true },
    joinedAt: { type: Date, default: Date.now },
    supervisorId: { type: String, trim: true },
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    collection: 'volunteers',
  },
);

volunteerSchema.index({ tenantId: 1, memberId: 1 }, { unique: true });
volunteerSchema.index({ tenantId: 1, status: 1 });
volunteerSchema.index({ tenantId: 1, departments: 1 });

volunteerSchema.pre('save', function volunteerPreSave(next) {
  this.updatedAt = new Date();
  if (!this.primaryDepartment && Array.isArray(this.departments) && this.departments.length > 0) {
    this.primaryDepartment = this.departments[0];
  }
  next();
});

const Volunteer = mongoose.model('Volunteer', volunteerSchema);

export default Volunteer;
