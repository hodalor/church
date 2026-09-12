export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 lg:text-[2rem]">{title}</h1>
        {subtitle ? <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
