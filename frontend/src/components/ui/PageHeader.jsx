export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/52">
          {title}
        </p>
        {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
