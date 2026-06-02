import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { getInitials } from '../../utils/attendance';

const variants = {
  success: {
    icon: CheckCircle2,
    shell: 'bg-emerald-500/92 text-white',
    label: 'CHECKED IN',
  },
  warning: {
    icon: AlertTriangle,
    shell: 'bg-amber-500/92 text-[#101827]',
    label: 'Already checked in earlier',
  },
  error: {
    icon: XCircle,
    shell: 'bg-red-600/92 text-white',
    label: 'Check-in failed',
  },
};

export default function CheckInSuccessOverlay({ member, onDismiss, variant = 'success' }) {
  const config = variants[variant] || variants.success;
  const Icon = config.icon;

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss?.(), 2000);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  if (!member) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-[80] flex items-center justify-center px-6 ${config.shell}`}>
      <div className="text-center">
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={member.name}
            className="mx-auto h-28 w-28 rounded-full border-4 border-white/30 object-cover shadow-2xl"
          />
        ) : (
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/25 bg-white/10 text-3xl font-semibold">
            {getInitials(member.name)}
          </div>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Icon className="h-10 w-10" />
          <p className="text-3xl font-bold uppercase tracking-[0.2em]">{config.label}</p>
        </div>
        <p className="mt-4 text-4xl font-semibold">{member.name || member.memberName || 'Guest'}</p>
        <p className="mt-3 text-lg opacity-90">{member.timeLabel || member.message || ''}</p>
      </div>
    </div>
  );
}
