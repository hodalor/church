import User from './model.js';
import { hashPin } from '../../utils/pinHelper.js';
import { autoLinkUserToMember } from './memberLink.service.js';
import { createHttpError } from '../../utils/httpError.js';
import { normalizeBranchList } from '../../utils/branchScope.js';
import {
  getDefaultTenantCapabilities,
  resolveTenantCapabilities,
  resolveUserCapabilities,
} from '../access/capabilities.js';
import Tenant from '../tenants/model.js';

export const listUsers = async (tenantId) => {
  const [users, tenant] = await Promise.all([
    User.find({ tenantId }).select('-pinHash').sort({ createdAt: -1 }),
    Tenant.findOne({ tenantId }),
  ]);
  const tenantCapabilities = tenant
    ? resolveTenantCapabilities(tenant)
    : getDefaultTenantCapabilities();

  return users.map((user) => ({
    ...user.toObject(),
    capabilities: resolveUserCapabilities({
      role: user.role,
      capabilities: user.capabilities,
      tenantCapabilities,
    }),
  }));
};

const serializeUser = (user, tenantCapabilities) => ({
  ...user.toObject(),
  capabilities: resolveUserCapabilities({
    role: user.role,
    capabilities: user.capabilities,
    tenantCapabilities,
  }),
});

export const createUser = async ({
  tenantId,
  username,
  pin,
  role,
  fullName,
  email,
  phone,
  memberId,
  photoUrl,
  capabilities,
  allBranches = true,
  assignedBranches = [],
}) => {
  const tenant = await Tenant.findOne({ tenantId });
  const tenantCapabilities = tenant
    ? resolveTenantCapabilities(tenant)
    : getDefaultTenantCapabilities();
  const normalizedUsername = String(username || '').trim();
  const normalizedEmail = email ? email.trim().toLowerCase() : undefined;
  const normalizedPhone = phone ? phone.trim() : undefined;
  const [existingUsername, existingPhone] = await Promise.all([
    User.findOne({ tenantId, username: normalizedUsername }).select('_id'),
    normalizedPhone ? User.findOne({ tenantId, phone: normalizedPhone }).select('_id') : null,
  ]);

  if (existingUsername) {
    throw createHttpError(409, 'Username already exists for this tenant.');
  }

  if (existingPhone) {
    throw createHttpError(409, 'Phone number is already linked to another user.');
  }

  const pinHash = await hashPin(pin);
  const normalizedAssignedBranches = allBranches === true ? [] : normalizeBranchList(assignedBranches);
  const resolvedCapabilities = resolveUserCapabilities({
    role,
    capabilities,
    tenantCapabilities,
  });

  const user = await User.create({
    tenantId,
    username: normalizedUsername,
    pinHash,
    role,
    ...(fullName ? { fullName: fullName.trim() } : {}),
    ...(normalizedEmail ? { email: normalizedEmail } : {}),
    ...(normalizedPhone ? { phone: normalizedPhone } : {}),
    allBranches: allBranches !== false ? true : normalizedAssignedBranches.length === 0,
    assignedBranches: allBranches !== false ? [] : normalizedAssignedBranches,
    ...(memberId ? { memberId: memberId.trim() } : {}),
    ...(photoUrl ? { photoUrl: photoUrl.trim() } : {}),
    capabilities: resolvedCapabilities,
  });

  await autoLinkUserToMember({ user, memberId, email, phone, fullName });
  const freshUser = await User.findById(user._id).select('-pinHash');
  return serializeUser(freshUser || user, tenantCapabilities);
};

export const updateUser = async ({
  tenantId,
  userId,
  username,
  pin,
  role,
  fullName,
  email,
  phone,
  memberId,
  photoUrl,
  capabilities,
  allBranches,
  assignedBranches,
}) => {
  const tenant = await Tenant.findOne({ tenantId });
  const tenantCapabilities = tenant
    ? resolveTenantCapabilities(tenant)
    : getDefaultTenantCapabilities();

  const user = await User.findOne({ _id: userId, tenantId });
  if (!user) {
    throw createHttpError(404, 'User not found.');
  }

  const nextUsername = typeof username === 'string' ? username.trim() : user.username;
  const nextEmail = typeof email === 'string' ? email.trim().toLowerCase() : user.email;
  const nextPhone = typeof phone === 'string' ? phone.trim() : user.phone;

  const [existingUsername, existingPhone] = await Promise.all([
    nextUsername && nextUsername !== user.username
      ? User.findOne({ tenantId, username: nextUsername, _id: { $ne: user._id } }).select('_id')
      : null,
    nextPhone && nextPhone !== user.phone
      ? User.findOne({ tenantId, phone: nextPhone, _id: { $ne: user._id } }).select('_id')
      : null,
  ]);

  if (existingUsername) {
    throw createHttpError(409, 'Username already exists for this tenant.');
  }

  if (existingPhone) {
    throw createHttpError(409, 'Phone number is already linked to another user.');
  }

  const nextRole = role || user.role;
  const nextCapabilities = resolveUserCapabilities({
    role: nextRole,
    capabilities: capabilities ?? user.capabilities,
    tenantCapabilities,
  });
  const nextAllBranches = allBranches !== undefined ? allBranches !== false : user.allBranches !== false;
  const nextAssignedBranches = nextAllBranches
    ? []
    : normalizeBranchList(assignedBranches ?? user.assignedBranches);

  user.set({
    username: nextUsername,
    role: nextRole,
    fullName: typeof fullName === 'string' ? fullName.trim() || undefined : user.fullName,
    email: typeof email === 'string' ? nextEmail || undefined : user.email,
    phone: typeof phone === 'string' ? nextPhone || undefined : user.phone,
    allBranches: nextAllBranches || nextAssignedBranches.length === 0,
    assignedBranches: nextAllBranches ? [] : nextAssignedBranches,
    memberId: typeof memberId === 'string' ? memberId.trim() || undefined : user.memberId,
    photoUrl: typeof photoUrl === 'string' ? photoUrl.trim() || undefined : user.photoUrl,
    capabilities: nextCapabilities,
  });

  if (pin) {
    user.pinHash = await hashPin(pin);
  }

  await user.save();
  await autoLinkUserToMember({
    user,
    memberId: user.memberId,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
  });

  const freshUser = await User.findById(user._id).select('-pinHash');
  return serializeUser(freshUser || user, tenantCapabilities);
};
