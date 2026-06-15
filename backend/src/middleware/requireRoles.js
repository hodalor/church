import { createHttpError } from '../utils/httpError.js';

const requireRoles = (...roles) => {
  const allowedRoles = new Set(roles.flat().filter(Boolean));

  return (req, _res, next) => {
    if (!req.user) {
      return next(createHttpError(401, 'Authentication is required.'));
    }

    if (!allowedRoles.has(req.user.role)) {
      return next(createHttpError(403, 'You do not have permission to perform this action.'));
    }

    return next();
  };
};

export default requireRoles;
