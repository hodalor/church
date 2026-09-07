import logger from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    logger.info({
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${Date.now() - start}ms`,
      tenantId: req.user?.tenantId || 'unauthenticated',
      userId: req.user?.userId || null,
    });
  });

  next();
};
