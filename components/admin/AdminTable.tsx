'use client'

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
}

interface AdminTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  keyField: keyof T
}

export function AdminTable<T extends Record<string, unknown>>({ columns, rows, keyField }: AdminTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase text-xs">
          <tr>
            {columns.map(col => (
              <th key={String(col.key)} className="px-4 py-3 text-left font-medium tracking-wider whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {rows.map(row => (
            <tr key={String(row[keyField])} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
              {columns.map(col => (
                <td key={String(col.key)} className="px-4 py-3 text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                  {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-neutral-400">
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
