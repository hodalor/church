import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { attendanceRouter, adminAttendanceRouter } from './modules/attendance/attendance.routes.js';
import env from './config/env.js';
import authRoutes from './modules/auth/routes.js';
import communicationRoutes from './modules/communication/communication.routes.js';
import financeRoutes from './modules/finance/finance.routes.js';
import memberRoutes from './modules/members/member.routes.js';
import notificationRoutes from './modules/notifications/routes.js';
import { tenantRouter, adminTenantRouter } from './modules/tenants/routes.js';
import userRoutes from './modules/users/routes.js';
import { visitorsRouter, adminVisitorsRouter } from './modules/visitors/visitors.routes.js';
import errorHandler from './middleware/errorHandler.js';
import { error } from './utils/apiResponse.js';

const app = express();
const apiRouter = express.Router();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN === '*' ? true : env.CLIENT_ORIGIN,
    credentials: true,
  }),
);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(apiLimiter);

apiRouter.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});
apiRouter.use('/auth', authRoutes);
apiRouter.use('/tenants', tenantRouter);
apiRouter.use('/users', userRoutes);
apiRouter.use('/members', memberRoutes);
apiRouter.use('/finance', financeRoutes);
apiRouter.use('/attendance', attendanceRouter);
apiRouter.use('/communication', communicationRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/visitors', visitorsRouter);
apiRouter.use('/admin/attendance', adminAttendanceRouter);
apiRouter.use('/admin/tenants', adminTenantRouter);
apiRouter.use('/admin/visitors', adminVisitorsRouter);

app.use('/api/v1', apiRouter);

app.use((req, res) => {
  return error(res, 'Route not found.', 404);
});

app.use(errorHandler);

export default app;
