import React from 'react';

function clsx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export default function Skeleton({ className = '', style, children = null }) {
  return (
    <div className={clsx('animate-pulse rounded-xl bg-white/8', className)} style={style}>
      {children}
    </div>
  );
}

export function CardSkeleton({ className = '' }) {
  return (
    <div className={clsx('rounded-[20px] border border-white/8 bg-[#0d1320] p-4', className)}>
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-8 w-24" />
      <Skeleton className="mt-3 h-3 w-40" />
      <Skeleton className="mt-6 h-24 w-full rounded-2xl" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 5, rows = 5 }) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-white/8 bg-[#0d1320]">
      <div
        className="grid gap-3 border-b border-white/8 px-4 py-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-3 w-3/4" />
        ))}
      </div>
      <div className="space-y-3 px-4 py-4">
        {Array.from({ length: rows }).map((_, row) => (
          <div
            key={row}
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((__, col) => (
              <Skeleton key={`${row}-${col}`} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ className = '' }) {
  return (
    <div className={clsx('rounded-[20px] border border-white/8 bg-[#0d1320] p-4', className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-6 w-44" />
      <div className="mt-6 grid h-64 grid-cols-12 items-end gap-2">
        {Array.from({ length: 12 }).map((_, index) => (
          <Skeleton
            key={index}
            className="rounded-t-xl"
            style={{ height: `${44 + (index % 5) * 26}px` }}
          />
        ))}
      </div>
    </div>
  );
}
