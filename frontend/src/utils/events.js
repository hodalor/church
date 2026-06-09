import { formatDistanceToNowStrict } from 'date-fns';

export const eventTypes = [
  'conference',
  'concert',
  'outreach',
  'fundraiser',
  'workshop',
  'retreat',
  'crusade',
  'anniversary',
  'sports',
  'youth_event',
  'women_fellowship',
  'men_fellowship',
  'other',
];

export const eventStatuses = [
  'draft',
  'published',
  'registration_open',
  'registration_closed',
  'ongoing',
  'completed',
  'cancelled',
];

export const registrationStatuses = ['pending', 'confirmed', 'cancelled', 'attended', 'no_show'];
export const approvalStatuses = ['pending', 'approved', 'rejected'];

export const getEventStatusClasses = (status = 'draft') =>
  (
    {
      draft: 'border border-slate-400/30 bg-slate-500/15 text-slate-300',
      published: 'border border-blue-400/30 bg-blue-500/15 text-blue-300',
      registration_open: 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
      registration_closed: 'border border-amber-400/30 bg-amber-500/15 text-amber-300',
      ongoing: 'border border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-300',
      completed: 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
      cancelled: 'border border-rose-400/30 bg-rose-500/15 text-rose-300',
    }[status] || 'border border-slate-400/30 bg-slate-500/15 text-slate-300'
  );

export const getEventTypeClasses = (type = 'other') =>
  (
    {
      conference: 'border border-indigo-400/30 bg-indigo-500/15 text-indigo-300',
      concert: 'border border-pink-400/30 bg-pink-500/15 text-pink-300',
      outreach: 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
      fundraiser: 'border border-amber-400/30 bg-amber-500/15 text-amber-300',
      workshop: 'border border-cyan-400/30 bg-cyan-500/15 text-cyan-300',
      retreat: 'border border-violet-400/30 bg-violet-500/15 text-violet-300',
      crusade: 'border border-red-400/30 bg-red-500/15 text-red-300',
      anniversary: 'border border-yellow-400/30 bg-yellow-500/15 text-yellow-300',
      sports: 'border border-lime-400/30 bg-lime-500/15 text-lime-300',
      youth_event: 'border border-sky-400/30 bg-sky-500/15 text-sky-300',
      women_fellowship: 'border border-rose-400/30 bg-rose-500/15 text-rose-300',
      men_fellowship: 'border border-stone-400/30 bg-stone-500/15 text-stone-300',
      other: 'border border-slate-400/30 bg-slate-500/15 text-slate-300',
    }[type] || 'border border-slate-400/30 bg-slate-500/15 text-slate-300'
  );

export const formatEventType = (type = 'other') => String(type || 'other').replaceAll('_', ' ');

export const buildEventCountdown = (value) => {
  if (!value) {
    return 'Date TBD';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Date TBD';
  }
  if (date <= new Date()) {
    return 'Already started';
  }

  return `Starts in ${formatDistanceToNowStrict(date)}`;
};

export const getRegistrationStatusClasses = (status = 'pending') =>
  (
    {
      pending: 'border border-amber-400/30 bg-amber-500/15 text-amber-300',
      confirmed: 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
      cancelled: 'border border-rose-400/30 bg-rose-500/15 text-rose-300',
      attended: 'border border-blue-400/30 bg-blue-500/15 text-blue-300',
      no_show: 'border border-slate-400/30 bg-slate-500/15 text-slate-300',
    }[status] || 'border border-slate-400/30 bg-slate-500/15 text-slate-300'
  );

export const getApprovalStatusClasses = (status = 'pending') =>
  (
    {
      pending: 'border border-amber-400/30 bg-amber-500/15 text-amber-300',
      approved: 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
      rejected: 'border border-rose-400/30 bg-rose-500/15 text-rose-300',
    }[status] || 'border border-slate-400/30 bg-slate-500/15 text-slate-300'
  );
