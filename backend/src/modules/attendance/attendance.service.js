import mongoose from 'mongoose';
import AttendanceRecord from './attendanceRecord.model.js';
import AttendanceService from './attendanceService.model.js';
import Member from '../members/member.model.js';
import Tenant from '../tenants/model.js';
import { createHttpError } from '../../utils/httpError.js';
import { normalizeBranchList } from '../../utils/branchScope.js';

const LEADER_ROLES = new Set([
  'super_admin',
  'head_pastor',
  'associate_pastor',
  'branch_pastor',
  'volunteer_leader',
  'care_leader',
]);

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

const parseNumber = (value, fallback = 0) => {
  if (value === '' || value === null || typeof value === 'undefined') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDate = (value) => {
  if (!value) {
    return undefined;
  }

  const nextDate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(nextDate.getTime()) ? undefined : nextDate;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const startOfDay = (value = new Date()) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const endOfDay = (value = new Date()) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);

const addDays = (date, amount) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
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

const toIsoDate = (value) => {
  const date = parseDate(value);
  return date ? date.toISOString().slice(0, 10) : null;
};

const formatMonthLabel = (value) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(value);

const formatShortDate = (value) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(value);

const formatLongDate = (value) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(value);

const formatPercentage = (value) => `${Math.round(Number(value) || 0)}%`;

const formatSignedPercentage = (value) => {
  const rounded = Math.round(Number(value) || 0);
  if (rounded > 0) {
    return `+${rounded}%`;
  }
  return `${rounded}%`;
};

const formatTrendArrow = (value) => {
  if (value > 0) {
    return '↑';
  }
  if (value < 0) {
    return '↓';
  }
  return '→';
};

const buildTimeLabel = (value) => {
  const date = parseDate(value);
  if (!date) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const getServiceStatus = (serviceDate, checkInOpen) => {
  if (checkInOpen) {
    return 'open';
  }

  const now = new Date();
  if (serviceDate && serviceDate.getTime() > now.getTime()) {
    return 'upcoming';
  }

  return 'completed';
};

const percentage = (value, total) => {
  if (!total) {
    return 0;
  }

  return Number(((Number(value) / Number(total)) * 100).toFixed(1));
};

const serviceTotalCount = (service) =>
  Number(service?.stats?.total ?? service?.stats?.totalCheckedIn ?? 0);

const ensureObjectIdString = (value) => {
  if (!mongoose.isValidObjectId(value)) {
    throw createHttpError(404, 'Attendance service not found.');
  }

  return String(value);
};

const serializeService = (serviceDocument) => {
  const service = serviceDocument.toObject ? serviceDocument.toObject() : serviceDocument;
  const serviceId = service._id?.toString?.() || String(service._id || '');
  const stats = service.stats || {};
  const total = Number(stats.total ?? stats.totalCheckedIn ?? 0);

  return {
    ...service,
    _id: serviceId,
    serviceId,
    status: getServiceStatus(service.date ? new Date(service.date) : null, service.checkInOpen),
    stats: {
      total,
      totalCheckedIn: total,
      members: Number(stats.members || 0),
      visitors: Number(stats.visitors || 0),
      children: Number(stats.children || 0),
      online: Number(stats.online || 0),
      firstTimers: Number(stats.firstTimers || 0),
      male: Number(stats.male || 0),
      female: Number(stats.female || 0),
    },
    offlineCount: {
      adults: Number(service.offlineCount?.adults || 0),
      children: Number(service.offlineCount?.children || 0),
      visitors: Number(service.offlineCount?.visitors || 0),
    },
  };
};

const serializeRecord = (recordDocument) => {
  const record = recordDocument.toObject ? recordDocument.toObject() : recordDocument;
  const recordId = record._id?.toString?.() || String(record._id || '');
  const attendeeType = record.attendeeType || 'member';
  const displayName =
    record.memberName ||
    record.childName ||
    record.visitorName ||
    record.memberId ||
    'Guest';

  return {
    ...record,
    _id: recordId,
    id: recordId,
    attendanceId: recordId,
    checkInId: recordId,
    type: attendeeType,
    attendeeType,
    method: record.checkInMethod,
    checkInMethod: record.checkInMethod,
    checkedInAt: record.checkInTime,
    time: buildTimeLabel(record.checkInTime),
    name: displayName,
    memberName: record.memberName || record.childName || record.visitorName || displayName,
    visitorName: record.visitorName,
    serviceId: record.serviceId,
    serviceTitle: record.serviceTitle,
    serviceDate: record.serviceDate,
    branch: record.branch,
    isChild: record.isChild === true,
    pickupCode: record.pickupCode,
    childName: record.childName,
    parentName: record.parentName,
    photoUrl: record.photoUrl,
  };
};

const getServiceOrThrow = async (tenantId, serviceId) => {
  const resolvedServiceId = ensureObjectIdString(serviceId);
  const service = await AttendanceService.findOne({
    _id: resolvedServiceId,
    tenantId,
  });

  if (!service) {
    throw createHttpError(404, 'Attendance service not found.');
  }

  return service;
};

const getMemberOrThrow = async (tenantId, memberId) => {
  const member = await Member.findOne({
    tenantId,
    memberId: String(memberId || '').trim(),
    isDeleted: false,
  });

  if (!member) {
    throw createHttpError(404, 'Member not found.');
  }

  return member;
};

const findExistingMemberCheckIn = async (tenantId, serviceId, memberId) =>
  AttendanceRecord.findOne({
    tenantId,
    serviceId,
    memberId,
    isRemoved: false,
  }).sort({ checkInTime: -1 });

const calculateTimeline = (records = []) => {
  const buckets = new Map();

  for (const record of records) {
    const source = parseDate(record.checkInTime || record.createdAt);
    if (!source) {
      continue;
    }

    const roundedMinutes = Math.floor(source.getMinutes() / 15) * 15;
    const bucketDate = new Date(source);
    bucketDate.setMinutes(roundedMinutes, 0, 0);
    const key = bucketDate.toISOString();
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  return [...buckets.entries()]
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([key, count]) => ({
      label: buildTimeLabel(key),
      count,
    }));
};

const calculateStats = (records = []) => {
  const stats = {
    total: 0,
    totalCheckedIn: 0,
    members: 0,
    visitors: 0,
    children: 0,
    online: 0,
    firstTimers: 0,
    male: 0,
    female: 0,
  };

  for (const record of records) {
    const type = String(record.attendeeType || 'member').toLowerCase();
    stats.total += 1;

    if (type === 'visitor') {
      stats.visitors += 1;
    } else if (type === 'child') {
      stats.children += 1;
    } else if (type === 'online') {
      stats.online += 1;
    } else {
      stats.members += 1;
    }

    if (record.firstTimer) {
      stats.firstTimers += 1;
    }

    if (record.gender === 'male') {
      stats.male += 1;
    }
    if (record.gender === 'female') {
      stats.female += 1;
    }
  }

  stats.totalCheckedIn = stats.total;
  return stats;
};

const refreshServiceMetrics = async (tenantId, serviceId) => {
  const [service, records] = await Promise.all([
    getServiceOrThrow(tenantId, serviceId),
    AttendanceRecord.find({
      tenantId,
      serviceId: String(serviceId),
      isRemoved: false,
    }).sort({ checkInTime: 1 }),
  ]);

  service.stats = calculateStats(records);
  service.checkInTimeline = calculateTimeline(records);
  await service.save();

  return serializeService(service);
};

const buildServiceFilters = (tenantId, query = {}) => {
  const filters = { tenantId };
  const status = normalizeString(query.status, { lowercase: true });
  const type = normalizeString(query.type);
  const branches = normalizeBranchList(query.branches || query.branch);
  const from = parseDate(query.from);
  const to = parseDate(query.to);
  const today = startOfDay(new Date());

  if (type) {
    filters.type = type;
  }

  if (branches.length === 1) {
    filters.branch = branches[0];
  } else if (branches.length > 1) {
    filters.branch = { $in: branches };
  }

  if (from || to) {
    filters.date = {
      ...(from ? { $gte: startOfDay(from) } : {}),
      ...(to ? { $lte: endOfDay(to) } : {}),
    };
  }

  if (status === 'open') {
    filters.checkInOpen = true;
  } else if (status === 'upcoming') {
    filters.checkInOpen = false;
    filters.date = {
      ...(filters.date || {}),
      $gte: startOfDay(filters.date?.$gte || today),
    };
  } else if (status === 'past' || status === 'completed') {
    filters.checkInOpen = false;
    filters.date = {
      ...(filters.date || {}),
      $lt: startOfDay(filters.date?.$lt || today),
    };
  }

  return filters;
};

const buildServiceSort = (query = {}) => {
  const status = normalizeString(query.status, { lowercase: true });

  if (status === 'past' || status === 'completed') {
    return { date: -1, createdAt: -1 };
  }

  return { checkInOpen: -1, date: 1, createdAt: -1 };
};

const normalizeServicePayload = (payload = {}) => {
  const title = normalizeString(payload.title);
  const type = normalizeString(payload.type) || 'Sunday Service';
  const date = parseDate(payload.date || payload.serviceDate);

  if (!title) {
    throw createHttpError(400, 'Service title is required.');
  }

  if (!date) {
    throw createHttpError(400, 'A valid service date is required.');
  }

  return {
    title,
    type,
    date: startOfDay(date),
    startTime: normalizeString(payload.startTime),
    endTime: normalizeString(payload.endTime),
    branch: normalizeString(payload.branch),
    location: normalizeString(payload.location),
    expectedAttendance: parseNumber(payload.expectedAttendance, 0),
    notes: normalizeString(payload.notes),
  };
};

const buildCheckInPayload = ({ service, member, actor, attendeeType, checkInMethod, extras = {} }) => ({
  tenantId: service.tenantId,
  serviceId: service._id.toString(),
  serviceTitle: service.title,
  serviceDate: service.date,
  memberId: member?.memberId,
  memberName: member ? [member.firstName, member.lastName].filter(Boolean).join(' ') : undefined,
  attendeeType,
  checkInMethod,
  branch: service.branch || member?.branch,
  isChild: attendeeType === 'child',
  phone: member?.phone,
  email: member?.email,
  photoUrl: member?.photoUrl,
  gender: member?.gender,
  department: Array.isArray(member?.department) ? member.department : [],
  checkedBy: {
    userId: actor?.userId,
    role: actor?.role,
  },
  ...extras,
});

const buildAlreadyCheckedInResponse = (existingRecord) => ({
  alreadyCheckedIn: true,
  message: `Already checked in at ${buildTimeLabel(existingRecord.checkInTime)}.`,
  checkedInAt: existingRecord.checkInTime,
  ...serializeRecord(existingRecord),
});

const getPastServiceSequence = async (tenantId, { from, to } = {}) => {
  const filters = {
    tenantId,
    date: {
      $lte: endOfDay(new Date()),
      ...(from ? { $gte: startOfDay(from) } : {}),
      ...(to ? { $lte: endOfDay(to) } : {}),
    },
  };

  const services = await AttendanceService.find(filters).sort({ date: 1, createdAt: 1 });
  return services.map(serializeService);
};

const computeStreaks = (services, attendedServiceIds) => {
  let current = 0;
  let longest = 0;
  let active = 0;

  for (let index = services.length - 1; index >= 0; index -= 1) {
    const service = services[index];
    const attended = attendedServiceIds.has(service.serviceId);

    if (attended) {
      active += 1;
      longest = Math.max(longest, active);
    } else {
      if (current === 0) {
        current = active;
      }
      active = 0;
    }
  }

  if (current === 0) {
    current = active;
  }

  return { streak: current, longestStreak: Math.max(longest, current) };
};

const buildMonthlyBreakdown = (services, attendedServiceIds, months = 6) => {
  const today = new Date();
  const output = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const current = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const monthlyServices = services.filter((service) => {
      const serviceDate = parseDate(service.date);
      return (
        serviceDate &&
        serviceDate.getFullYear() === current.getFullYear() &&
        serviceDate.getMonth() === current.getMonth()
      );
    });

    const attended = monthlyServices.filter((service) => attendedServiceIds.has(service.serviceId)).length;
    const total = monthlyServices.length;

    output.push({
      month: current.getMonth() + 1,
      year: current.getFullYear(),
      attended,
      total,
      rate: total ? percentage(attended, total) : 0,
    });
  }

  return output;
};

const buildCalendarStatuses = (services, attendedServiceIds, months = 6) => {
  const today = new Date();
  const startMonth = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);
  const result = [];
  const seenDates = new Set();

  for (const service of services) {
    const serviceDate = parseDate(service.date);
    if (!serviceDate || serviceDate < startMonth || serviceDate > endOfDay(today)) {
      continue;
    }

    const key = toIsoDate(serviceDate);
    if (!key || seenDates.has(key)) {
      continue;
    }

    seenDates.add(key);
    result.push({
      date: key,
      status: attendedServiceIds.has(service.serviceId) ? 'attended' : 'missed',
      serviceId: service.serviceId,
      title: service.title,
    });
  }

  return result;
};

const resolveReportRange = (query = {}) => {
  const period = normalizeString(query.period, { lowercase: true }) || 'month';
  const now = new Date();
  let start;
  let end;
  let previousStart;
  let previousEnd;

  if (period === 'custom') {
    start = startOfDay(parseDate(query.from) || addDays(now, -30));
    end = endOfDay(parseDate(query.to) || now);
    const duration = end.getTime() - start.getTime();
    previousEnd = new Date(start.getTime() - 1);
    previousStart = new Date(previousEnd.getTime() - duration);
  } else if (period === 'week') {
    const day = now.getDay();
    start = startOfDay(addDays(now, -day));
    end = endOfDay(addDays(start, 6));
    previousStart = addDays(start, -7);
    previousEnd = endOfDay(addDays(start, -1));
  } else if (period === 'quarter') {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    start = new Date(now.getFullYear(), quarterStartMonth, 1);
    end = endOfDay(new Date(now.getFullYear(), quarterStartMonth + 3, 0));
    previousStart = new Date(now.getFullYear(), quarterStartMonth - 3, 1);
    previousEnd = endOfDay(new Date(now.getFullYear(), quarterStartMonth, 0));
  } else if (period === 'year') {
    start = new Date(now.getFullYear(), 0, 1);
    end = endOfDay(new Date(now.getFullYear(), 11, 31));
    previousStart = new Date(now.getFullYear() - 1, 0, 1);
    previousEnd = endOfDay(new Date(now.getFullYear() - 1, 11, 31));
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    previousEnd = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
  }

  return { start, end, previousStart, previousEnd, period };
};

const buildBranchMatch = (tenantId, branch) => {
  const branches = normalizeBranchList(branch);
  return {
    tenantId,
    ...(branches.length === 1
      ? { branch: branches[0] }
      : branches.length > 1
        ? { branch: { $in: branches } }
        : {}),
  };
};

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const findLatestAttendanceByMember = (records) => {
  const output = new Map();

  for (const record of records) {
    if (!record.memberId) {
      continue;
    }

    const existing = output.get(record.memberId);
    if (!existing || new Date(record.serviceDate).getTime() > new Date(existing.serviceDate).getTime()) {
      output.set(record.memberId, record);
    }
  }

  return output;
};

export const attendanceRoleAccess = {
  canLeadCheckIn: (role) => LEADER_ROLES.has(role),
};

export const listServices = async (tenantId, query = {}) => {
  const { page, limit, skip } = buildPagination(query, 12);
  const filters = buildServiceFilters(tenantId, query);
  const [total, services] = await Promise.all([
    AttendanceService.countDocuments(filters),
    AttendanceService.find(filters).sort(buildServiceSort(query)).skip(skip).limit(limit),
  ]);

  const items = services.map(serializeService);
  const normalizedStatus = normalizeString(query.status, { lowercase: true });

  return {
    items,
    services: items,
    page,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    ...(normalizedStatus === 'open' ? { currentService: items[0] || null } : {}),
  };
};

export const getServiceById = async (tenantId, serviceId) => {
  const service = await getServiceOrThrow(tenantId, serviceId);
  return serializeService(service);
};

export const createService = async (tenantId, payload = {}, actor = {}) => {
  const service = await AttendanceService.create({
    tenantId,
    ...normalizeServicePayload(payload),
    createdBy: actor.userId,
    updatedBy: actor.userId,
  });

  return serializeService(service);
};

export const updateService = async (tenantId, serviceId, payload = {}, actor = {}) => {
  const service = await getServiceOrThrow(tenantId, serviceId);
  Object.assign(service, normalizeServicePayload({ ...service.toObject(), ...payload }));
  service.updatedBy = actor.userId;
  await service.save();
  return serializeService(service);
};

export const deleteService = async (tenantId, serviceId) => {
  const service = await getServiceOrThrow(tenantId, serviceId);
  await Promise.all([
    AttendanceRecord.deleteMany({
      tenantId,
      serviceId: service._id.toString(),
    }),
    service.deleteOne(),
  ]);

  return {
    success: true,
    serviceId: service._id.toString(),
  };
};

export const toggleServiceCheckIn = async (tenantId, serviceId, isOpen, actor = {}) => {
  const service = await getServiceOrThrow(tenantId, serviceId);
  service.checkInOpen = isOpen === true;
  service.updatedBy = actor.userId;
  await service.save();
  return serializeService(service);
};

export const computeServiceStats = async (tenantId, serviceId) =>
  refreshServiceMetrics(tenantId, serviceId);

export const updateOfflineCount = async (tenantId, serviceId, payload = {}, actor = {}) => {
  const service = await getServiceOrThrow(tenantId, serviceId);
  service.offlineCount = {
    adults: parseNumber(payload.adults, 0),
    children: parseNumber(payload.children, 0),
    visitors: parseNumber(payload.visitors, 0),
  };
  service.updatedBy = actor.userId;
  await service.save();
  return serializeService(service);
};

export const getServiceAttendance = async (tenantId, serviceId, query = {}) => {
  const service = await getServiceOrThrow(tenantId, serviceId);
  const { page, limit, skip } = buildPagination(query, 20);
  const filters = {
    tenantId,
    serviceId: service._id.toString(),
    isRemoved: false,
  };
  const type = normalizeString(query.type, { lowercase: true });
  const method = normalizeString(query.method, { lowercase: true });

  if (type) {
    filters.attendeeType = type;
  }

  if (method) {
    filters.checkInMethod = method;
  }

  const [total, records] = await Promise.all([
    AttendanceRecord.countDocuments(filters),
    AttendanceRecord.find(filters).sort({ checkInTime: -1 }).skip(skip).limit(limit),
  ]);

  return {
    items: records.map(serializeRecord),
    checkIns: records.map(serializeRecord),
    page,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    timeline: serializeService(service).checkInTimeline || [],
    summary: serializeService(service).stats,
  };
};

export const removeCheckIn = async (tenantId, serviceId, checkInId, actor = {}) => {
  const service = await getServiceOrThrow(tenantId, serviceId);
  const record = await AttendanceRecord.findOne({
    _id: checkInId,
    tenantId,
    serviceId: service._id.toString(),
    isRemoved: false,
  });

  if (!record) {
    throw createHttpError(404, 'Attendance record not found.');
  }

  record.isRemoved = true;
  record.removedAt = new Date();
  record.removedBy = {
    userId: actor.userId,
    role: actor.role,
  };
  await record.save();
  await refreshServiceMetrics(tenantId, serviceId);

  return {
    success: true,
    checkInId,
  };
};

const ensureServiceOpen = (service, { allowCompleted = false } = {}) => {
  const status = getServiceStatus(service.date, service.checkInOpen);
  if (!service.checkInOpen && !allowCompleted) {
    throw createHttpError(400, `Check-in is not open for ${service.title}.`);
  }
  return status;
};

export const onlineCheckIn = async (tenantId, serviceId, user = {}) => {
  const service = await getServiceOrThrow(tenantId, serviceId);
  ensureServiceOpen(service);

  if (!user.memberId) {
    throw createHttpError(400, 'This account is not linked to a member profile.');
  }

  const existing = await findExistingMemberCheckIn(tenantId, service._id.toString(), user.memberId);
  if (existing) {
    return buildAlreadyCheckedInResponse(existing);
  }

  const member = await getMemberOrThrow(tenantId, user.memberId);
  const record = await AttendanceRecord.create(
    buildCheckInPayload({
      service,
      member,
      actor: user,
      attendeeType: 'online',
      checkInMethod: 'online',
    }),
  );

  await refreshServiceMetrics(tenantId, serviceId);
  return {
    message: 'You are checked in.',
    checkedInAt: record.checkInTime,
    ...serializeRecord(record),
  };
};

const resolveQrMemberId = (rawQrData) => {
  const value = String(rawQrData || '').trim();
  if (!value) {
    throw createHttpError(400, 'QR code data is required.');
  }

  try {
    const parsed = JSON.parse(value);
    return {
      memberId: normalizeString(parsed.memberId),
      tenantId: normalizeString(parsed.tenantId, { lowercase: true }),
      name: normalizeString(parsed.name),
    };
  } catch {
    return {
      memberId: value,
    };
  }
};

export const qrCheckIn = async (tenantId, serviceId, qrData, actor = {}) => {
  const service = await getServiceOrThrow(tenantId, serviceId);
  ensureServiceOpen(service);

  const parsed = resolveQrMemberId(qrData);
  if (parsed.tenantId && parsed.tenantId !== tenantId) {
    throw createHttpError(403, 'This QR code belongs to another tenant.');
  }

  const member = await getMemberOrThrow(tenantId, parsed.memberId);
  const existing = await findExistingMemberCheckIn(tenantId, service._id.toString(), member.memberId);
  if (existing) {
    return buildAlreadyCheckedInResponse(existing);
  }

  const record = await AttendanceRecord.create(
    buildCheckInPayload({
      service,
      member,
      actor,
      attendeeType: 'member',
      checkInMethod: 'qr',
    }),
  );

  await refreshServiceMetrics(tenantId, serviceId);
  return {
    message: 'Checked in successfully.',
    checkedInAt: record.checkInTime,
    ...serializeRecord(record),
  };
};

export const manualCheckIn = async (tenantId, serviceId, memberId, actor = {}) => {
  const service = await getServiceOrThrow(tenantId, serviceId);
  ensureServiceOpen(service);

  const member = await getMemberOrThrow(tenantId, memberId);
  const existing = await findExistingMemberCheckIn(tenantId, service._id.toString(), member.memberId);
  if (existing) {
    return buildAlreadyCheckedInResponse(existing);
  }

  const record = await AttendanceRecord.create(
    buildCheckInPayload({
      service,
      member,
      actor,
      attendeeType: 'member',
      checkInMethod: 'manual',
    }),
  );

  await refreshServiceMetrics(tenantId, serviceId);
  return {
    message: 'Member checked in successfully.',
    checkedInAt: record.checkInTime,
    ...serializeRecord(record),
  };
};

export const visitorCheckIn = async (tenantId, serviceId, payload = {}, actor = {}) => {
  const service = await getServiceOrThrow(tenantId, serviceId);
  ensureServiceOpen(service);

  const visitorName = normalizeString(payload.name || payload.visitorName);
  if (!visitorName) {
    throw createHttpError(400, 'Visitor name is required.');
  }

  const record = await AttendanceRecord.create({
    tenantId,
    serviceId: service._id.toString(),
    serviceTitle: service.title,
    serviceDate: service.date,
    attendeeType: 'visitor',
    checkInMethod: 'visitor_form',
    visitorName,
    branch: service.branch,
    firstTimer: payload.firstTimer === true || String(payload.firstTimer).toLowerCase() === 'true',
    phone: normalizeString(payload.phone),
    email: normalizeString(payload.email, { lowercase: true }),
    checkedBy: {
      userId: actor.userId,
      role: actor.role,
    },
  });

  await refreshServiceMetrics(tenantId, serviceId);
  return {
    message: 'Visitor checked in successfully.',
    visitorName,
    checkedInAt: record.checkInTime,
    ...serializeRecord(record),
  };
};

const generatePickupCode = () => String(Math.floor(1000 + Math.random() * 9000));

export const childCheckIn = async (tenantId, serviceId, payload = {}, actor = {}) => {
  const service = await getServiceOrThrow(tenantId, serviceId);
  ensureServiceOpen(service);

  const parentMemberId = normalizeString(payload.parentMemberId || payload.memberId);
  const childName = normalizeString(payload.childName || payload.name);

  if (!parentMemberId) {
    throw createHttpError(400, 'Parent member ID is required.');
  }

  if (!childName) {
    throw createHttpError(400, 'Child name is required.');
  }

  const parent = await getMemberOrThrow(tenantId, parentMemberId);
  const existing = await AttendanceRecord.findOne({
    tenantId,
    serviceId: service._id.toString(),
    parentMemberId,
    childName,
    isRemoved: false,
  });

  if (existing) {
    return buildAlreadyCheckedInResponse(existing);
  }

  const pickupCode = generatePickupCode();
  const record = await AttendanceRecord.create({
    tenantId,
    serviceId: service._id.toString(),
    serviceTitle: service.title,
    serviceDate: service.date,
    attendeeType: 'child',
    checkInMethod: 'child_check_in',
    isChild: true,
    childName,
    childAge: parseNumber(payload.childAge ?? payload.age, 0),
    parentMemberId: parent.memberId,
    parentName: [parent.firstName, parent.lastName].filter(Boolean).join(' '),
    branch: service.branch || parent.branch,
    pickupCode,
    photoUrl: parent.photoUrl,
    checkedBy: {
      userId: actor.userId,
      role: actor.role,
    },
  });

  await refreshServiceMetrics(tenantId, serviceId);
  return {
    message: 'Child checked in successfully.',
    childName,
    parentName: record.parentName,
    pickupCode,
    checkedInAt: record.checkInTime,
    ...serializeRecord(record),
  };
};

export const getLiveCheckIns = async (tenantId, serviceId, query = {}) => {
  const service = await getServiceOrThrow(tenantId, serviceId);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);

  const records = await AttendanceRecord.find({
    tenantId,
    serviceId: service._id.toString(),
    isRemoved: false,
  })
    .sort({ checkInTime: -1 })
    .limit(limit);

  return {
    summary: serializeService(service).stats,
    items: records.map(serializeRecord),
    checkIns: records.map(serializeRecord),
  };
};

export const searchCheckInMembers = async (tenantId, query = {}) => {
  const search = normalizeString(query.search);
  if (!search) {
    return { members: [] };
  }

  const regex = new RegExp(escapeRegex(search), 'i');
  const members = await Member.find({
    tenantId,
    isDeleted: false,
    $or: [
      { firstName: regex },
      { lastName: regex },
      { phone: regex },
      { memberId: regex },
    ],
  })
    .select('memberId firstName lastName phone branch department photoUrl')
    .sort({ firstName: 1, lastName: 1 })
    .limit(Math.min(Math.max(Number(query.limit) || 8, 1), 25));

  return {
    members: members.map((member) => ({
      memberId: member.memberId,
      firstName: member.firstName,
      lastName: member.lastName,
      phone: member.phone,
      branch: member.branch,
      department: Array.isArray(member.department) ? member.department.join(', ') : '',
      photoUrl: member.photoUrl,
    })),
  };
};

export const getMyAttendanceHistory = async (tenantId, user = {}) => {
  if (!user.memberId) {
    throw createHttpError(400, 'This account is not linked to a member profile.');
  }

  const since = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1);
  const [services, records] = await Promise.all([
    getPastServiceSequence(tenantId, { from: since }),
    AttendanceRecord.find({
      tenantId,
      memberId: user.memberId,
      isRemoved: false,
    }).sort({ serviceDate: -1, checkInTime: -1 }),
  ]);

  const uniqueAttendedIds = new Set(records.map((record) => record.serviceId));
  const { streak, longestStreak } = computeStreaks(services, uniqueAttendedIds);
  const monthlyBreakdown = buildMonthlyBreakdown(services, uniqueAttendedIds, 6);

  return {
    totalServices: services.length,
    attended: uniqueAttendedIds.size,
    attendanceRate: services.length ? percentage(uniqueAttendedIds.size, services.length) : 0,
    streak,
    longestStreak,
    attendedServices: records.map(serializeRecord),
    monthlyBreakdown,
  };
};

export const getAttendanceSummary = async (tenantId, query = {}) => {
  const { start, end, previousStart, previousEnd } = resolveReportRange(query);
  const branch = query.branches || query.branch;

  const serviceFilters = {
    ...buildBranchMatch(tenantId, branch),
    date: {
      $gte: start,
      $lte: end,
    },
  };
  const previousServiceFilters = {
    ...buildBranchMatch(tenantId, branch),
    date: {
      $gte: previousStart,
      $lte: previousEnd,
    },
  };

  const [services, previousServices, records, previousRecords] = await Promise.all([
    AttendanceService.find(serviceFilters).sort({ date: -1 }).limit(20),
    AttendanceService.find(previousServiceFilters),
    AttendanceRecord.find({
      ...buildBranchMatch(tenantId, branch),
      serviceDate: { $gte: start, $lte: end },
      isRemoved: false,
    }),
    AttendanceRecord.find({
      ...buildBranchMatch(tenantId, branch),
      serviceDate: { $gte: previousStart, $lte: previousEnd },
      isRemoved: false,
    }),
  ]);

  const totalHeadcount = records.length;
  const previousHeadcount = previousRecords.length;
  const averagePerService = services.length ? Number((totalHeadcount / services.length).toFixed(1)) : 0;
  const growthRate = previousHeadcount
    ? ((totalHeadcount - previousHeadcount) / previousHeadcount) * 100
    : totalHeadcount > 0
      ? 100
      : 0;

  const currentMembers = new Set(
    records.filter((record) => record.memberId).map((record) => record.memberId),
  );
  const previousMembers = new Set(
    previousRecords.filter((record) => record.memberId).map((record) => record.memberId),
  );
  const retainedMembers = [...currentMembers].filter((memberId) => previousMembers.has(memberId)).length;
  const firstTimers = records.filter((record) => record.firstTimer).length;
  const visitors = records.filter((record) => record.attendeeType === 'visitor').length;

  return {
    kpis: {
      totalHeadcount,
      averagePerService,
      growthRate: formatSignedPercentage(growthRate),
      memberRetentionRate: formatPercentage(percentage(retainedMembers, previousMembers.size || 1)),
      firstTimerConversionRate: formatPercentage(percentage(firstTimers, visitors || firstTimers || 1)),
    },
    services: services.map((service) => ({
      serviceId: service._id.toString(),
      label: formatShortDate(service.date),
      count: serviceTotalCount(service),
      title: service.title,
    })),
    comparison: {
      currentHeadcount: totalHeadcount,
      previousHeadcount,
      currentServices: services.length,
      previousServices: previousServices.length,
    },
  };
};

export const getAttendanceTrends = async (tenantId, query = {}) => {
  const branch = query.branches || query.branch;
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const lastYearStart = new Date(now.getFullYear() - 1, now.getMonth() - 11, 1);

  const [records, previousYearRecords] = await Promise.all([
    AttendanceRecord.find({
      ...buildBranchMatch(tenantId, branch),
      serviceDate: { $gte: startMonth, $lte: endOfDay(now) },
      isRemoved: false,
    }),
    AttendanceRecord.find({
      ...buildBranchMatch(tenantId, branch),
      serviceDate: { $gte: lastYearStart, $lte: endOfDay(addDays(startMonth, -1)) },
      isRemoved: false,
    }),
  ]);

  const monthlyMap = new Map();
  for (let index = 0; index < 12; index += 1) {
    const current = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    monthlyMap.set(monthKey(current), {
      label: formatMonthLabel(current),
      members: 0,
      visitors: 0,
      total: 0,
      membersLastYear: 0,
      visitorsLastYear: 0,
    });
  }

  for (const record of records) {
    const key = monthKey(new Date(record.serviceDate));
    const entry = monthlyMap.get(key);
    if (!entry) {
      continue;
    }

    entry.total += 1;
    if (record.attendeeType === 'visitor') {
      entry.visitors += 1;
    } else if (record.attendeeType !== 'child') {
      entry.members += 1;
    }
  }

  for (const record of previousYearRecords) {
    const recordDate = new Date(record.serviceDate);
    const shifted = new Date(recordDate.getFullYear() + 1, recordDate.getMonth(), 1);
    const entry = monthlyMap.get(monthKey(shifted));
    if (!entry) {
      continue;
    }

    if (record.attendeeType === 'visitor') {
      entry.visitorsLastYear += 1;
    } else if (record.attendeeType !== 'child') {
      entry.membersLastYear += 1;
    }
  }

  const weekly = [];
  const startOfCurrentWeek = addDays(startOfDay(now), -now.getDay());
  for (let index = 11; index >= 0; index -= 1) {
    const weekStart = addDays(startOfCurrentWeek, -index * 7);
    const weekEnd = endOfDay(addDays(weekStart, 6));
    const weekTotal = records.filter((record) => {
      const serviceDate = new Date(record.serviceDate);
      return serviceDate >= weekStart && serviceDate <= weekEnd;
    }).length;

    weekly.push({
      label: formatShortDate(weekStart),
      total: weekTotal,
    });
  }

  const weeklyCurrent = weekly.slice(-4).reduce((sum, item) => sum + item.total, 0);
  const weeklyPrevious = weekly.slice(-8, -4).reduce((sum, item) => sum + item.total, 0);

  return {
    monthly: [...monthlyMap.values()],
    weekly,
    growthRate: formatSignedPercentage(
      weeklyPrevious ? ((weeklyCurrent - weeklyPrevious) / weeklyPrevious) * 100 : weeklyCurrent ? 100 : 0,
    ),
  };
};

export const getAttendanceHeatmap = async (tenantId, query = {}) => {
  const { start, end } = resolveReportRange(query);
  const branch = query.branches || query.branch;
  const records = await AttendanceRecord.find({
    ...buildBranchMatch(tenantId, branch),
    serviceDate: { $gte: start, $lte: end },
    isRemoved: false,
  });

  const cells = [];
  const buckets = new Map();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    for (let hour = 6; hour <= 17; hour += 1) {
      const key = `${dayIndex}-${hour}`;
      buckets.set(key, 0);
    }
  }

  for (const record of records) {
    const date = new Date(record.checkInTime || record.serviceDate);
    const dayIndex = date.getDay();
    const hour = date.getHours();
    if (hour < 6 || hour > 17) {
      continue;
    }
    const key = `${dayIndex}-${hour}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  let busiest = { key: '0-10', value: 0 };
  for (const [key, value] of buckets.entries()) {
    const [dayIndex, hour] = key.split('-').map(Number);
    cells.push({
      day: days[dayIndex],
      dayIndex,
      hour,
      value,
    });
    if (value > busiest.value) {
      busiest = { key, value };
    }
  }

  const [busiestDayIndex, busiestHour] = busiest.key.split('-').map(Number);
  return {
    cells,
    busiestSlot: `Busiest: ${days[busiestDayIndex]} ${busiestHour}:00`,
  };
};

export const getAttendanceRetention = async (tenantId, query = {}) => {
  const branch = query.branches || query.branch;
  const records = await AttendanceRecord.find({
    ...buildBranchMatch(tenantId, branch),
    memberId: { $exists: true, $ne: null },
    attendeeType: { $in: ['member', 'online'] },
    isRemoved: false,
  }).sort({ serviceDate: 1 });

  const memberGroups = new Map();
  for (const record of records) {
    if (!record.memberId) {
      continue;
    }

    const serviceDate = new Date(record.serviceDate);
    const key = record.memberId;
    const current = memberGroups.get(key) || [];
    current.push(serviceDate);
    memberGroups.set(key, current);
  }

  const matrixMap = new Map();
  for (const attendanceDates of memberGroups.values()) {
    if (!attendanceDates.length) {
      continue;
    }

    const firstDate = attendanceDates[0];
    const cohort = formatMonthLabel(firstDate);
    const current = matrixMap.get(cohort) || {
      cohort,
      total: 0,
      month1Hits: 0,
      month3Hits: 0,
      month6Hits: 0,
    };

    current.total += 1;

    const hasWithinMonths = (months) =>
      attendanceDates.some((date, index) => {
        if (index === 0) {
          return false;
        }
        const diffMonths =
          (date.getFullYear() - firstDate.getFullYear()) * 12 + (date.getMonth() - firstDate.getMonth());
        return diffMonths <= months;
      });

    if (hasWithinMonths(1)) {
      current.month1Hits += 1;
    }
    if (hasWithinMonths(3)) {
      current.month3Hits += 1;
    }
    if (hasWithinMonths(6)) {
      current.month6Hits += 1;
    }

    matrixMap.set(cohort, current);
  }

  return {
    matrix: [...matrixMap.values()].map((row) => ({
      cohort: row.cohort,
      month1: Math.round(percentage(row.month1Hits, row.total)),
      month3: Math.round(percentage(row.month3Hits, row.total)),
      month6: Math.round(percentage(row.month6Hits, row.total)),
    })),
  };
};

export const getBranchAttendanceComparison = async (tenantId, query = {}) => {
  const { start, end, previousStart, previousEnd } = resolveReportRange(query);
  const services = await AttendanceService.find({
    tenantId,
    date: { $gte: start, $lte: end },
  }).sort({ date: -1 });
  const previousServices = await AttendanceService.find({
    tenantId,
    date: { $gte: previousStart, $lte: previousEnd },
  });

  const currentByBranch = new Map();
  const previousByBranch = new Map();

  const accumulate = (map, service) => {
    const branch = service.branch || 'Main Branch';
    const current = map.get(branch) || {
      branch,
      totalAttendance: 0,
      serviceCount: 0,
      lastService: null,
      topService: null,
      topServiceCount: 0,
    };

    const count = serviceTotalCount(service);
    current.totalAttendance += count;
    current.serviceCount += 1;
    if (!current.lastService || new Date(service.date) > new Date(current.lastService.date)) {
      current.lastService = service;
    }
    if (count > current.topServiceCount) {
      current.topService = service.title;
      current.topServiceCount = count;
    }
    map.set(branch, current);
  };

  services.forEach((service) => accumulate(currentByBranch, service));
  previousServices.forEach((service) => accumulate(previousByBranch, service));

  const items = [...currentByBranch.values()].map((row) => {
    const previous = previousByBranch.get(row.branch);
    const currentAverage = row.serviceCount ? row.totalAttendance / row.serviceCount : 0;
    const previousAverage = previous?.serviceCount ? previous.totalAttendance / previous.serviceCount : 0;
    const growth = previousAverage ? ((currentAverage - previousAverage) / previousAverage) * 100 : currentAverage ? 100 : 0;

    return {
      branch: row.branch,
      averageAttendance: Number(currentAverage.toFixed(1)),
      lastService: row.lastService ? formatLongDate(new Date(row.lastService.date)) : 'N/A',
      growth: formatSignedPercentage(growth),
      topService: row.topService || 'N/A',
      _score: currentAverage,
    };
  });

  const bestPerformer = [...items].sort((a, b) => b._score - a._score)[0];

  return {
    items: items.map(({ _score, ...item }) => item),
    bestPerformer: bestPerformer
      ? {
          branch: bestPerformer.branch,
          summary: `${bestPerformer.branch} is averaging ${bestPerformer.averageAttendance} attendees per service.`,
        }
      : null,
  };
};

export const getMemberAttendanceReport = async (tenantId, memberId, query = {}) => {
  const member = await getMemberOrThrow(tenantId, memberId);
  const { start, end } = resolveReportRange(query);
  const historyStart = new Date(start.getFullYear(), start.getMonth() - 5, 1);

  const [services, records] = await Promise.all([
    getPastServiceSequence(tenantId, { from: historyStart, to: end }),
    AttendanceRecord.find({
      tenantId,
      memberId: member.memberId,
      serviceDate: { $gte: historyStart, $lte: end },
      isRemoved: false,
    }).sort({ serviceDate: -1 }),
  ]);

  const attendedServiceIds = new Set(records.map((record) => record.serviceId));
  const filteredServices = services.filter((service) => {
    const serviceDate = new Date(service.date);
    return serviceDate >= start && serviceDate <= end;
  });
  const filteredAttendedIds = new Set(
    records
      .filter((record) => {
        const serviceDate = new Date(record.serviceDate);
        return serviceDate >= start && serviceDate <= end;
      })
      .map((record) => record.serviceId),
  );

  const { streak } = computeStreaks(services, attendedServiceIds);

  return {
    memberId: member.memberId,
    attendanceRate: formatPercentage(
      filteredServices.length ? percentage(filteredAttendedIds.size, filteredServices.length) : 0,
    ),
    streak,
    calendar: buildCalendarStatuses(services, attendedServiceIds, 6),
    history: records.map((record) => ({
      serviceId: record.serviceId,
      title: record.serviceTitle || 'Service',
      date: formatLongDate(new Date(record.serviceDate)),
      status: 'Attended',
      method: record.checkInMethod,
    })),
  };
};

export const getAbsentees = async (tenantId, query = {}) => {
  const branches = normalizeBranchList(query.branches || query.branch);
  const department = normalizeString(query.department);
  const search = normalizeString(query.search);
  const missedCountThreshold = Math.max(Number(query.missedCount) || 2, 1);

  const latestServices = await AttendanceService.find({
    tenantId,
    checkInOpen: false,
    date: { $lte: endOfDay(new Date()) },
    ...(branches.length === 1
      ? { branch: branches[0] }
      : branches.length > 1
        ? { branch: { $in: branches } }
        : {}),
  })
    .sort({ date: -1 })
    .limit(8);

  if (!latestServices.length) {
    return { items: [] };
  }

  const latestServiceIds = latestServices.map((service) => service._id.toString());
  const latestNServiceIds = latestServices.slice(0, missedCountThreshold).map((service) => service._id.toString());
  const records = await AttendanceRecord.find({
    tenantId,
    serviceId: { $in: latestServiceIds },
    isRemoved: false,
    memberId: { $exists: true, $ne: null },
  }).sort({ serviceDate: -1 });

  const attendanceByMember = new Map();
  for (const record of records) {
    const bucket = attendanceByMember.get(record.memberId) || new Set();
    bucket.add(record.serviceId);
    attendanceByMember.set(record.memberId, bucket);
  }

  const memberFilters = {
    tenantId,
    isDeleted: false,
    membershipStatus: { $in: ['member', 'worker', 'leader', 'clergy'] },
    ...(branches.length === 1
      ? { branch: branches[0] }
      : branches.length > 1
        ? { branch: { $in: branches } }
        : {}),
    ...(department ? { department: { $in: [department] } } : {}),
  };

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    memberFilters.$or = [
      { firstName: regex },
      { lastName: regex },
      { phone: regex },
      { memberId: regex },
    ];
  }

  const members = await Member.find(memberFilters)
    .select('memberId firstName lastName phone photoUrl department branch')
    .sort({ firstName: 1, lastName: 1 });

  const latestAttendanceMap = findLatestAttendanceByMember(records);

  const items = members
    .map((member) => {
      const attendedServices = attendanceByMember.get(member.memberId) || new Set();
      const totalInLastEight = latestServiceIds.filter((serviceId) => attendedServices.has(serviceId)).length;
      const missedLatest = latestNServiceIds.filter((serviceId) => !attendedServices.has(serviceId)).length;

      if (totalInLastEight < 3 || missedLatest < missedCountThreshold) {
        return null;
      }

      const lastAttendance = latestAttendanceMap.get(member.memberId);
      return {
        memberId: member.memberId,
        _id: member.memberId,
        name: [member.firstName, member.lastName].filter(Boolean).join(' '),
        fullName: [member.firstName, member.lastName].filter(Boolean).join(' '),
        phone: member.phone || 'N/A',
        photoUrl: member.photoUrl,
        lastAttended: lastAttendance ? formatLongDate(new Date(lastAttendance.serviceDate)) : 'N/A',
        missedCount: missedLatest,
        department: Array.isArray(member.department) ? member.department.join(', ') : '',
      };
    })
    .filter(Boolean);

  return { items };
};

export const getPlatformAttendanceOverview = async (query = {}) => {
  const country = normalizeString(query.country);
  const planType = normalizeString(query.planType, { lowercase: true });
  const tenantFilters = {
    isActive: true,
    isSuspended: { $ne: true },
    ...(country ? { country } : {}),
    ...(planType ? { subscriptionPlan: planType } : {}),
  };

  const tenants = await Tenant.find(tenantFilters).select('tenantId churchName country subscriptionPlan');
  const tenantIds = tenants.map((tenant) => tenant.tenantId);

  if (!tenantIds.length) {
    return {
      totalChurchesReporting: 0,
      platformAverageAttendance: 0,
      mostActiveChurch: 'N/A',
      fastestGrowingChurch: 'N/A',
      trends: [],
      lines: [],
      table: [],
    };
  }

  const sixMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1);
  const services = await AttendanceService.find({
    tenantId: { $in: tenantIds },
    date: { $gte: sixMonthStart, $lte: endOfDay(new Date()) },
  }).sort({ date: 1 });

  const servicesByTenant = new Map(tenantIds.map((tenantId) => [tenantId, []]));
  for (const service of services) {
    servicesByTenant.get(service.tenantId)?.push(service);
  }

  const table = tenants
    .map((tenant) => {
      const tenantServices = servicesByTenant.get(tenant.tenantId) || [];
      if (!tenantServices.length) {
        return null;
      }

      const lastService = [...tenantServices].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      const monthlyAverage =
        tenantServices.reduce((sum, item) => sum + serviceTotalCount(item), 0) / tenantServices.length;
      const recent = tenantServices.slice(-3);
      const previous = tenantServices.slice(-6, -3);
      const recentAverage = recent.length
        ? recent.reduce((sum, item) => sum + serviceTotalCount(item), 0) / recent.length
        : 0;
      const previousAverage = previous.length
        ? previous.reduce((sum, item) => sum + serviceTotalCount(item), 0) / previous.length
        : 0;
      const growth = previousAverage ? ((recentAverage - previousAverage) / previousAverage) * 100 : recentAverage ? 100 : 0;

      return {
        churchName: tenant.churchName,
        tenantId: tenant.tenantId,
        lastServiceDate: formatLongDate(new Date(lastService.date)),
        lastCount: serviceTotalCount(lastService),
        monthlyAverage: Number(monthlyAverage.toFixed(1)),
        trend: formatTrendArrow(growth),
        _growthValue: growth,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.lastCount - a.lastCount);

  const totalChurchesReporting = table.length;
  const platformAverageAttendance = totalChurchesReporting
    ? Number((table.reduce((sum, row) => sum + row.monthlyAverage, 0) / totalChurchesReporting).toFixed(1))
    : 0;

  const mostActiveChurch = table[0]?.churchName || 'N/A';
  const fastestGrowingChurch = [...table].sort((a, b) => b._growthValue - a._growthValue)[0]?.churchName || 'N/A';

  const topFive = table.slice(0, 5);
  const trends = [];
  const lines = topFive.map((row, index) => ({
    key: `tenant_${index + 1}`,
    label: row.churchName,
    color: ['#C9A84C', '#1E2A4A', '#14b8a6', '#8b5cf6', '#f97316'][index % 5],
  }));

  for (let offset = 5; offset >= 0; offset -= 1) {
    const current = new Date(new Date().getFullYear(), new Date().getMonth() - offset, 1);
    const label = formatMonthLabel(current);
    const row = { label };

    topFive.forEach((tenantRow, index) => {
      const monthlyServices = (servicesByTenant.get(tenantRow.tenantId) || []).filter((service) => {
        const serviceDate = new Date(service.date);
        return (
          serviceDate.getFullYear() === current.getFullYear() &&
          serviceDate.getMonth() === current.getMonth()
        );
      });

      row[`tenant_${index + 1}`] = monthlyServices.reduce(
        (sum, service) => sum + serviceTotalCount(service),
        0,
      );
    });

    trends.push(row);
  }

  return {
    totalChurchesReporting,
    platformAverageAttendance,
    mostActiveChurch,
    fastestGrowingChurch,
    trends,
    lines,
    table: table.map(({ _growthValue, ...item }) => item),
  };
};
