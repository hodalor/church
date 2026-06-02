import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import Input from '../ui/Input';
import Card from '../ui/Card';
import MemberSearchInput from '../finance/MemberSearchInput';
import { previewBroadcastAudience } from '../../api/endpoints/communication';

const audienceOptions = [
  { value: 'all_members', label: 'All Members' },
  { value: 'branch', label: 'By Branch' },
  { value: 'department', label: 'By Department' },
  { value: 'cell_group', label: 'By Cell Group' },
  { value: 'role', label: 'By Role' },
  { value: 'specific_members', label: 'Specific Members' },
  { value: 'first_timers', label: 'First Timers' },
];

const departmentOptions = ['Choir', 'Protocol', 'Media', 'Ushering', 'Children', 'Prayer'];
const roleOptions = [
  'head_pastor',
  'associate_pastor',
  'branch_pastor',
  'care_leader',
  'media_team',
  'volunteer_leader',
  'member',
];

export default function AudienceSelector({
  value,
  onChange,
  title = 'Audience',
  message = '',
  channels = ['in_app'],
}) {
  const audience = useMemo(() => value || { type: 'all_members' }, [value]);
  const previewPayload = useMemo(
    () => ({
      title: title || 'Preview',
      message: message || 'Preview message',
      channels,
      audience,
    }),
    [audience, channels, message, title],
  );

  const previewQuery = useQuery({
    queryKey: ['communication-audience-preview', previewPayload],
    queryFn: () => previewBroadcastAudience(previewPayload),
    enabled: Boolean(audience?.type && message),
    staleTime: 30000,
  });

  const setField = (key, fieldValue) => {
    onChange?.({
      ...audience,
      [key]: fieldValue,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {audienceOptions.map((option) => {
          const active = audience.type === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange?.({ type: option.value, departments: [], memberIds: [] })}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                active
                  ? 'border-accent/50 bg-accent/10 text-accent'
                  : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/8'
              }`}
            >
              <p className="text-sm font-semibold">{option.label}</p>
            </button>
          );
        })}
      </div>

      {audience.type === 'branch' ? <Input label="Branch" value={audience.branch || ''} onChange={(event) => setField('branch', event.target.value)} placeholder="Main branch" /> : null}

      {audience.type === 'department' ? (
        <label className="block space-y-2">
          <span className="text-sm font-medium text-white/75">Departments</span>
          <div className="grid gap-2 md:grid-cols-3">
            {departmentOptions.map((option) => {
              const selected = (audience.departments || []).includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setField(
                      'departments',
                      selected
                        ? (audience.departments || []).filter((item) => item !== option)
                        : [...(audience.departments || []), option],
                    )
                  }
                  className={`rounded-2xl border px-3 py-3 text-sm ${
                    selected ? 'border-accent/50 bg-accent/10 text-accent' : 'border-white/10 bg-white/5 text-white/70'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </label>
      ) : null}

      {audience.type === 'cell_group' ? <Input label="Cell Group" value={audience.cellGroup || ''} onChange={(event) => setField('cellGroup', event.target.value)} placeholder="Cell group name" /> : null}

      {audience.type === 'role' ? (
        <label className="block space-y-2">
          <span className="text-sm font-medium text-white/75">Role</span>
          <div className="relative">
            <select
              value={audience.role || ''}
              onChange={(event) => setField('role', event.target.value)}
              className="w-full appearance-none rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none focus:border-accent"
            >
              <option value="">Select role</option>
              {roleOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          </div>
        </label>
      ) : null}

      {audience.type === 'specific_members' ? (
        <div className="space-y-3">
          <MemberSearchInput
            value={null}
            onSelect={(selected) => {
              const nextIds = new Set([...(audience.memberIds || []), selected.memberId]);
              setField('memberIds', [...nextIds]);
            }}
            onClear={() => {}}
            placeholder="Search and add members"
          />
          {(audience.memberIds || []).length ? (
            <div className="flex flex-wrap gap-2">
              {audience.memberIds.map((memberId) => (
                <button
                  key={memberId}
                  type="button"
                  onClick={() => setField('memberIds', audience.memberIds.filter((item) => item !== memberId))}
                  className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
                >
                  {memberId} x
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <Card className="rounded-2xl bg-white/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Estimated Reach</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {previewQuery.data?.recipientCount ?? audience.estimatedReach ?? 0} members will receive this message
            </p>
            <p className="mt-2 text-sm text-white/55">
              {previewQuery.data?.missingPhoneCount || 0} members have no phone number. SMS will skip them.
            </p>
          </div>
          {previewQuery.data ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : null}
        </div>
      </Card>
    </div>
  );
}
