export const volunteerDayKeys = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export const volunteerDayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const volunteerSkillSuggestions = [
  'Singing',
  'Guitar',
  'Piano',
  'Drums',
  'Photography',
  'Videography',
  'Graphic Design',
  'Driving',
  'First Aid',
  'Cooking',
  'Ushering',
  'Security',
  'Childcare',
  'IT/Sound',
  'Other',
];

export const volunteerStatuses = ['active', 'inactive', 'on_leave', 'suspended'];
export const assignmentStatuses = ['assigned', 'confirmed', 'declined', 'attended', 'absent'];

export const getReliabilityTone = (score = 0) => {
  if (score >= 80) {
    return 'emerald';
  }
  if (score >= 60) {
    return 'amber';
  }
  return 'rose';
};

export const getReliabilityClasses = (score = 0) => {
  const tone = getReliabilityTone(score);
  if (tone === 'emerald') {
    return 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-300';
  }
  if (tone === 'amber') {
    return 'border border-amber-400/30 bg-amber-500/15 text-amber-300';
  }
  return 'border border-rose-400/30 bg-rose-500/15 text-rose-300';
};

export const getReliabilityLabel = (score = 0) => {
  if (score >= 80) {
    return 'High';
  }
  if (score >= 60) {
    return 'Medium';
  }
  return 'Low';
};

export const badgeMeta = {
  faithful_servant: { label: 'Faithful Servant', icon: 'FS' },
  dedicated_servant: { label: 'Dedicated Servant', icon: 'DS' },
  pillar_of_service: { label: 'Pillar of Service', icon: 'PS' },
};

export const formatVolunteerBadge = (badge) =>
  badgeMeta[badge]?.label || String(badge || 'badge').replaceAll('_', ' ');

export const buildVolunteerName = (volunteer = {}) =>
  volunteer.memberName || volunteer.name || volunteer.externalName || 'Volunteer';

export const getAvailabilityForDate = (dateValue) => {
  const date = dateValue ? new Date(dateValue) : new Date();
  return volunteerDayKeys[date.getDay()] || 'sunday';
};

export const rosterTabFilters = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'draft', label: 'Draft' },
  { key: 'published', label: 'Published' },
];
