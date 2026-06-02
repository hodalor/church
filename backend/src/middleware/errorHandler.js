import { error as errorResponse } from '../utils/apiResponse.js';

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((validationError) => validationError.message)
      .join(', ');
  }

  if (err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    message = `${duplicateField} already exists`;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  return errorResponse(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? err.stack : undefined,
  );
};

export default errorHandler;
