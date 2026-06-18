import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useNavigate } from 'react-router-dom';
import { getCurrentTenant } from '../../api/endpoints/tenants';
import { getUsers } from '../../api/endpoints/users';
import {
  createEvent,
  getEventById,
  publishEvent,
  updateEvent,
  updateEventStatus,
} from '../../api/endpoints/events';
import { useAuthStore } from '../../stores/authStore';
import { useTenantStore } from '../../stores/tenantStore';
import useCurrency from '../../hooks/useCurrency';
import useEventsAccess from '../../hooks/useEventsAccess';
import { eventTypes, formatEventType } from '../../utils/events';
import { supabaseUpload } from '../../utils/supabaseUpload';
import { showErrorToast, showInfoToast, showSuccessToast } from '../../utils/toast';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';

const steps = [
  { id: 1, title: 'Basic Info' },
  { id: 2, title: 'Schedule + Location' },
  { id: 3, title: 'Registration + Tickets' },
  { id: 4, title: 'Team + Review' },
];

const createTicketTier = () => ({
  tierId: '',
  name: '',
  price: '',
  currency: '',
  quantity: '',
  description: '',
});

const createInitialForm = (currencyCode = 'USD') => ({
  title: '',
  type: 'conference',
  description: '',
  tags: [],
  tagDraft: '',
  branch: '',
  isPublic: true,
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  isMultiDay: false,
  venue: '',
  address: '',
  isOnline: false,
  streamUrl: '',
  gpsCoordinates: null,
  bannerUrl: '',
  requiresRegistration: true,
  registrationDeadline: '',
  maxAttendees: '',
  requiresApproval: false,
  isFree: true,
  ticketTiers: [createTicketTier()],
  organizerUserId: '',
  coOrganizers: [],
  volunteerRequirements: '',
  estimatedBudget: '',
  actualCost: '',
  currency: currencyCode,
});

const mapEventToForm = (event, fallbackCurrency) => ({
  title: event.title || '',
  type: event.type || 'conference',
  description: event.description || '',
  tags: event.tags || [],
  tagDraft: '',
  branch: event.branch || '',
  isPublic: event.isPublic !== false,
  startDate: event.startDate?.slice?.(0, 10) || '',
  startTime: event.startTime || '',
  endDate: event.endDate?.slice?.(0, 10) || '',
  endTime: event.endTime || '',
  isMultiDay: event.isMultiDay === true,
  venue: event.venue || '',
  address: event.address || '',
  isOnline: event.isOnline === true,
  streamUrl: event.streamUrl || '',
  gpsCoordinates: event.gpsCoordinates || null,
  bannerUrl: event.bannerUrl || '',
  requiresRegistration: event.requiresRegistration === true,
  registrationDeadline: event.registrationDeadline?.slice?.(0, 10) || '',
  maxAttendees:
    event.maxAttendees === null || event.maxAttendees === undefined ? '' : String(event.maxAttendees),
  requiresApproval: event.requiresApproval === true,
  isFree: event.isFree !== false,
  ticketTiers:
    event.ticketTiers?.length > 0
      ? event.ticketTiers.map((tier) => ({
          tierId: tier.tierId || '',
          name: tier.name || '',
          price: String(tier.price ?? ''),
          currency: tier.currency || fallbackCurrency,
          quantity: String(tier.quantity ?? ''),
          description: tier.description || '',
        }))
      : [createTicketTier()],
  organizerUserId: event.organizerUserId || '',
  coOrganizers: event.coOrganizers || [],
  volunteerRequirements: event.volunteerRequirements || '',
  estimatedBudget:
    event.estimatedBudget === null || event.estimatedBudget === undefined
      ? ''
      : String(event.estimatedBudget),
  actualCost:
    event.actualCost === null || event.actualCost === undefined ? '' : String(event.actualCost),
  currency: event.currency || fallbackCurrency,
});

const buildPayload = (form, options = {}) => ({
  title: form.title,
  type: form.type,
  description: form.description,
  tags: form.tags,
  branch: form.branch || undefined,
  isPublic: form.isPublic,
  startDate: form.startDate || undefined,
  startTime: form.startTime || undefined,
  endDate: form.endDate || undefined,
  endTime: form.endTime || undefined,
  isMultiDay: form.isMultiDay,
  venue: form.venue || undefined,
  address: form.address || undefined,
  isOnline: form.isOnline,
  streamUrl: form.isOnline ? form.streamUrl || undefined : undefined,
  gpsCoordinates: form.gpsCoordinates || undefined,
  bannerUrl: form.bannerUrl || undefined,
  requiresRegistration: form.requiresRegistration,
  registrationDeadline: form.requiresRegistration ? form.registrationDeadline || undefined : undefined,
  maxAttendees:
    form.requiresRegistration && form.maxAttendees !== ''
      ? Number(form.maxAttendees || 0) || undefined
      : undefined,
  requiresApproval: form.requiresRegistration ? form.requiresApproval : false,
  isFree: form.isFree,
  ticketTiers: form.isFree
    ? []
    : form.ticketTiers
        .filter((tier) => tier.name && tier.price !== '' && tier.quantity !== '')
        .map((tier) => ({
          tierId: tier.tierId || undefined,
          name: tier.name,
          price: Number(tier.price || 0),
          currency: tier.currency || form.currency,
          quantity: Number(tier.quantity || 0),
          description: tier.description || undefined,
        })),
  organizerUserId: form.organizerUserId || undefined,
  coOrganizers: form.coOrganizers,
  volunteerRequirements: form.volunteerRequirements || undefined,
  estimatedBudget: form.estimatedBudget !== '' ? Number(form.estimatedBudget || 0) : undefined,
  actualCost: form.actualCost !== '' ? Number(form.actualCost || 0) : undefined,
  currency: form.currency || undefined,
  tenantId: options.tenantId || undefined,
});

export default function EventFormWizard({ eventId = null, fallbackPath = '/events' }) {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const tenantId = useTenantStore((state) => state.tenantId);
  const { currencyCode, formatCurrency } = useCurrency();
  const { canCreateEvents, canModifyEvents, canPublishEvents } = useEventsAccess();
  const [activeStep, setActiveStep] = useState(1);
  const [form, setForm] = useState(createInitialForm(currencyCode));
  const [bannerFileName, setBannerFileName] = useState('');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const isEdit = Boolean(eventId);

  const canSave = isEdit ? canModifyEvents : canCreateEvents;

  const tenantQuery = useQuery({
    queryKey: ['event-form-tenant'],
    queryFn: getCurrentTenant,
    enabled: canSave,
  });
  const usersQuery = useQuery({
    queryKey: ['event-form-users'],
    queryFn: getUsers,
    enabled: canSave,
  });
  const eventQuery = useQuery({
    queryKey: ['event-form-edit', eventId],
    queryFn: () => getEventById(eventId),
    enabled: Boolean(eventId) && canSave,
  });

  useEffect(() => {
    const organizerId = authUser?.userId || authUser?._id;
    if (organizerId && !isEdit) {
      setForm((current) => ({
        ...current,
        organizerUserId: current.organizerUserId || organizerId,
        currency: current.currency || currencyCode,
      }));
    }
  }, [authUser?._id, authUser?.userId, currencyCode, isEdit]);

  useEffect(() => {
    if (!eventQuery.data) {
      return;
    }

    setForm(mapEventToForm(eventQuery.data, currencyCode));
  }, [currencyCode, eventQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload) => (isEdit ? updateEvent(eventId, payload) : createEvent(payload)),
  });
  const publishMutation = useMutation({
    mutationFn: (id) => publishEvent(id),
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateEventStatus(id, status),
  });

  const users = usersQuery.data || [];
  const content = tenantQuery.data?.content || {};
  const branches = content.branches || [];
  const coOrganizerOptions = users.filter((user) => (user._id || user.id) !== form.organizerUserId);
  const selectedOrganizer = users.find((user) => (user._id || user.id) === form.organizerUserId);

  const reviewItems = useMemo(
    () => [
      ['Type', formatEventType(form.type)],
      ['Branch', form.branch || 'All branches'],
      ['Schedule', `${form.startDate || 'TBD'} ${form.startTime || ''}`.trim() || 'TBD'],
      ['Venue', form.venue || 'TBD'],
      ['Registration', form.requiresRegistration ? 'Required' : 'Open walk-in'],
      [
        'Capacity',
        form.maxAttendees === '' || Number(form.maxAttendees) === 0
          ? 'Unlimited'
          : `${form.maxAttendees} attendees`,
      ],
      ['Ticketing', form.isFree ? 'Free event' : `${form.ticketTiers.filter((item) => item.name).length} tiers`],
      ['Visibility', form.isPublic ? 'Public' : 'Private'],
    ],
    [
      form.branch,
      form.isFree,
      form.isPublic,
      form.maxAttendees,
      form.requiresRegistration,
      form.startDate,
      form.startTime,
      form.ticketTiers,
      form.type,
      form.venue,
    ],
  );

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const addTag = () => {
    const nextTag = form.tagDraft.trim();
    if (!nextTag) {
      return;
    }

    setForm((current) => ({
      ...current,
      tags: [...new Set([...current.tags, nextTag])],
      tagDraft: '',
    }));
  };

  const updateTier = (index, key, value) => {
    setForm((current) => ({
      ...current,
      ticketTiers: current.ticketTiers.map((tier, tierIndex) =>
        tierIndex === index ? { ...tier, [key]: value } : tier,
      ),
    }));
  };

  const handleBannerUpload = async (file) => {
    if (!file) {
      return;
    }

    try {
      setUploadingBanner(true);
      const uploadedUrl = await supabaseUpload(file, 'church-media', `events/${Date.now()}-${file.name}`);
      setBannerFileName(file.name);
      setField('bannerUrl', uploadedUrl);
    } catch (error) {
      showErrorToast(error.message || 'Banner upload failed.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      showErrorToast('Geolocation is not available in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setField('gpsCoordinates', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => showErrorToast('Unable to access your current location.'),
    );
  };

  const handleSave = async (mode) => {
    try {
      const payload = buildPayload(
        {
          ...form,
          organizerUserId: form.organizerUserId || authUser?.userId || authUser?._id || '',
        },
        {
          tenantId: authUser?.role === 'super_admin' ? tenantId : undefined,
        },
      );
      const saved = await saveMutation.mutateAsync(payload);
      const savedId = saved.eventId || saved._id || saved.id || eventId;

      if (!savedId) {
        throw new Error('Event was saved, but no event identifier was returned.');
      }

      let followUpWarning = '';

      try {
        if (mode === 'publish' && canPublishEvents) {
          await publishMutation.mutateAsync(savedId);
        }

        if (mode === 'open-registration' && canPublishEvents) {
          await publishMutation.mutateAsync(savedId);
          await statusMutation.mutateAsync({ id: savedId, status: 'registration_open' });
        }
      } catch (error) {
        followUpWarning =
          error.response?.data?.message || error.message || 'The event was created, but follow-up publishing failed.';
      }

      if (followUpWarning) {
        showInfoToast(`Event created. ${followUpWarning}`);
      } else {
        showSuccessToast(
          mode === 'draft'
            ? 'Event saved as draft.'
            : mode === 'open-registration'
              ? 'Event created and registration opened.'
              : 'Event created successfully.',
        );
      }

      navigate(`/events/${savedId}`);
    } catch (error) {
      showErrorToast(error.response?.data?.message || error.message || 'Unable to save event right now.');
    }
  };

  if (!canSave) {
    return (
      <Card>
        <p className="text-sm uppercase tracking-[0.22em] text-accent">Events</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
        <p className="mt-3 text-sm text-white/60">
          Your account does not currently have permission to {isEdit ? 'edit' : 'create'} events.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => setActiveStep(step.id)}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              activeStep === step.id
                ? 'border-accent/50 bg-accent/10 text-white'
                : 'border-white/10 bg-[#101827] text-white/55'
            }`}
          >
            <p className="text-[11px] uppercase tracking-[0.22em]">Step {step.id}</p>
            <p className="mt-1 font-semibold">{step.title}</p>
          </button>
        ))}
      </div>

      {activeStep === 1 ? (
        <Card className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Title"
              value={form.title}
              onChange={(event) => setField('title', event.target.value)}
              placeholder="Leadership Summit 2026"
            />
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Branch</span>
              <select
                value={form.branch}
                onChange={(event) => setField('branch', event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
              >
                <option value="">All branches / main church</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {eventTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setField('type', type)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  form.type === type
                    ? 'border-accent/50 bg-accent/10 text-white'
                    : 'border-white/10 bg-[#101827] text-white/60'
                }`}
              >
                <p className="font-semibold capitalize">{formatEventType(type)}</p>
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <span className="text-[13px] font-medium text-white/75">Description</span>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white">
              <ReactQuill theme="snow" value={form.description} onChange={(value) => setField('description', value)} />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[13px] font-medium text-white/75">Tags</span>
            <div className="flex gap-2">
              <input
                value={form.tagDraft}
                onChange={(event) => setField('tagDraft', event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addTag();
                  }
                }}
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
                placeholder="Add tag"
              />
              <Button variant="subtle" onClick={addTag}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      tags: current.tags.filter((item) => item !== tag),
                    }))
                  }
                  className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent"
                >
                  {tag} x
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#101827] px-4 py-4">
            <div>
              <p className="font-semibold text-white">Public Event</p>
              <p className="text-sm text-white/45">Allow the event to appear on public-facing listings.</p>
            </div>
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(event) => setField('isPublic', event.target.checked)}
            />
          </label>
        </Card>
      ) : null}

      {activeStep === 2 ? (
        <Card className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(event) => setField('startDate', event.target.value)}
            />
            <Input
              label="Start Time"
              type="time"
              value={form.startTime}
              onChange={(event) => setField('startTime', event.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={(event) => setField('endDate', event.target.value)}
            />
            <Input
              label="End Time"
              type="time"
              value={form.endTime}
              onChange={(event) => setField('endTime', event.target.value)}
            />
          </div>

          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#101827] px-4 py-4">
            <div>
              <p className="font-semibold text-white">Multi-Day Event</p>
              <p className="text-sm text-white/45">Enable when the event spans more than one day.</p>
            </div>
            <input
              type="checkbox"
              checked={form.isMultiDay}
              onChange={(event) => setField('isMultiDay', event.target.checked)}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Venue"
              value={form.venue}
              onChange={(event) => setField('venue', event.target.value)}
              placeholder="Main Auditorium"
            />
            <Input
              label="Address"
              value={form.address}
              onChange={(event) => setField('address', event.target.value)}
              placeholder="123 Church Street"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="subtle" onClick={handleUseLocation}>
              Use Current Location
            </Button>
            {form.gpsCoordinates ? (
              <span className="text-sm text-white/55">
                {form.gpsCoordinates.lat?.toFixed?.(5)}, {form.gpsCoordinates.lng?.toFixed?.(5)}
              </span>
            ) : null}
          </div>

          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#101827] px-4 py-4">
            <div>
              <p className="font-semibold text-white">Online Event</p>
              <p className="text-sm text-white/45">Add a stream link for remote participation.</p>
            </div>
            <input
              type="checkbox"
              checked={form.isOnline}
              onChange={(event) => setField('isOnline', event.target.checked)}
            />
          </label>

          {form.isOnline ? (
            <Input
              label="Stream URL"
              value={form.streamUrl}
              onChange={(event) => setField('streamUrl', event.target.value)}
              placeholder="https://..."
            />
          ) : null}

          <div className="space-y-2">
            <span className="text-[13px] font-medium text-white/75">Banner Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleBannerUpload(event.target.files?.[0])}
              className="block w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
            />
            {uploadingBanner ? <p className="text-sm text-accent">Uploading banner...</p> : null}
            {form.bannerUrl ? (
              <div className="rounded-2xl border border-white/10 bg-[#101827] p-3">
                <img
                  src={form.bannerUrl}
                  alt={bannerFileName || form.title || 'Event banner'}
                  className="h-48 w-full rounded-xl object-cover"
                />
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {activeStep === 3 ? (
        <Card className="space-y-5">
          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#101827] px-4 py-4">
            <div>
              <p className="font-semibold text-white">Requires Registration</p>
              <p className="text-sm text-white/45">Collect attendee signups before the event.</p>
            </div>
            <input
              type="checkbox"
              checked={form.requiresRegistration}
              onChange={(event) => setField('requiresRegistration', event.target.checked)}
            />
          </label>

          {form.requiresRegistration ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                label="Registration Deadline"
                type="date"
                value={form.registrationDeadline}
                onChange={(event) => setField('registrationDeadline', event.target.value)}
              />
              <Input
                label="Max Attendees"
                type="number"
                min="0"
                value={form.maxAttendees}
                onChange={(event) => setField('maxAttendees', event.target.value)}
                placeholder="0 = unlimited"
              />
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#101827] px-4 py-4 md:mt-7">
                <div>
                  <p className="font-semibold text-white">Requires Approval</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.requiresApproval}
                  onChange={(event) => setField('requiresApproval', event.target.checked)}
                />
              </label>
            </div>
          ) : null}

          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#101827] px-4 py-4">
            <div>
              <p className="font-semibold text-white">Free Event</p>
              <p className="text-sm text-white/45">Turn off to configure paid ticket tiers.</p>
            </div>
            <input
              type="checkbox"
              checked={form.isFree}
              onChange={(event) => setField('isFree', event.target.checked)}
            />
          </label>

          {!form.isFree ? (
            <div className="space-y-4">
              {form.ticketTiers.map((tier, index) => (
                <div key={index} className="rounded-2xl border border-white/10 bg-[#101827] p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Tier Name"
                      value={tier.name}
                      onChange={(event) => updateTier(index, 'name', event.target.value)}
                      placeholder="VIP"
                    />
                    <Input
                      label="Price"
                      type="number"
                      min="0"
                      value={tier.price}
                      onChange={(event) => updateTier(index, 'price', event.target.value)}
                      placeholder="0"
                    />
                    <Input
                      label="Currency"
                      value={tier.currency || form.currency}
                      onChange={(event) => updateTier(index, 'currency', event.target.value)}
                    />
                    <Input
                      label="Quantity"
                      type="number"
                      min="1"
                      value={tier.quantity}
                      onChange={(event) => updateTier(index, 'quantity', event.target.value)}
                      placeholder="100"
                    />
                  </div>
                  <label className="mt-4 block space-y-1.5">
                    <span className="text-[13px] font-medium text-white/75">Description</span>
                    <textarea
                      rows={3}
                      value={tier.description}
                      onChange={(event) => updateTier(index, 'description', event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#0b1120] px-3.5 py-2.5 text-sm text-white outline-none focus:border-accent"
                      placeholder="Tier perks and notes"
                    />
                  </label>
                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
                    <div>
                      <p className="font-semibold text-white">{tier.name || 'New tier'}</p>
                      <p className="text-sm text-white/45">
                        {formatCurrency(Number(tier.price || 0), {
                          currencyCode: tier.currency || form.currency || currencyCode,
                        })}{' '}
                        • {tier.quantity || 0} spots
                      </p>
                    </div>
                    {form.ticketTiers.length > 1 ? (
                      <Button
                        variant="subtle"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            ticketTiers: current.ticketTiers.filter((_, tierIndex) => tierIndex !== index),
                          }))
                        }
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
              <Button
                variant="ghost"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    ticketTiers: [...current.ticketTiers, { ...createTicketTier(), currency: form.currency }],
                  }))
                }
              >
                + Add Tier
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      {activeStep === 4 ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <Card className="space-y-5">
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Organizer</span>
              <select
                value={form.organizerUserId}
                onChange={(event) => setField('organizerUserId', event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
              >
                <option value="">Select organizer</option>
                {users.map((user) => (
                  <option key={user._id || user.id} value={user._id || user.id}>
                    {user.fullName || user.username}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-2">
              <span className="text-[13px] font-medium text-white/75">Co-Organizers</span>
              <div className="flex flex-wrap gap-2">
                {coOrganizerOptions.map((user) => {
                  const userId = user._id || user.id;
                  const active = form.coOrganizers.includes(userId);
                  return (
                    <button
                      key={userId}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          coOrganizers: active
                            ? current.coOrganizers.filter((item) => item !== userId)
                            : [...current.coOrganizers, userId],
                        }))
                      }
                      className={`rounded-full px-3 py-1.5 text-sm ${
                        active
                          ? 'bg-accent text-primary'
                          : 'border border-white/10 bg-[#101827] text-white/65'
                      }`}
                    >
                      {user.fullName || user.username}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Volunteer Requirements</span>
              <textarea
                rows={4}
                value={form.volunteerRequirements}
                onChange={(event) => setField('volunteerRequirements', event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none focus:border-accent"
                placeholder="Need 10 ushers, 5 media, 2 first aid volunteers..."
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Estimated Budget"
                type="number"
                min="0"
                value={form.estimatedBudget}
                onChange={(event) => setField('estimatedBudget', event.target.value)}
              />
              <Input
                label="Actual Cost"
                type="number"
                min="0"
                value={form.actualCost}
                onChange={(event) => setField('actualCost', event.target.value)}
              />
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/45">Review Summary</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{form.title || 'Untitled event'}</h3>
            </div>

            <div className="space-y-3">
              {reviewItems.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#101827] px-4 py-3">
                  <span className="text-sm text-white/55">{label}</span>
                  <span className="text-sm font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-4">
              <p className="text-sm text-white/60">Organizer</p>
              <p className="mt-1 font-semibold text-white">
                {selectedOrganizer?.fullName || selectedOrganizer?.username || 'Not selected'}
              </p>
              <p className="mt-4 text-sm text-white/60">Estimated capacity</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {form.maxAttendees === '' || Number(form.maxAttendees) === 0
                  ? 'Unlimited'
                  : `${form.maxAttendees} attendees`}
              </p>
            </div>
          </Card>
        </div>
      ) : null}

      {saveMutation.error ? <p className="text-sm text-rose-300">{saveMutation.error.message}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button
            variant="subtle"
            disabled={activeStep === 1}
            onClick={() => setActiveStep((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            disabled={activeStep === steps.length}
            onClick={() => setActiveStep((current) => Math.min(steps.length, current + 1))}
          >
            Next
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="subtle" onClick={() => navigate(fallbackPath)}>
            Cancel
          </Button>
          <Button
            variant="ghost"
            disabled={!form.title || !form.startDate || saveMutation.isPending || uploadingBanner}
            onClick={() => handleSave('draft')}
          >
            Save as Draft
          </Button>
          <Button
            variant="secondary"
            disabled={
              !form.title ||
              !form.startDate ||
              saveMutation.isPending ||
              publishMutation.isPending ||
              !canPublishEvents ||
              uploadingBanner
            }
            onClick={() => handleSave('publish')}
          >
            Save &amp; Publish
          </Button>
          <Button
            disabled={
              !form.title ||
              !form.startDate ||
              saveMutation.isPending ||
              publishMutation.isPending ||
              statusMutation.isPending ||
              !canPublishEvents ||
              uploadingBanner
            }
            onClick={() => handleSave('open-registration')}
          >
            Save &amp; Open Registration
          </Button>
        </div>
      </div>
    </div>
  );
}
