import { createHttpError } from '../utils/httpError.js';

const tenantScope = (req, res, next) => {
  if (!req.user) {
    return next(createHttpError(401, 'Authentication is required before tenant scoping.'));
  }

  if (req.user.role === 'super_admin') {
    return next();
  }

  const jwtTenantId = req.user.tenantId;
  const requestTenantIds = [
    req.params?.tenantId,
    req.body?.tenantId,
    req.query?.tenantId,
    req.headers['x-tenant-id'],
  ].filter(Boolean);

  if (requestTenantIds.some((tenantId) => tenantId !== jwtTenantId)) {
    return next(createHttpError(403, 'Cross-tenant access is forbidden.'));
  }

  req.tenantId = jwtTenantId;

  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    req.body.tenantId = jwtTenantId;
  }

  return next();
};

export default tenantScope;
