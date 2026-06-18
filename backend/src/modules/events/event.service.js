import mongoose from 'mongoose';
import AttendanceRecord from '../attendance/attendanceRecord.model.js';
import Transaction from '../finance/models/transaction.model.js';
import Member from '../members/member.model.js';
import NotificationLog from '../notifications/notification.model.js';
import Tenant from '../tenants/model.js';
import User from '../users/model.js';
import { createHttpError } from '../../utils/httpError.js';
import { ensureBranchAccess, getAssignedBranches, normalizeBranchList } from '../../utils/branchScope.js';
import Event from './models/event.model.js';
import Registration from './models/registration.model.js';

const normalizeString = (value, { lowercase = false } = {}) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const nextValue = value.trim();
  if (!nextValue) {
    return undefined;
  }

  return lowercase ? nextValue.toLowerCase() : nextValue;
};

const normalizeTenantId = (value) => normalizeString(value, { lowercase: true });

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => normalizeString(String(item))).filter(Boolean))];
  }

  if (typeof value === 'string') {
    return [...new Set(value.split(',').map((item) => normalizeString(item)).filter(Boolean))];
  }

  return [];
};

const parseDate = (value) => {
  if (!value) {
    return undefined;
  }

  const nextDate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(nextDate.getTime()) ? undefined : nextDate;
};

const buildPagination = (query = {}, fallbackLimit = 20) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || fallbackLimit, 1), 100);
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const startOfDay = (value = new Date()) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const endOfDay = (value = new Date()) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);

const serializeEvent = (eventDocument) => {
  const event = eventDocument?.toObject ? eventDocument.toObject() : eventDocument;
  return {
    ...event,
    _id: event._id?.toString?.() || String(event._id || ''),
    id: event._id?.toString?.() || String(event._id || ''),
  };
};

const serializeRegistration = (registrationDocument) => {
  const registration = registrationDocument?.toObject
    ? registrationDocument.toObject()
    : registrationDocument;
  return {
    ...registration,
    _id: registration._id?.toString?.() || String(registration._id || ''),
    id: registration._id?.toString?.() || String(registration._id || ''),
  };
};

const createNotifications = async (notifications = []) => {
  const docs = notifications.filter(
    (notification) => notification && notification.message && notification.tenantId,
  );

  if (!docs.length) {
    return;
  }

  try {
    await NotificationLog.insertMany(
      docs.map((notification) => ({
        ...notification,
        isRead: notification.isRead ?? false,
        createdAt: notification.createdAt || new Date(),
      })),
      { ordered: false },
    );
  } catch (error) {
    console.error('Event notification delivery failed:', error.message);
  }
};

const getEventOrThrow = async (tenantId, eventId) => {
  const normalized = String(eventId || '').trim();
  const filter = mongoose.isValidObjectId(normalized)
    ? { tenantId, $or: [{ _id: normalized }, { eventId: normalized }] }
    : { tenantId, eventId: normalized };
  const event = await Event.findOne(filter);

  if (!event) {
    throw createHttpError(404, 'Event not found.');
  }

  return event;
};

const getRegistrationOrThrow = async (tenantId, eventId, registrationId) => {
  const normalized = String(registrationId || '').trim();
  const registration = await Registration.findOne({
    tenantId,
    eventId,
    $or: mongoose.isValidObjectId(normalized)
      ? [{ _id: normalized }, { registrationId: normalized }]
      : [{ registrationId: normalized }],
  });

  if (!registration) {
    throw createHttpError(404, 'Registration not found.');
  }

  return registration;
};

const buildTierId = (eventId, index) => `${eventId || 'tier'}-T${String(index + 1).padStart(2, '0')}`;

const getMemberOrNull = async (tenantId, memberId) => {
  if (!memberId) {
    return null;
  }

  return Member.findOne({
    tenantId,
    memberId: String(memberId || '').trim(),
    isDeleted: false,
  });
};

const buildMemberName = (member = {}) =>
  [member.firstName, member.lastName].filter(Boolean).join(' ').trim();

const buildQrPayload = (registrationId, eventId, memberId) =>
  Buffer.from(
    JSON.stringify({
      registrationId,
      eventId,
      memberId: memberId || null,
      type: 'event_registration',
    }),
  ).toString('base64');

const getScopedBranches = (actor = {}, branchInput) => {
  const requestedBranches = normalizeBranchList(branchInput);
  const assignedBranches = getAssignedBranches(actor);
  return assignedBranches.length
    ? requestedBranches.length
      ? requestedBranches.filter((branch) => assignedBranches.includes(branch))
      : assignedBranches
    : requestedBranches;
};

const buildEventFilters = (tenantId, query = {}, actor = {}) => {
  const filters = { tenantId };
  const search = normalizeString(query.search);
  const branches = getScopedBranches(actor, query.branch || query.branches);
  const types = normalizeArray(query.type || query.types);

  if (branches.length) {
    filters.branch = { $in: branches };
  }
  if (query.status) {
    filters.status = query.status;
  }
  if (types.length) {
    filters.type = { $in: types };
  }
  if (query.from || query.to) {
    filters.startDate = {
      ...(query.from ? { $gte: startOfDay(parseDate(query.from) || new Date()) } : {}),
      ...(query.to ? { $lte: endOfDay(parseDate(query.to) || new Date()) } : {}),
    };
  }
  if (search) {
    filters.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { venue: { $regex: search, $options: 'i' } },
      { tags: { $elemMatch: { $regex: search, $options: 'i' } } },
    ];
  }

  return filters;
};

const resolveEventCurrency = async (tenantId, explicitCurrency) => {
  if (explicitCurrency) {
    return explicitCurrency;
  }

  const tenant = await Tenant.findOne({ tenantId }).select('financial');
  return tenant?.financial?.currencyCode || 'USD';
};

const buildTicketTiers = (tiers = [], eventId, fallbackCurrency = 'USD') =>
  (Array.isArray(tiers) ? tiers : []).map((tier, index) => ({
    tierId: normalizeString(tier.tierId) || buildTierId(eventId, index),
    name: tier.name,
    price: Number(tier.price || 0),
    currency: normalizeString(tier.currency) || fallbackCurrency,
    quantity: Number(tier.quantity || 0),
    sold: Number(tier.sold || 0),
    description: normalizeString(tier.description),
  }));

const createFinanceTransactionForRegistration = async ({
  tenantId,
  event,
  registration,
  actor,
}) => {
  const transaction = await Transaction.create({
    tenantId,
    type: 'other_income',
    amount: Number(registration.totalAmount || 0),
    currency: registration.currency || event.currency || 'USD',
    memberId: registration.memberId || undefined,
    memberName: registration.memberName || registration.externalName || '',
    paymentMethod: 'online',
    paymentReference: registration.paymentRef || registration.registrationId,
    serviceDate: event.startDate,
    recordedDate: new Date(),
    branch: event.branch || '',
    department: 'events',
    notes: `Event registration payment for ${event.title} (${registration.tierName || 'General'})`,
    isVerified: registration.isPaid === true,
    recordedBy: actor.userId || 'system',
    updatedBy: actor.userId || 'system',
  });

  return transaction;
};

const getEventRegistrantUsers = async (tenantId, registrations = []) => {
  const memberIds = registrations.map((item) => item.memberId).filter(Boolean);
  if (!memberIds.length) {
    return new Map();
  }

  const users = await User.find({
    tenantId,
    memberId: { $in: memberIds },
    isActive: true,
  }).select('_id memberId');

  return new Map(users.map((user) => [user.memberId, String(user._id)]));
};

export const createEvent = async (tenantId, data = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  ensureBranchAccess(actor, data.branch, 'You do not have access to this event branch.');

  const startDate = parseDate(data.startDate);
  const endDate = parseDate(data.endDate);
  if (endDate && startDate && endDate < startDate) {
    throw createHttpError(400, 'Event end date cannot be earlier than the start date.');
  }

  const currency = await resolveEventCurrency(normalizedTenantId, normalizeString(data.currency));
  const event = new Event({
    tenantId: normalizedTenantId,
    title: data.title,
    description: normalizeString(data.description),
    type: data.type || 'other',
    startDate,
    endDate,
    startTime: normalizeString(data.startTime),
    endTime: normalizeString(data.endTime),
    isMultiDay: data.isMultiDay === true,
    venue: normalizeString(data.venue),
    address: normalizeString(data.address),
    isOnline: data.isOnline === true,
    streamUrl: normalizeString(data.streamUrl),
    gpsCoordinates: data.gpsCoordinates || undefined,
    branch: normalizeString(data.branch),
    bannerUrl: normalizeString(data.bannerUrl),
    mediaUrls: normalizeArray(data.mediaUrls),
    requiresRegistration: data.requiresRegistration === true,
    registrationDeadline: parseDate(data.registrationDeadline),
    maxAttendees: data.maxAttendees !== undefined ? Number(data.maxAttendees) : undefined,
    isFree: data.isFree !== false,
    estimatedBudget: data.estimatedBudget !== undefined ? Number(data.estimatedBudget) : undefined,
    actualCost: data.actualCost !== undefined ? Number(data.actualCost) : 0,
    currency,
    organizerUserId: normalizeString(data.organizerUserId) || actor.userId,
    coOrganizers: normalizeArray(data.coOrganizers),
    volunteers: normalizeArray(data.volunteers),
    tags: normalizeArray(data.tags),
    isPublic: data.isPublic !== false,
    requiresApproval: data.requiresApproval === true,
    createdBy: actor.userId || 'system',
    updatedBy: actor.userId || 'system',
    status: 'draft',
  });

  event.ticketTiers = buildTicketTiers(data.ticketTiers, event.eventId, currency);
  await event.save();
  if (Array.isArray(data.ticketTiers) && data.ticketTiers.length) {
    event.ticketTiers = buildTicketTiers(data.ticketTiers, event.eventId, currency);
    await event.save();
  }

  return serializeEvent(event);
};

export const getAllEvents = async (tenantId, query = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const pagination = buildPagination(query);
  const filters = buildEventFilters(normalizedTenantId, query, actor);
  const [items, total] = await Promise.all([
    Event.find(filters)
      .sort({ startDate: 1, createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Event.countDocuments(filters),
  ]);

  return {
    items: items.map(serializeEvent),
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
  };
};

export const getUpcomingEvents = async (tenantId, query = {}, actor = {}) => {
  return getAllEvents(
    normalizeTenantId(tenantId),
    {
      ...query,
      from: query.from || new Date().toISOString(),
    },
    actor,
  );
};

export const getEventById = async (tenantId, eventId, actor = {}) => {
  const event = await getEventOrThrow(normalizeTenantId(tenantId), eventId);
  ensureBranchAccess(actor, event.branch, 'You do not have access to this event branch.');
  return serializeEvent(event);
};

export const updateEvent = async (tenantId, eventId, data = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const event = await getEventOrThrow(normalizedTenantId, eventId);
  ensureBranchAccess(actor, event.branch, 'You do not have access to this event branch.');

  const nextStartDate = data.startDate ? parseDate(data.startDate) : event.startDate;
  const nextEndDate =
    data.endDate !== undefined ? parseDate(data.endDate) : event.endDate;
  if (nextEndDate && nextStartDate && nextEndDate < nextStartDate) {
    throw createHttpError(400, 'Event end date cannot be earlier than the start date.');
  }

  if (data.title !== undefined) {
    event.title = data.title.trim();
  }
  if (data.description !== undefined) {
    event.description = normalizeString(data.description) || '';
  }
  if (data.type !== undefined) {
    event.type = data.type;
  }
  if (data.startDate !== undefined) {
    event.startDate = nextStartDate;
  }
  if (data.endDate !== undefined) {
    event.endDate = nextEndDate;
  }
  if (data.startTime !== undefined) {
    event.startTime = normalizeString(data.startTime) || '';
  }
  if (data.endTime !== undefined) {
    event.endTime = normalizeString(data.endTime) || '';
  }
  if (data.isMultiDay !== undefined) {
    event.isMultiDay = data.isMultiDay === true;
  }
  if (data.venue !== undefined) {
    event.venue = normalizeString(data.venue) || '';
  }
  if (data.address !== undefined) {
    event.address = normalizeString(data.address) || '';
  }
  if (data.isOnline !== undefined) {
    event.isOnline = data.isOnline === true;
  }
  if (data.streamUrl !== undefined) {
    event.streamUrl = normalizeString(data.streamUrl) || '';
  }
  if (data.gpsCoordinates !== undefined) {
    event.gpsCoordinates = data.gpsCoordinates || undefined;
  }
  if (data.branch !== undefined) {
    ensureBranchAccess(actor, data.branch, 'You do not have access to this event branch.');
    event.branch = normalizeString(data.branch) || '';
  }
  if (data.bannerUrl !== undefined) {
    event.bannerUrl = normalizeString(data.bannerUrl) || '';
  }
  if (data.mediaUrls !== undefined) {
    event.mediaUrls = normalizeArray(data.mediaUrls);
  }
  if (data.requiresRegistration !== undefined) {
    event.requiresRegistration = data.requiresRegistration === true;
  }
  if (data.registrationDeadline !== undefined) {
    event.registrationDeadline = parseDate(data.registrationDeadline);
  }
  if (data.maxAttendees !== undefined) {
    event.maxAttendees = data.maxAttendees ? Number(data.maxAttendees) : undefined;
  }
  if (data.isFree !== undefined) {
    event.isFree = data.isFree !== false;
  }
  if (data.estimatedBudget !== undefined) {
    event.estimatedBudget = Number(data.estimatedBudget || 0);
  }
  if (data.actualCost !== undefined) {
    event.actualCost = Number(data.actualCost || 0);
  }
  if (data.currency !== undefined) {
    event.currency = normalizeString(data.currency) || event.currency;
  }
  if (data.status !== undefined) {
    event.status = data.status;
  }
  if (data.organizerUserId !== undefined) {
    event.organizerUserId = normalizeString(data.organizerUserId) || '';
  }
  if (data.coOrganizers !== undefined) {
    event.coOrganizers = normalizeArray(data.coOrganizers);
  }
  if (data.volunteers !== undefined) {
    event.volunteers = normalizeArray(data.volunteers);
  }
  if (data.tags !== undefined) {
    event.tags = normalizeArray(data.tags);
  }
  if (data.isPublic !== undefined) {
    event.isPublic = data.isPublic !== false;
  }
  if (data.requiresApproval !== undefined) {
    event.requiresApproval = data.requiresApproval === true;
  }
  if (data.ticketTiers !== undefined) {
    event.ticketTiers = buildTicketTiers(data.ticketTiers, event.eventId, event.currency || 'USD');
  }

  event.updatedBy = actor.userId || event.updatedBy;
  await event.save();
  return serializeEvent(event);
};

export const deleteEvent = async (tenantId, eventId, actor = {}) => {
  const event = await getEventOrThrow(normalizeTenantId(tenantId), eventId);
  ensureBranchAccess(actor, event.branch, 'You do not have access to this event branch.');
  await Promise.all([
    Event.deleteOne({ _id: event._id }),
    Registration.deleteMany({ tenantId: event.tenantId, eventId: event.eventId }),
  ]);
  return { deleted: true };
};

export const updateEventStatus = async (tenantId, eventId, status, actor = {}) => {
  const event = await getEventOrThrow(normalizeTenantId(tenantId), eventId);
  ensureBranchAccess(actor, event.branch, 'You do not have access to this event branch.');
  event.status = status;
  event.updatedBy = actor.userId || event.updatedBy;
  await event.save();
  return serializeEvent(event);
};

export const publishEvent = async (tenantId, eventId, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const event = await getEventOrThrow(normalizedTenantId, eventId);
  ensureBranchAccess(actor, event.branch, 'You do not have access to this event branch.');

  event.status = event.requiresRegistration ? 'registration_open' : 'published';
  event.updatedBy = actor.userId || event.updatedBy;
  await event.save();

  const users = await User.find({
    tenantId: normalizedTenantId,
    isActive: true,
    role: { $ne: 'super_admin' },
  }).select('_id');

  await createNotifications(
    users.map((user) => ({
      tenantId: normalizedTenantId,
      type: 'broadcast',
      targetUserId: String(user._id),
      title: `${event.title} is happening soon`,
      message: `${event.title} is happening on ${new Date(event.startDate).toLocaleDateString()} — Register now!`,
    })),
  );

  return serializeEvent(event);
};

export const registerForEvent = async (tenantId, eventId, data = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const event = await getEventOrThrow(normalizedTenantId, eventId);
  ensureBranchAccess(actor, event.branch, 'You do not have access to this event branch.');

  if (!['published', 'registration_open'].includes(event.status)) {
    throw createHttpError(400, 'This event is not open for registration.');
  }

  if (
    event.registrationDeadline &&
    new Date(event.registrationDeadline).getTime() < Date.now()
  ) {
    throw createHttpError(400, 'Registration for this event is closed.');
  }

  if (
    typeof event.maxAttendees === 'number' &&
    Number(event.registeredCount || 0) >= Number(event.maxAttendees)
  ) {
    throw createHttpError(400, 'Event is full.');
  }

  const memberId = normalizeString(data.memberId) || normalizeString(actor.memberId);
  const member = await getMemberOrNull(normalizedTenantId, memberId);

  if (memberId && !member) {
    throw createHttpError(404, 'Member not found for event registration.');
  }

  if (memberId) {
    const existingRegistration = await Registration.findOne({
      tenantId: normalizedTenantId,
      eventId: event.eventId,
      memberId,
      status: { $ne: 'cancelled' },
    }).select('_id');
    if (existingRegistration) {
      throw createHttpError(409, 'This member is already registered for the event.');
    }
  }

  const quantity = Math.max(Number(data.quantity || 1), 1);
  let selectedTier = null;
  if (event.isFree !== true || (event.ticketTiers || []).length > 0) {
    selectedTier = (event.ticketTiers || []).find((tier) => tier.tierId === data.tierId);
    if (!selectedTier) {
      throw createHttpError(400, 'A valid ticket tier is required for this event.');
    }
    if (Number(selectedTier.sold || 0) + quantity > Number(selectedTier.quantity || 0)) {
      throw createHttpError(400, 'Selected ticket tier is sold out.');
    }
  }

  const registration = new Registration({
    tenantId: normalizedTenantId,
    eventId: event.eventId,
    eventTitle: event.title,
    memberId: member?.memberId || undefined,
    memberName: member ? buildMemberName(member) : normalizeString(data.memberName) || '',
    externalName: member ? '' : normalizeString(data.externalName) || normalizeString(data.memberName) || '',
    phone: normalizeString(data.phone) || member?.phone || '',
    email: normalizeString(data.email, { lowercase: true }) || member?.email || '',
    tierId: selectedTier?.tierId || '',
    tierName: selectedTier?.name || '',
    quantity,
    totalAmount: selectedTier ? Number(selectedTier.price || 0) * quantity : 0,
    currency: selectedTier?.currency || event.currency || 'USD',
    isPaid: event.isFree === true ? true : data.isPaid === true,
    paymentRef: normalizeString(data.paymentRef),
    status: event.requiresApproval ? 'pending' : event.isFree || data.isPaid === true ? 'confirmed' : 'pending',
    approvalStatus: event.requiresApproval ? 'pending' : 'approved',
    notes: normalizeString(data.notes),
  });

  await registration.save();
  registration.qrCode = buildQrPayload(registration.registrationId, event.eventId, registration.memberId);

  if (selectedTier) {
    selectedTier.sold = Number(selectedTier.sold || 0) + quantity;
  }
  event.registeredCount = Number(event.registeredCount || 0) + quantity;
  await event.save();

  if (registration.totalAmount > 0) {
    const transaction = await createFinanceTransactionForRegistration({
      tenantId: normalizedTenantId,
      event,
      registration,
      actor,
    });
    registration.transactionId = transaction.transactionId;
  }

  await registration.save();

  const notificationTargets = [];
  if (member?.memberId) {
    const users = await User.find({
      tenantId: normalizedTenantId,
      memberId: member.memberId,
      isActive: true,
    }).select('_id');
    notificationTargets.push(...users.map((user) => String(user._id)));
  } else if (actor.userId) {
    notificationTargets.push(actor.userId);
  }

  await createNotifications(
    notificationTargets.map((targetUserId) => ({
      tenantId: normalizedTenantId,
      type: 'reminder',
      memberId: registration.memberId,
      memberName: registration.memberName || registration.externalName,
      targetUserId,
      title: 'Event registration confirmed',
      message: `You are registered for ${event.title}.`,
    })),
  );

  return serializeRegistration(registration);
};

export const getEventRegistrations = async (tenantId, eventId, query = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const event = await getEventOrThrow(normalizedTenantId, eventId);
  ensureBranchAccess(actor, event.branch, 'You do not have access to this event branch.');

  const pagination = buildPagination(query);
  const filters = {
    tenantId: normalizedTenantId,
    eventId: event.eventId,
  };
  if (query.status) {
    filters.status = query.status;
  }
  if (query.approvalStatus) {
    filters.approvalStatus = query.approvalStatus;
  }

  const [items, total] = await Promise.all([
    Registration.find(filters)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Registration.countDocuments(filters),
  ]);

  return {
    items: items.map(serializeRegistration),
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
  };
};

export const updateRegistration = async (tenantId, eventId, registrationId, data = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const event = await getEventOrThrow(normalizedTenantId, eventId);
  ensureBranchAccess(actor, event.branch, 'You do not have access to this event branch.');
  const registration = await getRegistrationOrThrow(normalizedTenantId, event.eventId, registrationId);

  if (data.status !== undefined) {
    registration.status = data.status;
  }
  if (data.approvalStatus !== undefined) {
    registration.approvalStatus = data.approvalStatus;
  }
  if (data.isPaid !== undefined) {
    registration.isPaid = data.isPaid === true;
  }
  if (data.paymentRef !== undefined) {
    registration.paymentRef = normalizeString(data.paymentRef) || '';
  }
  if (data.notes !== undefined) {
    registration.notes = normalizeString(data.notes) || '';
  }

  await registration.save();
  return serializeRegistration(registration);
};

export const checkInToEvent = async (tenantId, eventId, registrationId, data = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const event = await getEventOrThrow(normalizedTenantId, eventId);
  ensureBranchAccess(actor, event.branch, 'You do not have access to this event branch.');
  const registration = await getRegistrationOrThrow(normalizedTenantId, event.eventId, registrationId);

  if (registration.checkedInAt) {
    throw createHttpError(400, 'This registration has already been checked in.');
  }

  registration.status = 'attended';
  registration.checkedInAt = new Date();
  registration.checkedInBy = actor.userId || normalizeString(data.checkedInBy) || 'system';
  await registration.save();

  await AttendanceRecord.create({
    tenantId: normalizedTenantId,
    serviceId: event.eventId,
    serviceTitle: event.title,
    serviceDate: event.startDate,
    memberId: registration.memberId || undefined,
    memberName: registration.memberName || registration.externalName || '',
    attendeeType: registration.memberId ? 'member' : 'visitor',
    checkInMethod: data.method === 'qr_scan' ? 'qr' : 'manual',
    checkInTime: registration.checkedInAt,
    branch: event.branch || '',
    visitorName: registration.memberId ? '' : registration.externalName || registration.memberName || '',
    phone: registration.phone || '',
    email: registration.email || '',
    checkedBy: {
      userId: actor.userId || 'system',
      role: actor.role || 'system',
    },
  });

  return serializeRegistration(registration);
};

export const approveRegistration = async (tenantId, eventId, registrationId, data = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const event = await getEventOrThrow(normalizedTenantId, eventId);
  ensureBranchAccess(actor, event.branch, 'You do not have access to this event branch.');
  const registration = await getRegistrationOrThrow(normalizedTenantId, event.eventId, registrationId);

  registration.approvalStatus = data.approvalStatus || 'approved';
  registration.approvedBy = actor.userId || 'system';
  if (registration.approvalStatus === 'approved' && registration.status === 'pending') {
    registration.status = registration.isPaid || event.isFree ? 'confirmed' : registration.status;
  }
  await registration.save();
  return serializeRegistration(registration);
};

export const getRegistrationStats = async (tenantId, eventId, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const event = await getEventOrThrow(normalizedTenantId, eventId);
  ensureBranchAccess(actor, event.branch, 'You do not have access to this event branch.');
  const registrations = await Registration.find({
    tenantId: normalizedTenantId,
    eventId: event.eventId,
  }).lean();

  const byTier = (event.ticketTiers || []).map((tier) => {
    const tierRegistrations = registrations.filter((item) => item.tierId === tier.tierId);
    return {
      tierName: tier.name,
      registered: tierRegistrations.length,
      attended: tierRegistrations.filter((item) => item.status === 'attended').length,
    };
  });

  const timelineMap = new Map();
  for (const registration of registrations.filter((item) => item.checkedInAt)) {
    const hour = new Date(registration.checkedInAt).getHours();
    timelineMap.set(hour, (timelineMap.get(hour) || 0) + 1);
  }

  const registered = registrations.length;
  const attended = registrations.filter((item) => item.status === 'attended').length;
  const confirmed = registrations.filter((item) => item.status === 'confirmed').length;
  const cancelled = registrations.filter((item) => item.status === 'cancelled').length;
  const noShow = registrations.filter((item) => item.status === 'no_show').length;

  return {
    registered,
    confirmed,
    attended,
    cancelled,
    noShow,
    attendanceRate: registered ? Number(((attended / registered) * 100).toFixed(2)) : 0,
    byTier,
    revenue: {
      expected: registrations.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
      collected: registrations
        .filter((item) => item.isPaid)
        .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
    },
    checkInTimeline: [...timelineMap.entries()]
      .map(([hour, count]) => ({ hour, count }))
      .sort((left, right) => left.hour - right.hour),
    memberVsExternal: {
      members: registrations.filter((item) => item.memberId).length,
      external: registrations.filter((item) => !item.memberId).length,
    },
  };
};

export const getMyRegistrations = async (tenantId, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  if (!actor.memberId) {
    return { items: [] };
  }

  const items = await Registration.find({
    tenantId: normalizedTenantId,
    memberId: actor.memberId,
  }).sort({ createdAt: -1 });

  return { items: items.map(serializeRegistration) };
};

export const getPublicEvents = async (tenantId, query = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const filters = {
    tenantId: normalizedTenantId,
    isPublic: true,
    status: { $in: ['published', 'registration_open'] },
    startDate: { $gte: startOfDay(new Date()) },
  };
  const pagination = buildPagination(query, 10);
  const events = await Event.find(filters)
    .sort({ startDate: 1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  return events.map((event) => ({
    eventId: event.eventId,
    title: event.title,
    description: event.description,
    type: event.type,
    startDate: event.startDate,
    endDate: event.endDate,
    startTime: event.startTime,
    endTime: event.endTime,
    venue: event.venue,
    address: event.address,
    isOnline: event.isOnline,
    streamUrl: event.isOnline ? event.streamUrl : '',
    bannerUrl: event.bannerUrl,
    mediaUrls: event.mediaUrls || [],
    requiresRegistration: event.requiresRegistration,
    registrationDeadline: event.registrationDeadline,
    maxAttendees: event.maxAttendees,
    registeredCount: event.registeredCount,
    isFree: event.isFree,
    ticketTiers: (event.ticketTiers || []).map((tier) => ({
      tierId: tier.tierId,
      name: tier.name,
      price: tier.price,
      currency: tier.currency,
      quantity: tier.quantity,
      sold: tier.sold,
      description: tier.description,
    })),
    currency: event.currency,
    tags: event.tags || [],
  }));
};

export const getPublicEventById = async (eventId) => {
  const event = await Event.findOne({
    eventId: String(eventId || '').trim(),
    isPublic: true,
    status: { $in: ['published', 'registration_open'] },
  });

  if (!event) {
    throw createHttpError(404, 'Public event not found.');
  }

  return {
    eventId: event.eventId,
    title: event.title,
    description: event.description,
    type: event.type,
    startDate: event.startDate,
    endDate: event.endDate,
    startTime: event.startTime,
    endTime: event.endTime,
    venue: event.venue,
    address: event.address,
    isOnline: event.isOnline,
    streamUrl: event.isOnline ? event.streamUrl : '',
    bannerUrl: event.bannerUrl,
    mediaUrls: event.mediaUrls || [],
    requiresRegistration: event.requiresRegistration,
    registrationDeadline: event.registrationDeadline,
    maxAttendees: event.maxAttendees,
    registeredCount: event.registeredCount,
    isFree: event.isFree,
    ticketTiers: event.ticketTiers || [],
    currency: event.currency,
    tags: event.tags || [],
  };
};

export const publicRegisterForEvent = async (eventId, data = {}) => {
  const event = await Event.findOne({
    eventId: String(eventId || '').trim(),
    isPublic: true,
    status: { $in: ['published', 'registration_open'] },
  });

  if (!event) {
    throw createHttpError(404, 'Public event not found.');
  }

  return registerForEvent(
    event.tenantId,
    event.eventId,
    data,
    {
      userId: 'public',
      role: 'public',
      memberId: null,
    },
  );
};

export const getEventStats = async (tenantId, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const events = await Event.find(buildEventFilters(normalizedTenantId, {}, actor)).lean();
  const registrations = await Registration.find({ tenantId: normalizedTenantId }).lean();
  const now = new Date();

  const byType = [...new Set(events.map((event) => event.type))].map((type) => {
    const typedEvents = events.filter((event) => event.type === type);
    const typedRegistrations = registrations.filter((registration) =>
      typedEvents.some((event) => event.eventId === registration.eventId),
    );
    return {
      type,
      count: typedEvents.length,
      avgAttendance: typedRegistrations.length
        ? Number(
            (
              (typedRegistrations.filter((item) => item.status === 'attended').length /
                typedRegistrations.length) *
              100
            ).toFixed(2),
          )
        : 0,
    };
  });

  const totalRegistrations = registrations.length;
  const totalAttendance = registrations.filter((item) => item.status === 'attended').length;

  return {
    total: events.length,
    upcoming: events.filter((item) => new Date(item.startDate) > now).length,
    ongoing: events.filter((item) => item.status === 'ongoing').length,
    completed: events.filter((item) => item.status === 'completed').length,
    cancelled: events.filter((item) => item.status === 'cancelled').length,
    totalRegistrations,
    totalAttendance,
    avgAttendanceRate: totalRegistrations
      ? Number(((totalAttendance / totalRegistrations) * 100).toFixed(2))
      : 0,
    byType,
    revenue: {
      total: registrations
        .filter((item) => item.isPaid)
        .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
      thisMonth: registrations
        .filter((item) => {
          const createdAt = new Date(item.createdAt);
          return (
            item.isPaid &&
            createdAt.getMonth() === now.getMonth() &&
            createdAt.getFullYear() === now.getFullYear()
          );
        })
        .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
    },
    upcomingHighlights: events
      .filter((item) => new Date(item.startDate) > now)
      .sort((left, right) => new Date(left.startDate) - new Date(right.startDate))
      .slice(0, 3)
      .map(serializeEvent),
  };
};

export const getPlatformEventsOverview = async () => {
  const tenants = await Tenant.find({ isActive: true, isSuspended: false }).select('tenantId churchName');
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const nextMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

  const rows = await Promise.all(
    tenants.map(async (tenant) => {
      const [events, registrations] = await Promise.all([
        Event.find({ tenantId: tenant.tenantId }).lean(),
        Registration.find({ tenantId: tenant.tenantId }).lean(),
      ]);

      return {
        tenantId: tenant.tenantId,
        churchName: tenant.churchName,
        upcomingEvents: events.filter((item) => new Date(item.startDate) > new Date()).length,
        totalThisMonth: events.filter((item) => {
          const startDate = new Date(item.startDate);
          return startDate >= currentMonthStart && startDate < nextMonthStart;
        }).length,
        totalRegistrations: registrations.length,
        revenue: registrations
          .filter((item) => item.isPaid)
          .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
      };
    }),
  );

  return {
    tenants: rows,
    totalUpcomingEvents: rows.reduce((sum, item) => sum + item.upcomingEvents, 0),
    totalRegistrations: rows.reduce((sum, item) => sum + item.totalRegistrations, 0),
    totalRevenue: rows.reduce((sum, item) => sum + item.revenue, 0),
  };
};

export const getReminderWindowEvents = async (start, end) =>
  Event.find({
    status: { $in: ['published', 'registration_open'] },
    startDate: { $gte: start, $lte: end },
  }).lean();

export const createEventReminderNotifications = async (event, message) => {
  const registrations = await Registration.find({
    tenantId: event.tenantId,
    eventId: event.eventId,
    status: { $in: ['pending', 'confirmed'] },
  }).lean();
  const userMap = await getEventRegistrantUsers(event.tenantId, registrations);

  await createNotifications(
    registrations
      .map((registration) =>
        userMap.get(registration.memberId)
          ? {
              tenantId: event.tenantId,
              type: 'reminder',
              memberId: registration.memberId,
              memberName: registration.memberName || registration.externalName,
              targetUserId: userMap.get(registration.memberId),
              title: `Reminder: ${event.title}`,
              message,
            }
          : null,
      )
      .filter(Boolean),
  );
};

export const getEventsToAutoClose = async () =>
  Event.find({
    endDate: { $lt: new Date() },
    status: 'ongoing',
  });

export const autoCloseEvent = async (eventDocument) => {
  const event = eventDocument?.save ? eventDocument : await getEventOrThrow(eventDocument.tenantId, eventDocument.eventId);
  event.status = 'completed';
  event.updatedAt = new Date();
  await event.save();
  return serializeEvent(event);
};
