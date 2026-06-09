import { getApprovalStatusClasses, getRegistrationStatusClasses } from '../../utils/events';

export default function RegistrationStatusBadge({ status, mode = 'registration' }) {
  const classes =
    mode === 'approval' ? getApprovalStatusClasses(status) : getRegistrationStatusClasses(status);

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>
      {String(status || 'pending').replaceAll('_', ' ')}
    </span>
  );
}
