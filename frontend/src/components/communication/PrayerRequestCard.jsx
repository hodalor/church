import { HandHeart } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatDate } from '../../utils/formatDate';

const urgencyTone = {
  critical: 'primary',
  urgent: 'accent',
  normal: 'success',
};

export default function PrayerRequestCard({
  request,
  canModify = false,
  canChangeStatus = false,
  onAssignToMe,
  onStatusChange,
  onPray,
}) {
  return (
    <Card className="space-y-4 rounded-2xl bg-white/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={urgencyTone[request.urgency] || 'primary'}>{request.urgency || 'normal'}</Badge>
        <Badge tone="accent">{request.category || 'general'}</Badge>
        <Badge tone="primary">{String(request.status || 'open').replaceAll('_', ' ')}</Badge>
      </div>

      <div>
        <h3 className="text-base font-semibold text-white">{request.title}</h3>
        <p className="mt-2 text-sm text-white/65">{request.description}</p>
      </div>

      <div className="grid gap-2 text-sm text-white/55">
        <p>{request.isAnonymous ? 'Anonymous' : request.memberName || 'Church member'}</p>
        <p>{formatDate(request.createdAt)}</p>
        <p>{request.prayerCount || 0} people praying</p>
        <p>{request.assignedTo?.name ? `Assigned to ${request.assignedTo.name}` : 'Unassigned'}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onPray}>
          <HandHeart className="mr-2 h-4 w-4" />
          Pray
        </Button>
        {canModify ? (
          <Button variant="subtle" onClick={onAssignToMe}>
            {request.assignedTo?.name ? 'Reassign' : 'Assign to Me'}
          </Button>
        ) : null}
        {canChangeStatus ? (
          <select
            value={request.status || 'open'}
            onChange={(event) => onStatusChange?.(event.target.value)}
            className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white"
          >
            <option value="open">Open</option>
            <option value="in_prayer">In Prayer</option>
            <option value="answered">Answered</option>
            <option value="closed">Closed</option>
          </select>
        ) : null}
      </div>
    </Card>
  );
}
