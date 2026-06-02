import Badge from '../ui/Badge';

const statusToneMap = {
  draft: 'primary',
  scheduled: 'accent',
  sending: 'accent',
  sent: 'success',
  failed: 'primary',
  cancelled: 'primary',
};

export default function BroadcastStatusBadge({ status }) {
  const normalized = String(status || 'draft').toLowerCase();
  const label = normalized.replaceAll('_', ' ');

  return <Badge tone={statusToneMap[normalized] || 'primary'}>{label}</Badge>;
}
