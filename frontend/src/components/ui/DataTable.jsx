import { useMemo, useState } from 'react'
import { Search, ChevronLeft, ChevronRight, Download, ArrowUpDown, Inbox } from 'lucide-react'
import { cn } from '../../lib/cn'
import Badge from './Badge'
import Button from './Button'
import EmptyState from './EmptyState'

export default function DataTable({
  columns,
  data,
  emptyTitle = 'No data yet',
  emptyDescription,
  searchable = true,
  pageSize = 5,
  exportable = true,
  onExport,
}) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    let rows = [...data]
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter((row) =>
        columns.some((col) => {
          const val = col.accessor ? col.accessor(row) : row[col.key]
          return String(val ?? '').toLowerCase().includes(q)
        })
      )
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey)
      rows.sort((a, b) => {
        const av = col?.accessor ? col.accessor(a) : a[sortKey]
        const bv = col?.accessor ? col.accessor(b) : b[sortKey]
        if (av < bv) return sortDir === 'asc' ? -1 : 1
        if (av > bv) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }
    return rows
  }, [data, search, sortKey, sortDir, columns])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice(page * pageSize, page * pageSize + pageSize)

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (data.length === 0) {
    return <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="space-y-4 min-w-0 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between px-4 sm:px-6 pt-2 min-w-0">
        {searchable && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
            <input
              type="search"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="input-field pl-9 py-2 text-sm"
              aria-label="Search table"
            />
          </div>
        )}
        {exportable && (
          <Button variant="ghost" size="sm" onClick={onExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="border-y border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider',
                    col.sortable && 'cursor-pointer hover:text-muted select-none'
                  )}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && <ArrowUpDown className="w-3 h-3 opacity-50" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.map((row, idx) => (
              <tr key={row.id ?? idx} className="hover:bg-card-hover transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm text-foreground">
                    {col.render ? col.render(row) : col.accessor ? col.accessor(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden px-4 space-y-3 pb-4">
        {paginated.map((row, idx) => (
          <div key={row.id ?? idx} className="card-premium p-4 space-y-2">
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between gap-2 text-sm">
                <span className="text-subtle">{col.label}</span>
                <span className="text-foreground text-right">
                  {col.render ? col.render(row) : col.accessor ? col.accessor(row) : row[col.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {filtered.length > pageSize && (
        <div className="flex items-center justify-between px-6 pb-4 text-sm text-muted">
          <span>
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-card">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-card">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
