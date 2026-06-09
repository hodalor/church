import asyncHandler from '../../utils/asyncHandler.js';
import { success } from '../../utils/apiResponse.js';
import { createHttpError } from '../../utils/httpError.js';
import { hasAnyCapability } from '../access/capabilities.js';
import { scopeBranchQuery } from '../../utils/branchScope.js';
import * as eventService from './event.service.js';

const resolveScopedTenantId = (req) => {
  if (req.user?.role === 'super_admin') {
    const tenantId =
      req.query?.tenantId ||
      req.body?.tenantId ||
      req.headers['x-tenant-id'] ||
      req.params?.tenantId;

    if (!tenantId) {
      throw createHttpError(400, 'Tenant ID is required for super admin event requests.');
    }

    return String(tenantId).trim().toLowerCase();
  }

  return req.tenantId;
};

const ensureEventCapability = (req, capabilityOptions) => {
  if (req.user?.role === 'super_admin') {
    return;
  }

  const requiredCapabilities = Array.isArray(capabilityOptions)
    ? capabilityOptions
    : [capabilityOptions];

  if (!hasAnyCapability(req.user?.capabilities || [], requiredCapabilities)) {
    throw createHttpError(403, 'You do not have permission for this event action.');
  }
};

const ensureSuperAdmin = (req) => {
  if (req.user?.role !== 'super_admin') {
    throw createHttpError(403, 'Super admin access is required for this event action.');
  }
};

const eventActor = (req) => ({
  userId: req.user?.userId,
  role: req.user?.role,
  memberId: req.user?.memberId,
  name: req.user?.fullName || req.user?.username || req.user?.role,
  allBranches: req.user?.allBranches,
  assignedBranches: req.user?.assignedBranches,
});

export const createEvent = asyncHandler(async (req, res) => {
  ensureEventCapability(req, ['events.create', 'events.overview.create']);
  const data = await eventService.createEvent(resolveScopedTenantId(req), req.body, eventActor(req));
  return success(res, data, 'Event created successfully.', 201);
});

export const getAllEvents = asyncHandler(async (req, res) => {
  ensureEventCapability(req, ['events.view', 'events.overview.view']);
  const data = await eventService.getAllEvents(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
    eventActor(req),
  );
  return success(res, data, 'Events fetched successfully.');
});

export const getUpcomingEvents = asyncHandler(async (req, res) => {
  ensureEventCapability(req, ['events.view', 'events.overview.view']);
  const data = await eventService.getUpcomingEvents(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
    eventActor(req),
  );
  return success(res, data, 'Upcoming events fetched successfully.');
});

export const getEventStats = asyncHandler(async (req, res) => {
  ensureEventCapability(req, ['events.view', 'events.reports.view']);
  const data = await eventService.getEventStats(resolveScopedTenantId(req), eventActor(req));
  return success(res, data, 'Event statistics fetched successfully.');
});

export const getEventById = asyncHandler(async (req, res) => {
  ensureEventCapability(req, ['events.view', 'events.overview.view']);
  const data = await eventService.getEventById(
    resolveScopedTenantId(req),
    req.params.eventId,
    eventActor(req),
  );
  return success(res, data, 'Event fetched successfully.');
});

export const updateEvent = asyncHandler(async (req, res) => {
  ensureEventCapability(req, ['events.modify', 'events.overview.modify']);
  const data = await eventService.updateEvent(
    resolveScopedTenantId(req),
    req.params.eventId,
    req.body,
    eventActor(req),
  );
  return success(res, data, 'Event updated successfully.');
});

export const deleteEvent = asyncHandler(async (req, res) => {
  ensureEventCapability(req, ['events.delete']);
  const data = await eventService.deleteEvent(
    resolveScopedTenantId(req),
    req.params.eventId,
    eventActor(req),
  );
  return success(res, data, 'Event deleted successfully.');
});

export const updateEventStatus = asyncHandler(async (req, res) => {
  ensureEventCapability(req, ['events.modify', 'events.overview.modify']);
  const data = await eventService.updateEventStatus(
    resolveScopedTenantId(req),
    req.params.eventId,
    req.body.status,
    eventActor(req),
  );
  return success(res, data, 'Event status updated successfully.');
});

export const publishEvent = asyncHandler(async (req, res) => {
  ensureEventCapability(req, ['events.modify', 'events.overview.publish']);
  const data = await eventService.publishEvent(
    resolveScopedTenantId(req),
    req.params.eventId,
    eventActor(req),
  );
  return success(res, data, 'Event published successfully.');
});

export const registerForEvent = asyncHandler(async (req, res) => {
  ensureEventCapability(req, ['events.registrations.create', 'events.view']);
  const data = await eventService.registerForEvent(
    resolveScopedTenantId(req),
    req.params.eventId,
    req.body,
    eventActor(req),
  );
  return success(res, data, 'Event registration completed successfully.', 201);
});

export const getEventRegistrations = asyncHandler(async (req, res) => {
  ensureEventCapability(req, ['events.registrations.view', 'events.view']);
  const data = await eventService.getEventRegistrations(
    resolveScopedTenantId(req),
    req.params.eventId,
    req.query,
    eventActor(req),
  );
  return success(res, data, 'Event registrations fetched successfully.');
});

export const updateRegistration = asyncHandler(async (req, res) => {
  ensureEventCapability(req, ['events.registrations.modify', 'events.modify']);
  const data = await eventService.updateRegistration(
    resolveScopedTenantId(req),
    req.params.eventId,
    req.params.regId,
    req.body,
    eventActor(req),
  );
  return success(res, data, 'Event registration updated successfully.');
});

export const checkInToEvent = asyncHandler(async (req, res) => {
  ensureEventCapability(req, ['events.registrations.check_in', 'events.registrations.modify']);
  const data = await eventService.checkInToEvent(
    resolveScopedTenantId(req),
    req.params.eventId,
    req.params.regId,
    req.body,
    eventActor(req),
  );
  return success(res, data, 'Event check-in completed successfully.');
});

export const approveRegistration = asyncHandler(async (req, res) => {
  ensureEventCapability(req, ['events.registrations.approve', 'events.registrations.modify']);
  const data = await eventService.approveRegistration(
    resolveScopedTenantId(req),
    req.params.eventId,
    req.params.regId,
    req.body,
    eventActor(req),
  );
  return success(res, data, 'Event registration approval updated successfully.');
});

export const getRegistrationStats = asyncHandler(async (req, res) => {
  ensureEventCapability(req, ['events.registrations.view', 'events.reports.view']);
  const data = await eventService.getRegistrationStats(
    resolveScopedTenantId(req),
    req.params.eventId,
    eventActor(req),
  );
  return success(res, data, 'Event registration statistics fetched successfully.');
});

export const getMyRegistrations = asyncHandler(async (req, res) => {
  ensureEventCapability(req, ['events.registrations.view', 'events.view']);
  const data = await eventService.getMyRegistrations(resolveScopedTenantId(req), eventActor(req));
  return success(res, data, 'My event registrations fetched successfully.');
});

export const getPublicEvents = asyncHandler(async (req, res) => {
  const data = await eventService.getPublicEvents(req.params.tenantId, req.query);
  return success(res, data, 'Public events fetched successfully.');
});

export const getPublicEventById = asyncHandler(async (req, res) => {
  const data = await eventService.getPublicEventById(req.params.eventId);
  return success(res, data, 'Public event fetched successfully.');
});

export const getPublicEventResource = asyncHandler(async (req, res) => {
  const identifier = String(req.params.identifier || '').trim();
  const isEventLookup = identifier.toUpperCase().startsWith('EVT-');
  const data = isEventLookup
    ? await eventService.getPublicEventById(identifier)
    : await eventService.getPublicEvents(identifier, req.query);

  return success(
    res,
    data,
    isEventLookup ? 'Public event fetched successfully.' : 'Public events fetched successfully.',
  );
});

export const publicRegisterForEvent = asyncHandler(async (req, res) => {
  const data = await eventService.publicRegisterForEvent(req.params.eventId, req.body);
  return success(res, data, 'Public event registration completed successfully.', 201);
});

export const getPlatformEventsOverview = asyncHandler(async (req, res) => {
  ensureSuperAdmin(req);
  const data = await eventService.getPlatformEventsOverview();
  return success(res, data, 'Platform event overview fetched successfully.');
});
