export default function DataTable({ columns, data, emptyMessage = 'No records found.' }) {
  return (
    <div className="overflow-x-auto rounded-[18px]">
      <table className="min-w-full divide-y divide-white/10 text-left text-sm">
        <thead className="bg-white/[0.02]">
          <tr className="text-[11px] uppercase tracking-[0.24em] text-white/35">
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3.5 font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06] text-white/80">
          {data.length ? (
            data.map((row, rowIndex) => (
              <tr
                key={row.id || row.tenantId || row.memberId || row.transactionId || rowIndex}
                className="transition hover:bg-white/[0.025]"
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
              <td colSpan={columns.length} className="px-4 py-8 text-center text-white/45">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
