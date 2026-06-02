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
