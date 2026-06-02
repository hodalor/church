export const VISITOR_STAGE_ORDER = [
  'new_visitor',
  'contacted',
  'second_visit',
  'connected',
  'assimilated',
  'converted',
  'inactive',
  'lost',
];

export const VISITOR_STAGE_META = {
  new_visitor: {
    label: 'New Visitor',
    badgeClassName: 'bg-slate-400/15 text-slate-200 border border-slate-300/20',
    columnClassName: 'bg-slate-300/6 border-slate-300/14',
  },
  contacted: {
    label: 'Contacted',
    badgeClassName: 'bg-sky-500/15 text-sky-200 border border-sky-400/20',
    columnClassName: 'bg-sky-500/6 border-sky-400/14',
  },
  second_visit: {
    label: 'Second Visit',
    badgeClassName: 'bg-teal-500/15 text-teal-200 border border-teal-400/20',
    columnClassName: 'bg-teal-500/6 border-teal-400/14',
  },
  connected: {
    label: 'Connected',
    badgeClassName: 'bg-violet-500/15 text-violet-200 border border-violet-400/20',
    columnClassName: 'bg-violet-500/6 border-violet-400/14',
  },
  assimilated: {
    label: 'Assimilated',
    badgeClassName: 'bg-amber-500/15 text-amber-200 border border-amber-400/20',
    columnClassName: 'bg-amber-500/6 border-amber-400/14',
  },
  converted: {
    label: 'Converted',
    badgeClassName: 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/20',
    columnClassName: 'bg-emerald-500/6 border-emerald-400/14',
  },
  inactive: {
    label: 'Inactive',
    badgeClassName: 'bg-orange-500/15 text-orange-200 border border-orange-400/20',
    columnClassName: 'bg-orange-500/6 border-orange-400/14',
  },
  lost: {
    label: 'Lost',
    badgeClassName: 'bg-rose-500/15 text-rose-200 border border-rose-400/20',
    columnClassName: 'bg-rose-500/6 border-rose-400/14',
  },
};

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export const AGE_GROUP_OPTIONS = [
  { value: 'child', label: 'Child' },
  { value: 'youth', label: 'Youth' },
  { value: 'adult', label: 'Adult' },
  { value: 'senior', label: 'Senior' },
];

export const HEAR_ABOUT_OPTIONS = [
  { value: 'social_media', label: 'Social Media', icon: 'globe' },
  { value: 'member_referral', label: 'Member Referral', icon: 'users' },
  { value: 'flyer', label: 'Flyer / Banner', icon: 'megaphone' },
  { value: 'walk_in', label: 'Walk In', icon: 'map-pin' },
  { value: 'community_outreach', label: 'Community Outreach', icon: 'heart' },
  { value: 'online_search', label: 'Online Search', icon: 'search' },
];

export const INTEREST_SUGGESTIONS = [
  'Choir',
  'Bible Study',
  'Youth',
  'Prayer',
  'Men Fellowship',
  'Women Fellowship',
  'Volunteer',
  'Children Church',
  'Media',
  'Community Care',
];

export const FOLLOW_UP_METHOD_OPTIONS = [
  { value: 'call', label: 'Phone Call' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'visit', label: 'Physical Visit' },
];

export const FOLLOW_UP_OUTCOME_OPTIONS = [
  { value: 'no_answer', label: 'No Answer', emoji: '📵' },
  { value: 'spoke', label: 'Spoke With Them', emoji: '💬' },
  { value: 'positive', label: 'Positive Response', emoji: '😊' },
  { value: 'negative', label: 'Negative Response', emoji: '😐' },
  { value: 'will_return', label: 'Will Return', emoji: '🙏' },
  { value: 'not_interested', label: 'Not Interested', emoji: '🚫' },
];

export const WORKFLOW_ACTION_TYPES = [
  'send_message',
  'create_follow_up',
  'notify_care_leader',
  'auto_assign_leader',
  'send_survey',
];

export const SAMPLE_CARE_LEADERS = [
  { id: 'leader-1', name: 'Pastor Ama Owusu', role: 'Care Pastor' },
  { id: 'leader-2', name: 'Bro. Daniel Mensah', role: 'Assimilation Lead' },
  { id: 'leader-3', name: 'Sis. Ruth Nartey', role: 'Follow-up Leader' },
  { id: 'leader-4', name: 'Deacon Joel Grant', role: 'Branch Care Leader' },
];

export const DEFAULT_VISITOR_WORKFLOW = [
  {
    id: 'step-1',
    name: 'Welcome Message',
    day: 0,
    actions: [
      {
        id: 'action-1',
        type: 'send_message',
        channel: 'sms',
        template: 'Visitor welcome',
        preview: 'Thank you for worshipping with us today.',
      },
    ],
  },
  {
    id: 'step-2',
    name: 'Next Day Follow-up',
    day: 1,
    actions: [
      {
        id: 'action-2',
        type: 'create_follow_up',
        method: 'call',
        noteTemplate: 'Call and thank the visitor for joining service.',
      },
      {
        id: 'action-3',
        type: 'notify_care_leader',
        urgency: 'normal',
        message: 'A new visitor needs welcome follow-up.',
      },
    ],
  },
  {
    id: 'step-3',
    name: 'Weekend Survey',
    day: 3,
    actions: [
      {
        id: 'action-4',
        type: 'send_survey',
        channel: 'whatsapp',
      },
    ],
  },
];

export const formatStageLabel = (stage) => VISITOR_STAGE_META[stage]?.label || 'Unknown';

export const getStageMeta = (stage) => VISITOR_STAGE_META[stage] || VISITOR_STAGE_META.new_visitor;

export const formatRelativeDays = (value) => {
  const days = Number(value || 0);
  return days === 1 ? '1 day' : `${days} days`;
};

export const getDaysBetween = (fromDate, toDate = new Date()) => {
  if (!fromDate) {
    return 0;
  }

  const start = new Date(fromDate);
  const end = new Date(toDate);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)) / millisecondsPerDay));
};

export const getNextPendingFollowUp = (followUps = []) =>
  [...followUps]
    .filter((item) => item.status !== 'completed')
    .sort((left, right) => new Date(left.scheduledDate) - new Date(right.scheduledDate))[0] || null;

export const getLastCompletedFollowUp = (followUps = []) =>
  [...followUps]
    .filter((item) => item.status === 'completed')
    .sort((left, right) => new Date(right.completedAt || right.updatedAt || right.scheduledDate) - new Date(left.completedAt || left.updatedAt || left.scheduledDate))[0] || null;

export const getFollowUpStatus = (followUps = []) => {
  const next = getNextPendingFollowUp(followUps);
  if (!next) {
    return 'none';
  }

  const dueDate = new Date(next.scheduledDate);
  const today = new Date();
  return dueDate < new Date(today.setHours(0, 0, 0, 0)) ? 'overdue' : 'upcoming';
};

export const buildVisitorFullName = (visitor = {}) =>
  [visitor.firstName, visitor.lastName].filter(Boolean).join(' ').trim();

export const createCsv = (rows = []) => {
  if (!rows.length) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
};
