import Button from './Button';

export default function EmptyState({
  icon = '○',
  title = 'Nothing here yet',
  message = 'There is no data to display right now.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-[24px] border border-dashed border-white/12 bg-white/[0.03] px-6 py-10 text-center text-white ${className}`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-2xl text-accent">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">{message}</p>
      {actionLabel && onAction ? (
        <Button variant="secondary" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
