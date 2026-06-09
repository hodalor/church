import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { attendanceRouter, adminAttendanceRouter } from './modules/attendance/attendance.routes.js';
import env from './config/env.js';
import authRoutes from './modules/auth/routes.js';
import communicationRoutes from './modules/communication/communication.routes.js';
import {
  adminEventsRouter,
  eventsRouter,
  publicEventsRouter,
} from './modules/events/event.routes.js';
import financeRoutes from './modules/finance/finance.routes.js';
import memberRoutes from './modules/members/member.routes.js';
import notificationRoutes from './modules/notifications/routes.js';
import { adminPastoralRouter, pastoralRouter } from './modules/pastoralCare/pastoral.routes.js';
import { tenantRouter, adminTenantRouter } from './modules/tenants/routes.js';
import userRoutes from './modules/users/routes.js';
import { visitorsRouter, adminVisitorsRouter } from './modules/visitors/visitors.routes.js';
import {
  adminVolunteersRouter,
  rostersRouter,
  volunteersRouter,
} from './modules/volunteers/volunteer.routes.js';
import analyticsRouter from './modules/analytics/analytics.routes.js';
import branchesRouter from './modules/analytics/branch.routes.js';
import hqRouter from './modules/analytics/hq.routes.js';
import insightsRouter from './modules/analytics/insights.routes.js';
import platformRouter from './modules/analytics/platform.routes.js';
import aiRouter from './modules/ai/ai.routes.js';
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

apiRouter.get('/health', (_req, res) => {
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
apiRouter.use('/events', eventsRouter);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/pastoral', pastoralRouter);
apiRouter.use('/branches', branchesRouter);
apiRouter.use('/hq', hqRouter);
apiRouter.use('/insights', insightsRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/public/events', publicEventsRouter);
apiRouter.use('/rosters', rostersRouter);
apiRouter.use('/visitors', visitorsRouter);
apiRouter.use('/volunteers', volunteersRouter);
apiRouter.use('/admin/attendance', adminAttendanceRouter);
apiRouter.use('/admin/events', adminEventsRouter);
apiRouter.use('/admin/pastoral', adminPastoralRouter);
apiRouter.use('/admin/platform', platformRouter);
apiRouter.use('/admin/tenants', adminTenantRouter);
apiRouter.use('/admin/visitors', adminVisitorsRouter);
apiRouter.use('/admin/volunteers', adminVolunteersRouter);

app.use('/api/v1', apiRouter);

app.use((_req, res) => {
  return error(res, 'Route not found.', 404);
});

app.use(errorHandler);

export default app;
