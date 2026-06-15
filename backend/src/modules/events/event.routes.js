import { Router } from 'express';
import auth from '../../middleware/auth.js';
import auditMiddleware from '../../middleware/auditMiddleware.js';
import isSuperAdmin from '../../middleware/isSuperAdmin.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import * as eventController from './event.controller.js';
import {
  approveRegistrationValidation,
  checkInRegistrationValidation,
  createEventValidation,
  eventIdParamValidation,
  listEventsValidation,
  publicEventsValidation,
  registerForEventValidation,
  updateEventStatusValidation,
  updateEventValidation,
  updateRegistrationValidation,
} from './event.validation.js';

const eventsRouter = Router();
const publicEventsRouter = Router();
const adminEventsRouter = Router();

eventsRouter.use(auth, tenantScope);

eventsRouter.post('/', auditMiddleware('events', 'Event'), createEventValidation, validate, eventController.createEvent);
eventsRouter.get('/', listEventsValidation, validate, eventController.getAllEvents);
eventsRouter.get('/my-registrations', listEventsValidation, validate, eventController.getMyRegistrations);
eventsRouter.get('/upcoming', listEventsValidation, validate, eventController.getUpcomingEvents);
eventsRouter.get('/stats', listEventsValidation, validate, eventController.getEventStats);
eventsRouter.get(
  '/:eventId/registrations/stats',
  eventIdParamValidation,
  validate,
  eventController.getRegistrationStats,
);
eventsRouter.get('/:eventId', eventIdParamValidation, validate, eventController.getEventById);
eventsRouter.patch('/:eventId', auditMiddleware('events', 'Event'), updateEventValidation, validate, eventController.updateEvent);
eventsRouter.delete('/:eventId', auditMiddleware('events', 'Event'), eventIdParamValidation, validate, eventController.deleteEvent);
eventsRouter.patch(
  '/:eventId/status',
  auditMiddleware('events', 'Event', { action: 'STATUS_CHANGE' }),
  updateEventStatusValidation,
  validate,
  eventController.updateEventStatus,
);
eventsRouter.post('/:eventId/publish', auditMiddleware('events', 'Event', { action: 'PUBLISH' }), eventIdParamValidation, validate, eventController.publishEvent);
eventsRouter.post(
  '/:eventId/register',
  registerForEventValidation,
  validate,
  eventController.registerForEvent,
);
eventsRouter.get(
  '/:eventId/registrations',
  [...eventIdParamValidation, ...listEventsValidation],
  validate,
  eventController.getEventRegistrations,
);
eventsRouter.patch(
  '/:eventId/registrations/:regId',
  auditMiddleware('events', 'Registration'),
  updateRegistrationValidation,
  validate,
  eventController.updateRegistration,
);
eventsRouter.patch(
  '/:eventId/registrations/:regId/checkin',
  auditMiddleware('events', 'Registration', { action: 'STATUS_CHANGE' }),
  checkInRegistrationValidation,
  validate,
  eventController.checkInToEvent,
);
eventsRouter.patch(
  '/:eventId/registrations/:regId/approve',
  auditMiddleware('events', 'Registration', { action: 'APPROVE' }),
  approveRegistrationValidation,
  validate,
  eventController.approveRegistration,
);

publicEventsRouter.post(
  '/:eventId/register',
  registerForEventValidation,
  validate,
  eventController.publicRegisterForEvent,
);
publicEventsRouter.get('/:identifier', publicEventsValidation, validate, eventController.getPublicEventResource);

adminEventsRouter.use(auth, isSuperAdmin);
adminEventsRouter.get('/overview', eventController.getPlatformEventsOverview);

export { eventsRouter, publicEventsRouter, adminEventsRouter };
