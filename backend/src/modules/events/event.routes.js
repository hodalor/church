import { Router } from 'express';
import auth from '../../middleware/auth.js';
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

eventsRouter.post('/', createEventValidation, validate, eventController.createEvent);
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
eventsRouter.patch('/:eventId', updateEventValidation, validate, eventController.updateEvent);
eventsRouter.delete('/:eventId', eventIdParamValidation, validate, eventController.deleteEvent);
eventsRouter.patch(
  '/:eventId/status',
  updateEventStatusValidation,
  validate,
  eventController.updateEventStatus,
);
eventsRouter.post('/:eventId/publish', eventIdParamValidation, validate, eventController.publishEvent);
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
  updateRegistrationValidation,
  validate,
  eventController.updateRegistration,
);
eventsRouter.patch(
  '/:eventId/registrations/:regId/checkin',
  checkInRegistrationValidation,
  validate,
  eventController.checkInToEvent,
);
eventsRouter.patch(
  '/:eventId/registrations/:regId/approve',
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
