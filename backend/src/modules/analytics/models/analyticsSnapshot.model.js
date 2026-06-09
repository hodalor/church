import mongoose from 'mongoose';

const { Schema } = mongoose;

const numberMetricSchema = new Schema(
  {
    total: { type: Number, default: 0 },
    active: { type: Number, default: 0 },
    inactive: { type: Number, default: 0 },
    new: { type: Number, default: 0 },
    atRisk: { type: Number, default: 0 },
    drifting: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
  },
  { _id: false },
);

const attendanceMetricSchema = new Schema(
  {
    totalServices: { type: Number, default: 0 },
    totalHeadcount: { type: Number, default: 0 },
    avgPerService: { type: Number, default: 0 },
    memberAttendance: { type: Number, default: 0 },
    visitorAttendance: { type: Number, default: 0 },
    firstTimers: { type: Number, default: 0 },
    onlineAttendance: { type: Number, default: 0 },
  },
  { _id: false },
);

const financeMetricSchema = new Schema(
  {
    totalIncome: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    netBalance: { type: Number, default: 0 },
    tithes: { type: Number, default: 0 },
    offerings: { type: Number, default: 0 },
    pledges: { type: Number, default: 0 },
    donations: { type: Number, default: 0 },
  },
  { _id: false },
);

const visitorsMetricSchema = new Schema(
  {
    total: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    pendingFollowUps: { type: Number, default: 0 },
  },
  { _id: false },
);

const communicationMetricSchema = new Schema(
  {
    broadcastsSent: { type: Number, default: 0 },
    messagesDelivered: { type: Number, default: 0 },
    deliveryRate: { type: Number, default: 0 },
    openPrayerRequests: { type: Number, default: 0 },
  },
  { _id: false },
);

const volunteersMetricSchema = new Schema(
  {
    total: { type: Number, default: 0 },
    active: { type: Number, default: 0 },
    avgReliability: { type: Number, default: 0 },
    rostersPublished: { type: Number, default: 0 },
  },
  { _id: false },
);

const eventsMetricSchema = new Schema(
  {
    total: { type: Number, default: 0 },
    registrations: { type: Number, default: 0 },
    avgAttendanceRate: { type: Number, default: 0 },
  },
  { _id: false },
);

const pastoralMetricSchema = new Schema(
  {
    openCases: { type: Number, default: 0 },
    resolvedCases: { type: Number, default: 0 },
    criticalCases: { type: Number, default: 0 },
    activeDiscipships: { type: Number, default: 0 },
  },
  { _id: false },
);

const analyticsSnapshotSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true, trim: true, lowercase: true },
    branchId: { type: String, trim: true, default: null },
    snapshotDate: { type: Date, required: true },
    period: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
    members: { type: numberMetricSchema, default: () => ({}) },
    attendance: { type: attendanceMetricSchema, default: () => ({}) },
    finance: { type: financeMetricSchema, default: () => ({}) },
    visitors: { type: visitorsMetricSchema, default: () => ({}) },
    communication: { type: communicationMetricSchema, default: () => ({}) },
    volunteers: { type: volunteersMetricSchema, default: () => ({}) },
    events: { type: eventsMetricSchema, default: () => ({}) },
    pastoral: { type: pastoralMetricSchema, default: () => ({}) },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    collection: 'analytics_snapshots',
  },
);

analyticsSnapshotSchema.index(
  { tenantId: 1, snapshotDate: 1, period: 1, branchId: 1 },
  { unique: true },
);

const AnalyticsSnapshot = mongoose.model('AnalyticsSnapshot', analyticsSnapshotSchema);

export default AnalyticsSnapshot;
