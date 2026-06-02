import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { createHttpError } from '../utils/httpError.js';

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(createHttpError(401, 'Authorization token is required.'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(createHttpError(401, 'Token expired'));
    }

    return next(createHttpError(401, 'Invalid token'));
  }
};

export default auth;
