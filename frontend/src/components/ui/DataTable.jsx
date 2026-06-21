export default function DataTable({ columns, data, emptyMessage = 'No records found.', tone = 'dark' }) {
  const isLight = tone === 'light';
  const tableClass = isLight
    ? 'min-w-full divide-y divide-slate-200 text-left text-sm'
    : 'min-w-full divide-y divide-white/10 text-left text-sm';
  const headerClass = isLight ? 'bg-slate-50' : 'bg-white/[0.02]';
  const headerRowClass = isLight
    ? 'text-[11px] uppercase tracking-[0.24em] text-slate-500'
    : 'text-[11px] uppercase tracking-[0.24em] text-white/35';
  const bodyClass = isLight
    ? 'divide-y divide-slate-200 text-slate-700'
    : 'divide-y divide-white/[0.06] text-white/80';
  const hoverClass = isLight ? 'transition hover:bg-slate-50' : 'transition hover:bg-white/[0.025]';
  const emptyClass = isLight ? 'px-4 py-8 text-center text-slate-500' : 'px-4 py-8 text-center text-white/45';

  return (
    <div className="overflow-x-auto rounded-[18px]">
      <table className={tableClass}>
        <thead className={headerClass}>
          <tr className={headerRowClass}>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3.5 font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={bodyClass}>
          {data.length ? (
            data.map((row, rowIndex) => (
              <tr
                key={row.id || row.tenantId || row.memberId || row.transactionId || rowIndex}
                className={hoverClass}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3.5 align-middle">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className={emptyClass}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
