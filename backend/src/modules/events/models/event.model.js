import mongoose from 'mongoose';

const { Schema } = mongoose;

export const eventTypes = [
  'conference',
  'concert',
  'outreach',
  'fundraiser',
  'workshop',
  'retreat',
  'crusade',
  'anniversary',
  'sports',
  'youth_event',
  'women_fellowship',
  'men_fellowship',
  'other',
];

export const eventStatuses = [
  'draft',
  'published',
  'registration_open',
  'registration_closed',
  'ongoing',
  'completed',
  'cancelled',
];

const ticketTierSchema = new Schema(
  {
    tierId: { type: String, trim: true },
    name: { type: String, trim: true },
    price: { type: Number, default: 0 },
    currency: { type: String, trim: true },
    quantity: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    description: { type: String, trim: true },
  },
  { _id: false },
);

const gpsCoordinatesSchema = new Schema(
  {
    lat: Number,
    lng: Number,
  },
  { _id: false },
);

const buildEventId = async (tenantId, Model) => {
  const count = await Model.countDocuments({ tenantId });
  return `EVT-${String(tenantId).toUpperCase()}-${String(count + 1).padStart(5, '0')}`;
};

const eventSchema = new Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    eventId: { type: String, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: { type: String, enum: eventTypes, default: 'other' },
    startDate: { type: Date, required: true },
    endDate: Date,
    startTime: { type: String, trim: true },
    endTime: { type: String, trim: true },
    isMultiDay: { type: Boolean, default: false },
    venue: { type: String, trim: true },
    address: { type: String, trim: true },
    isOnline: { type: Boolean, default: false },
    streamUrl: { type: String, trim: true },
    gpsCoordinates: gpsCoordinatesSchema,
    branch: { type: String, trim: true },
    bannerUrl: { type: String, trim: true },
    mediaUrls: { type: [String], default: () => [] },
    requiresRegistration: { type: Boolean, default: false },
    registrationDeadline: Date,
    maxAttendees: Number,
    registeredCount: { type: Number, default: 0 },
    isFree: { type: Boolean, default: true },
    ticketTiers: { type: [ticketTierSchema], default: () => [] },
    estimatedBudget: Number,
    actualCost: { type: Number, default: 0 },
    currency: { type: String, trim: true },
    status: { type: String, enum: eventStatuses, default: 'draft' },
    organizerUserId: { type: String, trim: true },
    coOrganizers: { type: [String], default: () => [] },
    volunteers: { type: [String], default: () => [] },
    tags: { type: [String], default: () => [] },
    isPublic: { type: Boolean, default: true },
    requiresApproval: { type: Boolean, default: false },
    createdBy: { type: String, required: true, trim: true },
    updatedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    collection: 'events',
  },
);

eventSchema.index({ tenantId: 1, startDate: 1 });
eventSchema.index({ tenantId: 1, status: 1 });
eventSchema.index({ tenantId: 1, type: 1 });

eventSchema.pre('save', async function eventPreSave(next) {
  this.updatedAt = new Date();
  if (!this.eventId) {
    this.eventId = await buildEventId(this.tenantId, this.constructor);
  }
  next();
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
