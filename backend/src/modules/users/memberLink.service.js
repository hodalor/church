import Member from '../members/member.model.js';
import User from './model.js';

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

const buildNameVariants = (fullName) => {
  const normalizedFullName = normalizeString(fullName);
  if (!normalizedFullName) {
    return [];
  }

  const parts = normalizedFullName.split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return [];
  }

  const firstName = parts[0];
  const lastName = parts.length > 1 ? parts[parts.length - 1] : undefined;

  return [
    {
      firstName: new RegExp(`^${escapeRegex(firstName)}$`, 'i'),
      ...(lastName ? { lastName: new RegExp(`^${escapeRegex(lastName)}$`, 'i') } : {}),
    },
  ];
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildMemberMatchQuery = ({ tenantId, memberId, email, phone, fullName }) => {
  const normalizedMemberId = normalizeString(memberId);
  const normalizedEmail = normalizeString(email, { lowercase: true });
  const normalizedPhone = normalizeString(phone);
  const nameVariants = buildNameVariants(fullName);
  const orConditions = [];

  if (normalizedMemberId) {
    orConditions.push({ memberId: normalizedMemberId });
  }

  if (normalizedEmail) {
    orConditions.push({ email: normalizedEmail });
  }

  if (normalizedPhone) {
    orConditions.push({ phone: normalizedPhone });
  }

  orConditions.push(...nameVariants);

  if (!orConditions.length) {
    return null;
  }

  return {
    tenantId,
    isDeleted: false,
    $or: orConditions,
  };
};

const buildUserMatchQuery = ({ tenantId, memberId, email, phone, fullName }) => {
  const normalizedMemberId = normalizeString(memberId);
  const normalizedEmail = normalizeString(email, { lowercase: true });
  const normalizedPhone = normalizeString(phone);
  const normalizedFullName = normalizeString(fullName);
  const orConditions = [];

  if (normalizedMemberId) {
    orConditions.push({ memberId: normalizedMemberId });
  }

  if (normalizedEmail) {
    orConditions.push({ email: normalizedEmail });
  }

  if (normalizedPhone) {
    orConditions.push({ phone: normalizedPhone });
  }

  if (normalizedFullName) {
    orConditions.push({ fullName: new RegExp(`^${escapeRegex(normalizedFullName)}$`, 'i') });
  }

  if (!orConditions.length) {
    return null;
  }

  return {
    tenantId,
    $or: orConditions,
  };
};

export const linkUserToMember = async (user, member) => {
  if (!user || !member) {
    return null;
  }

  const nextFullName =
    user.fullName || [member.firstName, member.lastName].filter(Boolean).join(' ') || undefined;

  user.memberId = member.memberId;
  if (!user.fullName && nextFullName) {
    user.fullName = nextFullName;
  }
  if (!user.email && member.email) {
    user.email = member.email;
  }
  if (!user.phone && member.phone) {
    user.phone = member.phone;
  }
  if (!user.photoUrl && member.photoUrl) {
    user.photoUrl = member.photoUrl;
  }

  await user.save();
  return user;
};

export const autoLinkUserToMember = async ({
  user,
  memberId,
  email,
  phone,
  fullName,
} = {}) => {
  if (!user) {
    return null;
  }

  if (user.memberId) {
    const existingMember = await Member.findOne({
      tenantId: user.tenantId,
      memberId: user.memberId,
      isDeleted: false,
    });

    if (existingMember) {
      return user;
    }
  }

  const query = buildMemberMatchQuery({
    tenantId: user.tenantId,
    memberId: memberId || user.memberId,
    email: email || user.email,
    phone: phone || user.phone,
    fullName: fullName || user.fullName,
  });

  if (!query) {
    return user;
  }

  const member = await Member.findOne(query).sort({ createdAt: -1, _id: -1 });
  if (!member) {
    return user;
  }

  return linkUserToMember(user, member);
};

export const autoLinkMemberToUser = async (member) => {
  if (!member || member.isDeleted) {
    return null;
  }

  const query = buildUserMatchQuery({
    tenantId: member.tenantId,
    memberId: member.memberId,
    email: member.email,
    phone: member.phone,
    fullName: [member.firstName, member.lastName].filter(Boolean).join(' '),
  });

  if (!query) {
    return null;
  }

  const user = await User.findOne(query).sort({ createdAt: -1, _id: -1 });
  if (!user) {
    return null;
  }

  return linkUserToMember(user, member);
};
