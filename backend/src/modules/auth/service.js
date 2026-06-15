import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import env from '../../config/env.js';
import { createAccessToken, createRefreshToken } from '../../utils/generateToken.js';
import { comparePin } from '../../utils/pinHelper.js';
import { createHttpError } from '../../utils/httpError.js';
import Tenant from '../tenants/model.js';
import User from '../users/model.js';
import { autoLinkUserToMember } from '../users/memberLink.service.js';
import { resolveTenantCapabilities, resolveUserCapabilities } from '../access/capabilities.js';
import RefreshToken from './refreshToken.model.js';
import { normalizeBranchList } from '../../utils/branchScope.js';
import { logAudit } from '../../utils/auditLogger.js';

const REFRESH_TOKEN_SALT_ROUNDS = 10;

const hashRefreshToken = async (refreshToken) => bcrypt.hash(refreshToken, REFRESH_TOKEN_SALT_ROUNDS);

const buildAuthPayload = ({ user, tenantCapabilities }) => {
  const capabilities = resolveUserCapabilities({
    role: user.role,
    capabilities: user.capabilities,
    tenantCapabilities,
  });

  return {
    userId: user._id.toString(),
    tenantId: user.tenantId,
    username: user.username,
    role: user.role,
    memberId: user.memberId,
    capabilities,
    allBranches: user.allBranches !== false,
    assignedBranches: user.allBranches === false ? normalizeBranchList(user.assignedBranches) : [],
  };
};

const saveRefreshTokenDocument = async ({ refreshToken, userId, tenantId }) => {
  const decodedRefreshToken = jwt.decode(refreshToken);
  const expiresAt = decodedRefreshToken?.exp
    ? new Date(decodedRefreshToken.exp * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const hashedToken = await hashRefreshToken(refreshToken);

  return RefreshToken.create({
    userId,
    tenantId,
    token: hashedToken,
    expiresAt,
  });
};

const logAuthAudit = ({
  tenantId,
  userId,
  userName,
  userRole,
  action,
  description,
  req,
  statusCode,
}) => {
  if (!tenantId) {
    return;
  }

  logAudit({
    tenantId,
    userId,
    userName,
    userRole,
    action,
    module: 'auth',
    entityType: 'User',
    entityId: userId,
    entityName: userName,
    description,
    req,
    statusCode,
  });
};

export const loginService = async ({ tenantId, username, pin }, req) => {
  const normalizedTenantId = tenantId.trim().toLowerCase();
  const normalizedUsername = username.trim();

  const tenant = await Tenant.findOne({ tenantId: normalizedTenantId });
  if (!tenant) {
    logAuthAudit({
      tenantId: normalizedTenantId,
      userName: normalizedUsername,
      action: 'LOGIN_FAILED',
      description: `Failed login attempt for ${normalizedUsername}: tenant not found`,
      req,
      statusCode: 404,
    });
    throw createHttpError(404, 'Tenant not found');
  }

  if (!tenant.isActive || tenant.isSuspended) {
    logAuthAudit({
      tenantId: normalizedTenantId,
      userName: normalizedUsername,
      action: 'LOGIN_FAILED',
      description: `Failed login attempt for ${normalizedUsername}: account suspended`,
      req,
      statusCode: 403,
    });
    throw createHttpError(403, 'Account suspended');
  }

  const user = await User.findOne({
    tenantId: normalizedTenantId,
    $or: [{ username: normalizedUsername }, { phone: normalizedUsername }],
  });

  if (!user) {
    logAuthAudit({
      tenantId: normalizedTenantId,
      userName: normalizedUsername,
      action: 'LOGIN_FAILED',
      description: `Failed login attempt for ${normalizedUsername}: invalid user`,
      req,
      statusCode: 401,
    });
    throw createHttpError(401, 'Invalid credentials');
  }

  if (!user.isActive) {
    logAuthAudit({
      tenantId: normalizedTenantId,
      userId: user._id.toString(),
      userName: user.fullName || user.username,
      userRole: user.role,
      action: 'LOGIN_FAILED',
      description: `Failed login attempt for ${user.username}: user inactive`,
      req,
      statusCode: 403,
    });
    throw createHttpError(403, 'User account is inactive');
  }

  await autoLinkUserToMember({ user });

  const isPinValid = await comparePin(pin, user.pinHash);
  if (!isPinValid) {
    logAuthAudit({
      tenantId: normalizedTenantId,
      userId: user._id.toString(),
      userName: user.fullName || user.username,
      userRole: user.role,
      action: 'LOGIN_FAILED',
      description: `Failed login attempt for ${user.username}: invalid PIN`,
      req,
      statusCode: 401,
    });
    throw createHttpError(401, 'Invalid credentials');
  }

  user.lastLogin = new Date();
  await user.save();

  const tenantCapabilities = resolveTenantCapabilities(tenant);
  const payload = buildAuthPayload({ user, tenantCapabilities });
  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);

  await saveRefreshTokenDocument({
    refreshToken,
    userId: user._id,
    tenantId: user.tenantId,
  });

  logAuthAudit({
    tenantId: user.tenantId,
    userId: user._id.toString(),
    userName: user.fullName || user.username,
    userRole: user.role,
    action: 'LOGIN',
    description: `${user.fullName || user.username} signed in successfully`,
    req,
    statusCode: 200,
  });

  return {
    accessToken,
    refreshToken,
    churchName: tenant.churchName,
    country: tenant.country || null,
    countryCode: tenant.countryCode || null,
    tenantBranding: tenant.branding || null,
    tenantContent: tenant.content || null,
    tenantFinancial: tenant.financial || null,
    platformConfig: user.role === 'super_admin' ? tenant.platformConfig || null : null,
    user: {
      userId: user._id,
      tenantId: user.tenantId,
      username: user.username,
      role: user.role,
      memberId: user.memberId,
      fullName: user.fullName,
      photoUrl: user.photoUrl,
      capabilities: payload.capabilities,
      allBranches: payload.allBranches,
      assignedBranches: payload.assignedBranches,
    },
  };
};

export const refreshTokenService = async ({ refreshToken }) => {
  let decoded;

  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw createHttpError(401, error.name === 'TokenExpiredError' ? 'Refresh token expired' : 'Invalid refresh token');
  }

  const storedTokens = await RefreshToken.find({
    userId: decoded.userId,
    tenantId: decoded.tenantId,
  }).sort({ createdAt: -1 });

  const matchingToken = await (async () => {
    for (const storedToken of storedTokens) {
      // Refresh tokens are persisted hashed and verified with bcrypt.
      const matches = await bcrypt.compare(refreshToken, storedToken.token);
      if (matches) {
        return storedToken;
      }
    }
    return null;
  })();

  if (!matchingToken) {
    throw createHttpError(401, 'Invalid refresh token');
  }

  if (matchingToken.expiresAt.getTime() <= Date.now()) {
    await matchingToken.deleteOne();
    throw createHttpError(401, 'Refresh token expired');
  }

  await matchingToken.deleteOne();

  const [user, tenant] = await Promise.all([
    User.findById(decoded.userId),
    Tenant.findOne({ tenantId: decoded.tenantId }),
  ]);

  if (!user || !tenant) {
    throw createHttpError(401, 'Session is no longer valid');
  }

  const payload = buildAuthPayload({
    user,
    tenantCapabilities: resolveTenantCapabilities(tenant),
  });

  const nextAccessToken = createAccessToken(payload);
  const nextRefreshToken = createRefreshToken(payload);

  await saveRefreshTokenDocument({
    refreshToken: nextRefreshToken,
    userId: decoded.userId,
    tenantId: decoded.tenantId,
  });

  return {
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken,
  };
};

export const logoutService = async ({ userId, tenantId, username, role }, req) => {
  await RefreshToken.deleteMany({ userId });

  logAuthAudit({
    tenantId,
    userId,
    userName: username,
    userRole: role,
    action: 'LOGOUT',
    description: `${username || 'User'} logged out`,
    req,
    statusCode: 200,
  });

  return { success: true };
};

export const getMeService = async ({ userId }) => {
  const user = await User.findById(userId).select('-pinHash');
  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const tenant = await Tenant.findOne({ tenantId: user.tenantId });
  const tenantCapabilities = resolveTenantCapabilities(tenant);

  return {
    ...user.toObject(),
    capabilities: resolveUserCapabilities({
      role: user.role,
      capabilities: user.capabilities,
      tenantCapabilities,
    }),
    allBranches: user.allBranches !== false,
    assignedBranches: user.allBranches === false ? normalizeBranchList(user.assignedBranches) : [],
    tenant: tenant
      ? {
          ...tenant.toObject(),
          capabilities: tenantCapabilities,
          financial: tenant.financial || null,
          platformConfig: tenant.platformConfig || null,
        }
      : null,
  };
};

export const updateFcmTokenService = async ({ userId }, fcmToken) => {
  const user = await User.findById(userId);
  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  user.fcmToken = fcmToken ? String(fcmToken).trim() : undefined;
  await user.save();

  return {
    userId: user._id,
    fcmToken: user.fcmToken || null,
  };
};
