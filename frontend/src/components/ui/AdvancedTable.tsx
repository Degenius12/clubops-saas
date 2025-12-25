import React, { useState, useMemo } from 'react'
import {
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

type SortDirection = 'asc' | 'desc' | null

interface Column<T> {
  key: keyof T | string
  header: string
  sortable?: boolean
  filterable?: boolean
  render?: (row: T) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface AdvancedTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
  searchable?: boolean
  exportable?: boolean
  className?: string
}

/**
 * Advanced Table - Retool/Airtable inspired
 * Sorting, filtering, search, export
 */
export function AdvancedTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  searchable = true,
  exportable = true,
  className = ''
}: AdvancedTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})

  // Handle column sort
  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return

    if (sortColumn === column.key) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortColumn(null)
      }
    } else {
      setSortColumn(column.key)
      setSortDirection('asc')
    }
  }

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data]

    // Apply search
    if (searchQuery) {
      result = result.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (filterValue) {
        result = result.filter(row =>
          String(row[key]).toLowerCase().includes(filterValue.toLowerCase())
        )
      }
    })

    // Apply sorting
    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        const aValue = a[sortColumn]
        const bValue = b[sortColumn]

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
        }

        const aStr = String(aValue).toLowerCase()
        const bStr = String(bValue).toLowerCase()

        if (sortDirection === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0
        }
      })
    }

    return result
  }, [data, searchQuery, filters, sortColumn, sortDirection])

  // Export to CSV
  const handleExport = () => {
    const headers = columns.map(col => col.header).join(',')
    const rows = processedData.map(row =>
      columns.map(col => {
        const value = row[col.key]
        // Escape commas and quotes
        return typeof value === 'string' && value.includes(',')
          ? `"${value.replace(/"/g, '""')}"`
          : value
      }).join(',')
    )

    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `export-${Date.now()}.csv`
    a.click()
  }

  // Get sort icon
  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null

    if (sortColumn === column.key) {
      return sortDirection === 'asc' ? (
        <ChevronUpIcon className="h-4 w-4" />
      ) : (
        <ChevronDownIcon className="h-4 w-4" />
      )
    }

    return <ChevronUpDownIcon className="h-4 w-4 opacity-30" />
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        {searchable && (
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-premium pl-10"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {exportable && (
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-premium">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    style={{ width: column.width }}
                    className={`
                      ${column.sortable ? 'cursor-pointer select-none hover:bg-white/[0.02]' : ''}
                      ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''}
                    `}
                    onClick={() => column.sortable && handleSort(column)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.header}</span>
                      {getSortIcon(column)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12">
                    <p className="text-sm text-text-tertiary">No data found</p>
                  </td>
                </tr>
              ) : (
                processedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    onClick={() => onRowClick?.(row)}
                    className={onRowClick ? 'cursor-pointer' : ''}
                  >
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={`
                          ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''}
                        `}
                      >
                        {column.render ? column.render(row) : String(row[column.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {processedData.length > 0 && (
          <div className="px-6 py-4 bg-midnight-900/50 border-t border-white/[0.06] flex items-center justify-between text-sm">
            <span className="text-text-tertiary">
              Showing {processedData.length} of {data.length} rows
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Quick Table - Simpler variant without features
 */
export function QuickTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick
}: {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
}) {
  return (
    <div className="card-premium overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-premium">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} style={{ width: column.width }}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {columns.map((column) => (
                  <td key={String(column.key)}>
                    {column.render ? column.render(row) : String(row[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Example Usage:
 *
 * interface Dancer {
 *   id: number
 *   name: string
 *   status: 'active' | 'inactive'
 *   revenue: number
 *   shifts: number
 * }
 *
 * const columns: Column<Dancer>[] = [
 *   { key: 'name', header: 'Name', sortable: true },
 *   {
 *     key: 'status',
 *     header: 'Status',
 *     render: (row) => (
 *       <span className={row.status === 'active' ? 'badge-success' : 'badge-danger'}>
 *         {row.status}
 *       </span>
 *     )
 *   },
 *   {
 *     key: 'revenue',
 *     header: 'Revenue',
 *     sortable: true,
 *     align: 'right',
 *     render: (row) => <span className="tabular-nums">${row.revenue.toLocaleString()}</span>
 *   },
 *   { key: 'shifts', header: 'Shifts', sortable: true, align: 'right' }
 * ]
 *
 * <AdvancedTable
 *   data={dancers}
 *   columns={columns}
 *   onRowClick={(dancer) => navigate(`/dancers/${dancer.id}`)}
 * />
 */
