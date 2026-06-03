import mongoose from 'mongoose';
import QRCode from 'qrcode';
import Member from './member.model.js';
import { createHttpError } from '../../utils/httpError.js';
import { autoLinkMemberToUser } from '../users/memberLink.service.js';
import { createUser } from '../users/service.js';
import { ensureDocumentBranchAccess, normalizeBranchList } from '../../utils/branchScope.js';
import MemberDiscipleship from '../pastoralCare/models/memberDiscipleship.model.js';
import User from '../users/model.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const IMPORT_LIMIT = 500;

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

const parseDate = (value) => {
  if (!value) {
    return undefined;
  }

  const nextDate = new Date(value);
  return Number.isNaN(nextDate.getTime()) ? undefined : nextDate;
};

const parseNumber = (value) => {
  if (value === null || typeof value === 'undefined' || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeString(String(item)))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => normalizeString(item))
      .filter(Boolean);
  }

  return [];
};

const normalizeChildren = (children) => {
  if (!Array.isArray(children)) {
    return [];
  }

  return children
    .map((child) => ({
      name: normalizeString(child?.name),
      dateOfBirth: parseDate(child?.dateOfBirth),
    }))
    .filter((child) => child.name);
};

const normalizeFamilyRelationships = (relationships) => {
  if (!Array.isArray(relationships)) {
    return [];
  }

  const seen = new Set();

  return relationships
    .map((relationship) => {
      const memberId = normalizeString(relationship?.memberId);
      const nextRelationship = normalizeString(relationship?.relationship);

      if (!memberId || !nextRelationship || seen.has(memberId)) {
        return null;
      }

      seen.add(memberId);
      return {
        memberId,
        relationship: nextRelationship,
      };
    })
    .filter(Boolean);
};

const FAMILY_INVERSE_MAP = {
  son: 'father',
  daughter: 'father',
  child: 'parent',
  father: 'child',
  mother: 'child',
  parent: 'child',
  wife: 'husband',
  husband: 'wife',
  spouse: 'spouse',
  brother: 'sibling',
  sister: 'sibling',
  sibling: 'sibling',
};

const inferInverseRelationship = (relationship) =>
  FAMILY_INVERSE_MAP[String(relationship || '').trim().toLowerCase()] || 'family';

const sanitizeMemberPayload = (payload = {}, { applyDefaults = false } = {}) => {
  const gpsLat = parseNumber(payload.gpsCoordinates?.lat);
  const gpsLng = parseNumber(payload.gpsCoordinates?.lng);
  const emergencyContactName = normalizeString(payload.emergencyContact?.name);
  const emergencyContactPhone = normalizeString(payload.emergencyContact?.phone);
  const emergencyContactRelationship = normalizeString(payload.emergencyContact?.relationship);

  return {
    firstName: normalizeString(payload.firstName),
    lastName: normalizeString(payload.lastName),
    otherName: normalizeString(payload.otherName),
    gender: normalizeString(payload.gender),
    dateOfBirth: parseDate(payload.dateOfBirth),
    photoUrl: normalizeString(payload.photoUrl),
    phone: normalizeString(payload.phone),
    altPhone: normalizeString(payload.altPhone),
    email: normalizeString(payload.email, { lowercase: true }),
    address: normalizeString(payload.address),
    city: normalizeString(payload.city),
    country: normalizeString(payload.country),
    gpsCoordinates:
      typeof gpsLat !== 'undefined' || typeof gpsLng !== 'undefined'
        ? {
            ...(typeof gpsLat !== 'undefined' ? { lat: gpsLat } : {}),
            ...(typeof gpsLng !== 'undefined' ? { lng: gpsLng } : {}),
          }
        : undefined,
    membershipStatus:
      normalizeString(payload.membershipStatus) || (applyDefaults ? 'member' : undefined),
    membershipDate: parseDate(payload.membershipDate),
    baptismStatus:
      normalizeString(payload.baptismStatus) || (applyDefaults ? 'not_baptised' : undefined),
    baptismDate: parseDate(payload.baptismDate),
    branch: normalizeString(payload.branch),
    department: normalizeArray(payload.department),
    ministry: normalizeString(payload.ministry),
    groupingIds: normalizeArray(payload.groupingIds),
    cell_group: normalizeString(payload.cell_group),
    salvationDate: parseDate(payload.salvationDate),
    bibleSchool:
      typeof payload.bibleSchool === 'boolean'
        ? payload.bibleSchool
        : typeof payload.bibleSchool === 'undefined'
          ? applyDefaults
            ? false
            : undefined
          : String(payload.bibleSchool).toLowerCase() === 'true',
    maritalStatus: normalizeString(payload.maritalStatus),
    spouseMemberId: normalizeString(payload.spouseMemberId),
    children: normalizeChildren(payload.children),
    familyGroupId: normalizeString(payload.familyGroupId),
    familyRelationships: normalizeFamilyRelationships(payload.familyRelationships),
    occupation: normalizeString(payload.occupation),
    employer: normalizeString(payload.employer),
    isActive:
      typeof payload.isActive === 'boolean'
        ? payload.isActive
        : typeof payload.isActive === 'undefined'
          ? applyDefaults
            ? true
            : undefined
          : String(payload.isActive).toLowerCase() === 'true',
    isDeleted:
      typeof payload.isDeleted === 'boolean'
        ? payload.isDeleted
        : typeof payload.isDeleted === 'undefined'
          ? applyDefaults
            ? false
            : undefined
          : String(payload.isDeleted).toLowerCase() === 'true',
    emergencyContact:
      emergencyContactName || emergencyContactPhone || emergencyContactRelationship
        ? {
            ...(emergencyContactName ? { name: emergencyContactName } : {}),
            ...(emergencyContactPhone ? { phone: emergencyContactPhone } : {}),
            ...(emergencyContactRelationship ? { relationship: emergencyContactRelationship } : {}),
          }
        : undefined,
    digitalCardUrl: normalizeString(payload.digitalCardUrl),
    notes: normalizeString(payload.notes),
    tags: normalizeArray(payload.tags),
    qrCode: normalizeString(payload.qrCode),
    loginUsername: normalizeString(payload.loginUsername),
    loginPhone: normalizeString(payload.loginPhone),
    loginPin: normalizeString(payload.loginPin),
  };
};

const compactObject = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (typeof value === 'undefined') {
        return false;
      }

      if (Array.isArray(value)) {
        return true;
      }

      if (value && typeof value === 'object') {
        return Object.keys(value).length > 0;
      }

      return true;
    }),
  );

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const annualDateDistance = (targetDate) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let nextOccurrence = new Date(
    startOfToday.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
  );

  if (nextOccurrence < startOfToday) {
    nextOccurrence = new Date(
      startOfToday.getFullYear() + 1,
      targetDate.getMonth(),
      targetDate.getDate(),
    );
  }

  const diffMs = nextOccurrence.getTime() - startOfToday.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
};

const countSundaysInRange = (fromDate, toDate) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  let count = 0;

  while (start <= end) {
    if (start.getDay() === 0) {
      count += 1;
    }
    start.setDate(start.getDate() + 1);
  }

  return count;
};

const buildDateFilter = (since) => ({
  $or: [
    { date: { $gte: since } },
    { createdAt: { $gte: since } },
    { attendanceDate: { $gte: since } },
    { serviceDate: { $gte: since } },
    { eventDate: { $gte: since } },
    { transactionDate: { $gte: since } },
  ],
});

const collectionCache = new Map();

const resolveCollectionName = async (collectionNames) => {
  const cacheKey = collectionNames.join('|');
  if (collectionCache.has(cacheKey)) {
    return collectionCache.get(cacheKey);
  }

  const db = mongoose.connection.db;
  if (!db) {
    return collectionNames[0];
  }

  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  const names = new Set(collections.map((collection) => collection.name));
  const selected = collectionNames.find((name) => names.has(name)) || collectionNames[0];
  collectionCache.set(cacheKey, selected);
  return selected;
};

const safeCountDocuments = async (collectionNames, filter) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return 0;
    }

    const collectionName = await resolveCollectionName(collectionNames);
    return await db.collection(collectionName).countDocuments(filter);
  } catch {
    return 0;
  }
};

const safeFindDocuments = async (collectionNames, filter) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return [];
    }

    const collectionName = await resolveCollectionName(collectionNames);
    return await db.collection(collectionName).find(filter).toArray();
  } catch {
    return [];
  }
};

const buildMemberQrData = (member, { includeName = false } = {}) => {
  const payload = {
    memberId: member.memberId,
    tenantId: member.tenantId,
    type: includeName ? 'prynova_member' : 'member',
    ...(includeName
      ? {
          name: [member.firstName, member.lastName].filter(Boolean).join(' '),
        }
      : {}),
  };

  return QRCode.toDataURL(JSON.stringify(payload));
};

const assertUniqueContactFields = async (tenantId, { phone, email }, excludeMemberId) => {
  if (phone) {
    const duplicatePhone = await Member.findOne({
      tenantId,
      phone,
      isDeleted: false,
      ...(excludeMemberId ? { memberId: { $ne: excludeMemberId } } : {}),
    }).select('memberId');

    if (duplicatePhone) {
      throw createHttpError(409, 'Phone number already exists for another member.');
    }
  }

  if (email) {
    const duplicateEmail = await Member.findOne({
      tenantId,
      email,
      isDeleted: false,
      ...(excludeMemberId ? { memberId: { $ne: excludeMemberId } } : {}),
    }).select('memberId');

    if (duplicateEmail) {
      throw createHttpError(409, 'Email already exists for another member.');
    }
  }
};

const buildMemberFilters = (tenantId, query = {}) => {
  const filters = { tenantId };
  const searchValue = normalizeString(query.search);
  const tags = normalizeArray(query.tags);
  const branches = normalizeBranchList(query.branches || query.branch);

  if (query.includeDeleted !== 'true') {
    filters.isDeleted = false;
  }

  if (searchValue) {
    const regex = new RegExp(escapeRegex(searchValue), 'i');
    filters.$or = [
      { firstName: regex },
      { lastName: regex },
      { phone: regex },
      { email: regex },
      { memberId: regex },
    ];
  }

  if (query.membershipStatus) {
    filters.membershipStatus = query.membershipStatus;
  }

  if (query.department) {
    filters.department = { $in: normalizeArray(query.department) };
  }

  if (branches.length === 1) {
    filters.branch = branches[0];
  } else if (branches.length > 1) {
    filters.branch = { $in: branches };
  }

  if (typeof query.isActive !== 'undefined') {
    filters.isActive = String(query.isActive).toLowerCase() === 'true';
  }

  if (query.gender) {
    filters.gender = query.gender;
  }

  if (query.maritalStatus) {
    filters.maritalStatus = query.maritalStatus;
  }

  if (query.baptismStatus) {
    filters.baptismStatus = query.baptismStatus;
  }

  if (query.healthStatus) {
    filters['healthScore.status'] = query.healthStatus;
  }

  if (tags.length) {
    filters.tags = { $in: tags };
  }

  const createdFrom = parseDate(query.createdFrom);
  const createdTo = parseDate(query.createdTo);
  if (createdFrom || createdTo) {
    filters.createdAt = {
      ...(createdFrom ? { $gte: createdFrom } : {}),
      ...(createdTo ? { $lte: createdTo } : {}),
    };
  }

  return filters;
};

const getMemberOrThrow = async (tenantId, memberId, { includeDeleted = false, user } = {}) => {
  const member = await Member.findOne({
    tenantId,
    memberId,
    ...(includeDeleted ? {} : { isDeleted: false }),
  });

  if (!member) {
    throw createHttpError(404, 'Member not found');
  }

  ensureDocumentBranchAccess(user, member.branch, 'You do not have access to this member branch.');

  return member;
};

const hydrateMemberFamilyRelationships = async (tenantId, memberDocument) => {
  if (!memberDocument) {
    return memberDocument;
  }

  const member = memberDocument.toObject ? memberDocument.toObject() : memberDocument;
  const relationships = Array.isArray(member.familyRelationships) ? member.familyRelationships : [];

  const actorIds = [member.createdBy, member.updatedBy].filter(Boolean);
  const [relatedMembers, actors] = await Promise.all([
    relationships.length
      ? Member.find({
          tenantId,
          memberId: { $in: relationships.map((item) => item.memberId) },
          isDeleted: false,
        }).select('memberId firstName lastName otherName photoUrl branch ministry')
      : [],
    actorIds.length
      ? User.find({ tenantId, _id: { $in: actorIds } }).select('fullName username').lean()
      : [],
  ]);

  const relatedLookup = new Map(
    relatedMembers.map((item) => [
      item.memberId,
      {
        memberId: item.memberId,
        name: [item.firstName, item.otherName, item.lastName].filter(Boolean).join(' '),
        photoUrl: item.photoUrl,
        branch: item.branch,
        ministry: item.ministry,
      },
    ]),
  );

  const actorLookup = new Map(
    actors.map((actor) => [String(actor._id), actor.fullName || actor.username || String(actor._id)]),
  );

  return {
    ...member,
    createdByName: actorLookup.get(String(member.createdBy || '')) || member.createdBy,
    updatedByName: actorLookup.get(String(member.updatedBy || '')) || member.updatedBy,
    linkedFamilyMembers: relationships
      .map((relationship) => ({
        ...relationship,
        relatedMember: relatedLookup.get(relationship.memberId) || null,
      }))
      .filter((relationship) => relationship.relatedMember),
  };
};

const syncFamilyRelationships = async (
  tenantId,
  member,
  nextRelationships = [],
  previousRelationships = member.familyRelationships,
) => {
  const safePreviousRelationships = Array.isArray(previousRelationships)
    ? previousRelationships
    : [];
  const previousIds = safePreviousRelationships.map((item) => item.memberId);
  const nextIds = nextRelationships.map((item) => item.memberId);
  const affectedIds = [...new Set([...previousIds, ...nextIds])];

  if (!affectedIds.length) {
    return;
  }

  const relatedMembers = await Member.find({
    tenantId,
    memberId: { $in: affectedIds },
    isDeleted: false,
  });
  const nextMap = new Map(nextRelationships.map((item) => [item.memberId, item.relationship]));

  await Promise.all(
    relatedMembers.map(async (relatedMember) => {
      const existing = Array.isArray(relatedMember.familyRelationships)
        ? relatedMember.familyRelationships.filter((item) => item.memberId !== member.memberId)
        : [];

      if (nextMap.has(relatedMember.memberId)) {
        existing.push({
          memberId: member.memberId,
          relationship: inferInverseRelationship(nextMap.get(relatedMember.memberId)),
        });
      }

      relatedMember.familyRelationships = existing;
      await relatedMember.save();
    }),
  );
};

const calculateAttendanceScore = async (tenantId, memberId, sinceDate) => {
  const expectedServices = Math.max(countSundaysInRange(sinceDate, new Date()), 1);
  const attendanceFilter = {
    tenantId,
    memberId,
    isDeleted: { $ne: true },
    $and: [
      buildDateFilter(sinceDate),
      {
        $or: [
          { status: 'present' },
          { status: 'attended' },
          { status: 'checked_in' },
          { isPresent: true },
          { present: true },
          { status: { $exists: false } },
        ],
      },
    ],
  };
  const attendedServices = await safeCountDocuments(
    ['attendance_records', 'attendances', 'attendance'],
    attendanceFilter,
  );
  const attendanceRate = Math.min(attendedServices / expectedServices, 1);
  return Number((attendanceRate * 30).toFixed(2));
};

const buildWeekKey = (value) => {
  const date = new Date(value);
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const diff = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return `${date.getUTCFullYear()}-${Math.floor(diff / 7)}`;
};

const calculateGivingScore = async (tenantId, memberId, sinceDate) => {
  const givingRecords = await safeFindDocuments(
    ['finance_records', 'finances', 'transactions', 'giving_records'],
    {
      tenantId,
      memberId,
      isDeleted: { $ne: true },
      $and: [
        buildDateFilter(sinceDate),
        {
          $or: [
            { category: { $in: ['tithe', 'tithes', 'offering', 'offerings', 'giving'] } },
            { type: { $in: ['tithe', 'tithes', 'offering', 'offerings', 'giving'] } },
            { purpose: { $in: ['tithe', 'tithes', 'offering', 'offerings', 'giving'] } },
            { category: { $exists: false } },
            { type: { $exists: false } },
          ],
        },
      ],
    },
  );

  if (!givingRecords.length) {
    return 12;
  }

  const givingWeeks = new Set(
    givingRecords
      .map((record) => record.date || record.transactionDate || record.createdAt)
      .filter(Boolean)
      .map(buildWeekKey),
  );

  if (givingWeeks.size >= 8) {
    return 25;
  }

  if (givingWeeks.size >= 4) {
    return 15;
  }

  if (givingWeeks.size >= 1) {
    return 8;
  }

  return 12;
};

const calculateParticipationScore = async (tenantId, memberId, sinceDate) => {
  const totalEvents = await safeCountDocuments(['events', 'church_events'], {
    tenantId,
    isDeleted: { $ne: true },
    $and: [buildDateFilter(sinceDate)],
  });

  if (!totalEvents) {
    return 0;
  }

  const attendedEvents = await safeCountDocuments(
    ['event_attendances', 'event_attendance', 'event_attendees'],
    {
      tenantId,
      memberId,
      isDeleted: { $ne: true },
      $and: [
        buildDateFilter(sinceDate),
        {
          $or: [
            { status: 'present' },
            { status: 'attended' },
            { status: 'checked_in' },
            { isPresent: true },
            { status: { $exists: false } },
          ],
        },
      ],
    },
  );

  const participationRate = Math.min(attendedEvents / totalEvents, 1);
  return Number((participationRate * 25).toFixed(2));
};

const calculateInvolvementScore = async (tenantId, memberId, member) => {
  let score = 0;

  if (Array.isArray(member.department) && member.department.length) {
    score += 8;
  }

  if (member.cell_group) {
    score += 6;
  }

  const isVolunteer =
    ['worker', 'leader', 'clergy'].includes(member.membershipStatus) ||
    (Array.isArray(member.tags) && member.tags.some((tag) => String(tag).toLowerCase() === 'volunteer'));

  if (isVolunteer) {
    score += 6;
  }

  const discipleshipEnrollments = await MemberDiscipleship.find({
    tenantId,
    memberId,
  }).select('status');

  if (discipleshipEnrollments.some((enrollment) => enrollment.status === 'active')) {
    score += 5;
  }

  // Completed track bonus is granted once even if the member has multiple completed tracks.
  if (discipleshipEnrollments.some((enrollment) => enrollment.status === 'completed')) {
    score += 5;
  }

  return Math.min(score, 30);
};

const determineHealthStatus = ({ overall, hasActivity, isNewMember }) => {
  if (!hasActivity && isNewMember) {
    return 'new';
  }

  if (overall >= 75) {
    return 'active';
  }

  if (overall >= 50) {
    return 'drifting';
  }

  if (overall >= 25) {
    return 'at_risk';
  }

  if (overall >= 1) {
    return 'inactive';
  }

  return isNewMember ? 'new' : 'inactive';
};

export const createMember = async (tenantId, data, createdBy) => {
  const payload = compactObject(sanitizeMemberPayload(data, { applyDefaults: true }));

  if (!payload.firstName || !payload.lastName) {
    throw createHttpError(400, 'First name and last name are required.');
  }

  await assertUniqueContactFields(tenantId, payload);

  const memberId = await Member.generateNextMemberId(tenantId);
  const member = new Member({
    ...payload,
    tenantId,
    memberId,
    createdBy,
    updatedBy: createdBy,
  });

  member.qrCode = await buildMemberQrData(member);
  await member.save();
  await syncFamilyRelationships(tenantId, member, payload.familyRelationships || []);
  await autoLinkMemberToUser(member);

  if (payload.loginUsername && payload.loginPin) {
    await createUser({
      tenantId,
      username: payload.loginUsername,
      pin: payload.loginPin,
      role: 'member',
      fullName: [member.firstName, member.otherName, member.lastName].filter(Boolean).join(' '),
      email: member.email,
      phone: payload.loginPhone || member.phone,
      memberId: member.memberId,
      photoUrl: member.photoUrl,
    });
  }

  return hydrateMemberFamilyRelationships(tenantId, member);
};

export const getAllMembers = async (tenantId, query = {}) => {
  const page = Math.max(Number(query.page) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(Number(query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;
  const filters = buildMemberFilters(tenantId, query);

  const [members, total, active, inactive, newCount] = await Promise.all([
    Member.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Member.countDocuments(filters),
    Member.countDocuments({ tenantId, isDeleted: false, isActive: true }),
    Member.countDocuments({ tenantId, isDeleted: false, isActive: false }),
    Member.countDocuments({ tenantId, isDeleted: false, 'healthScore.status': 'new' }),
  ]);

  return {
    members,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    stats: {
      active,
      inactive,
      new: newCount,
    },
  };
};

export const searchMembers = async (tenantId, query = {}) => {
  return getAllMembers(tenantId, query);
};

export const getMemberById = async (tenantId, memberId, user) => {
  const member = await getMemberOrThrow(tenantId, memberId, { user });
  return hydrateMemberFamilyRelationships(tenantId, member);
};

export const updateMember = async (tenantId, memberId, data, updatedBy, user) => {
  const member = await getMemberOrThrow(tenantId, memberId, { user });
  const previousFamilyRelationships = Array.isArray(member.familyRelationships)
    ? member.familyRelationships.map((item) => ({ ...item }))
    : [];
  const payload = compactObject(sanitizeMemberPayload(data));

  if (payload.phone || payload.email) {
    await assertUniqueContactFields(tenantId, payload, memberId);
  }

  Object.assign(member, payload, { updatedBy });
  await member.save();
  await syncFamilyRelationships(
    tenantId,
    member,
    payload.familyRelationships || member.familyRelationships,
    previousFamilyRelationships,
  );
  await autoLinkMemberToUser(member);
  return hydrateMemberFamilyRelationships(tenantId, member);
};

export const updateMemberPhoto = async (tenantId, memberId, photoUrl, updatedBy, user) => {
  if (!photoUrl) {
    throw createHttpError(400, 'Photo URL is required.');
  }

  return updateMember(tenantId, memberId, { photoUrl }, updatedBy, user);
};

export const softDeleteMember = async (tenantId, memberId, updatedBy, user) => {
  const member = await getMemberOrThrow(tenantId, memberId, { user });
  member.isDeleted = true;
  member.isActive = false;
  member.updatedBy = updatedBy;
  await member.save();
  return member;
};

export const restoreMember = async (tenantId, memberId, updatedBy, user) => {
  const member = await getMemberOrThrow(tenantId, memberId, { includeDeleted: true, user });
  await assertUniqueContactFields(
    tenantId,
    { phone: member.phone, email: member.email },
    memberId,
  );
  member.isDeleted = false;
  member.isActive = true;
  member.updatedBy = updatedBy;
  await member.save();
  await autoLinkMemberToUser(member);
  return member;
};

export const getMemberStats = async (tenantId, query = {}) => {
  const branches = normalizeBranchList(query.branches || query.branch);
  const branchFilter =
    branches.length === 1 ? { branch: branches[0] } : branches.length > 1 ? { branch: { $in: branches } } : {};
  const baseFilters = { tenantId, isDeleted: false, ...branchFilter };
  const members = await Member.find(baseFilters)
    .select(
      'memberId firstName lastName photoUrl membershipStatus gender baptismStatus maritalStatus dateOfBirth createdAt membershipDate isActive healthScore',
    )
    .sort({ createdAt: -1 });

  const total = members.length;
  const active = members.filter((member) => member.isActive !== false).length;
  const inactive = members.filter((member) => member.isActive === false).length;
  const deleted = await Member.countDocuments({ tenantId, isDeleted: true, ...branchFilter });

  const summarize = (values, allowedValues) =>
    allowedValues.reduce(
      (accumulator, key) => ({
        ...accumulator,
        [key]: values.filter((value) => value === key).length,
      }),
      {},
    );

  const byMembershipStatus = summarize(
    members.map((member) => member.membershipStatus),
    ['visitor', 'new_convert', 'member', 'worker', 'leader', 'clergy'],
  );
  const byGender = summarize(
    members.map((member) => member.gender),
    ['male', 'female', 'other'],
  );
  const byBaptismStatus = summarize(
    members.map((member) => member.baptismStatus),
    ['not_baptised', 'water', 'holy_spirit', 'both'],
  );
  const byHealthStatus = summarize(
    members.map((member) => member.healthScore?.status),
    ['active', 'drifting', 'at_risk', 'inactive', 'new'],
  );

  const recentlyJoined = await Member.find(baseFilters)
    .sort({ membershipDate: -1, createdAt: -1 })
    .limit(5);

  const birthdays = members
    .filter((member) => member.dateOfBirth && annualDateDistance(member.dateOfBirth) <= 7)
    .slice(0, 10);

  return {
    total,
    active,
    inactive,
    deleted,
    byMembershipStatus,
    byGender,
    byBaptismStatus,
    byHealthStatus,
    recentlyJoined,
    birthdays,
    anniversaries: [],
  };
};

export const recalculateHealthScore = async (tenantId, memberId, user) => {
  const member = await getMemberOrThrow(tenantId, memberId, { includeDeleted: false, user });
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 90);

  let attendance = 0;
  let giving = 12;
  let participation = 0;
  let involvement = 0;

  try {
    attendance = await calculateAttendanceScore(tenantId, memberId, sinceDate);
  } catch {
    attendance = 0;
  }

  try {
    giving = await calculateGivingScore(tenantId, memberId, sinceDate);
  } catch {
    giving = 12;
  }

  try {
    participation = await calculateParticipationScore(tenantId, memberId, sinceDate);
  } catch {
    participation = 0;
  }

  try {
    involvement = await calculateInvolvementScore(tenantId, memberId, member);
  } catch {
    involvement = 0;
  }

  const overall = Math.round(attendance + giving + participation + involvement);
  const isNewMember =
    member.createdAt && Date.now() - new Date(member.createdAt).getTime() <= 30 * 24 * 60 * 60 * 1000;
  const hasActivity = attendance > 0 || participation > 0 || involvement > 0 || giving !== 12;
  const status = determineHealthStatus({ overall, hasActivity, isNewMember });

  member.healthScore = {
    overall,
    attendance,
    giving,
    participation,
    involvement,
    lastCalculated: new Date(),
    status,
  };

  await member.save();
  return member.healthScore;
};

export const bulkImportMembers = async (tenantId, membersArray, createdBy) => {
  if (!Array.isArray(membersArray)) {
    throw createHttpError(400, 'Bulk import payload must be an array.');
  }

  if (membersArray.length > IMPORT_LIMIT) {
    throw createHttpError(400, `Bulk import supports a maximum of ${IMPORT_LIMIT} rows.`);
  }

  const normalizedRows = membersArray.map((row, index) => ({
    row: index + 1,
    payload: compactObject(sanitizeMemberPayload(row, { applyDefaults: true })),
  }));

  const phoneValues = normalizedRows.map(({ payload }) => payload.phone).filter(Boolean);
  const emailValues = normalizedRows.map(({ payload }) => payload.email).filter(Boolean);
  const [existingPhones, existingEmails, totalMembers] = await Promise.all([
    phoneValues.length
      ? Member.find({ tenantId, phone: { $in: phoneValues }, isDeleted: false }).select('phone')
      : [],
    emailValues.length
      ? Member.find({ tenantId, email: { $in: emailValues }, isDeleted: false }).select('email')
      : [],
    Member.countDocuments({ tenantId }),
  ]);

  const reservedPhones = new Set(existingPhones.map((member) => member.phone));
  const reservedEmails = new Set(existingEmails.map((member) => member.email));
  const errors = [];
  const documents = [];

  for (const { row, payload } of normalizedRows) {
    if (!payload.firstName || !payload.lastName) {
      errors.push({ row, reason: 'First name and last name are required.' });
      continue;
    }

    if (payload.phone && reservedPhones.has(payload.phone)) {
      errors.push({ row, reason: 'Phone number already exists.' });
      continue;
    }

    if (payload.email && reservedEmails.has(payload.email)) {
      errors.push({ row, reason: 'Email already exists.' });
      continue;
    }

    if (payload.phone) {
      reservedPhones.add(payload.phone);
    }

    if (payload.email) {
      reservedEmails.add(payload.email);
    }

    const memberId = `${tenantId}-${String(totalMembers + documents.length + 1).padStart(6, '0')}`;
    const qrCode = await buildMemberQrData({
      tenantId,
      memberId,
      firstName: payload.firstName,
      lastName: payload.lastName,
    });

    documents.push({
      ...payload,
      tenantId,
      memberId,
      qrCode,
      createdBy,
      updatedBy: createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  let insertedCount = 0;

  if (documents.length) {
    try {
      const inserted = await Member.insertMany(documents, { ordered: false });
      insertedCount = inserted.length;
      await Promise.all(inserted.map((member) => autoLinkMemberToUser(member)));
    } catch (error) {
      insertedCount = error.insertedDocs?.length || 0;
      if (Array.isArray(error.insertedDocs) && error.insertedDocs.length) {
        await Promise.all(error.insertedDocs.map((member) => autoLinkMemberToUser(member)));
      }
      if (Array.isArray(error.writeErrors)) {
        error.writeErrors.forEach((writeError) => {
          errors.push({
            row: writeError.index + 1,
            reason: writeError.errmsg || 'Bulk import failed for this row.',
          });
        });
      }
    }
  }

  return {
    imported: insertedCount,
    failed: membersArray.length - insertedCount,
    errors,
  };
};

export const getMembersByHealthStatus = async (tenantId, query = {}) => {
  const page = Math.max(Number(query.page) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(Number(query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;
  const filters = {
    tenantId,
    isDeleted: false,
    ...(query.status ? { 'healthScore.status': query.status } : {}),
  };

  const [members, total] = await Promise.all([
    Member.find(filters)
      .select('memberId firstName lastName photoUrl phone healthScore updatedAt')
      .sort({ 'healthScore.overall': 1, lastName: 1, firstName: 1 })
      .skip(skip)
      .limit(limit),
    Member.countDocuments(filters),
  ]);

  return {
    members: members.map((member) => ({
      memberId: member.memberId,
      fullName: [member.firstName, member.lastName].filter(Boolean).join(' '),
      photoUrl: member.photoUrl,
      phone: member.phone,
      healthScore: member.healthScore,
      lastCalculated: member.healthScore?.lastCalculated,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getMemberQrCode = async (tenantId, memberId) => {
  const member = await getMemberOrThrow(tenantId, memberId);
  const qrCode = await buildMemberQrData(member, { includeName: true });

  if (!member.qrCode) {
    member.qrCode = qrCode;
    await member.save();
  }

  return qrCode;
};

export const exportMembers = async (tenantId, query = {}) => {
  const filters = buildMemberFilters(tenantId, { ...query, page: undefined, limit: undefined });
  const members = await Member.find(filters).sort({ lastName: 1, firstName: 1 });
  return members.map((member) => member.toObject());
};

export const getFamilyGroup = async (tenantId, familyGroupId) => {
  if (!familyGroupId) {
    throw createHttpError(400, 'Family group ID is required.');
  }

  const members = await Member.find({
    tenantId,
    familyGroupId,
    isDeleted: false,
  }).sort({ lastName: 1, firstName: 1 });

  return {
    familyGroupId,
    members,
  };
};
