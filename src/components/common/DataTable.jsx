import { useState, useMemo } from 'react'
import Button from './Button'

function renderCell(col, row, index) {
    if (!col.render) return row?.[col.key]
    const val = row?.[col.key]

    // If col.render accepts 2 or more arguments (e.g. (val, row) or (_, row)):
    if (typeof col.render === 'function' && col.render.length >= 2) {
        try {
            return col.render(val, row, index)
        } catch {
            try {
                return col.render(row, val, index)
            } catch {
                return val
            }
        }
    }

    // col.render accepts 0 or 1 argument:
    // First try calling with (val, row, index)
    try {
        const res = col.render(val, row, index)
        const isSuspicious =
            res === undefined ||
            res === 'undefined' ||
            (typeof res === 'string' && (res.includes('undefined') || res.includes('NaN')))

        if (!isSuspicious) {
            return res
        }
    } catch {
        // Ignored, proceed to fallback
    }

    // Fallback: caller expected full row as first argument (e.g. render: (row) => row.something)
    try {
        const resRow = col.render(row, val, index)
        if (resRow !== undefined) {
            return resRow
        }
    } catch {
        // Ignored
    }

    return val
}

function DataTable({
    columns = [],
    data = [],
    keyField = 'id',
    onRowClick,
    pageSize = 8,
    emptyState,
    className = '',
}) {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
    const [currentPage, setCurrentPage] = useState(1)

    const handleSort = (columnKey, sortable) => {
        if (!sortable) return
        setSortConfig((prev) => {
            if (prev.key === columnKey) {
                return {
                    key: columnKey,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc',
                }
            }
            return { key: columnKey, direction: 'asc' }
        })
    }

    const sortedData = useMemo(() => {
        if (!sortConfig.key) return data
        return [...data].sort((a, b) => {
            const valA = a[sortConfig.key]
            const valB = b[sortConfig.key]
            if (valA === valB) return 0
            if (valA == null) return 1
            if (valB == null) return -1
            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortConfig.direction === 'asc' ? valA - valB : valB - valA
            }
            return sortConfig.direction === 'asc'
                ? String(valA).localeCompare(String(valB))
                : String(valB).localeCompare(String(valA))
        })
    }, [data, sortConfig])

    const totalPages = pageSize ? Math.ceil(sortedData.length / pageSize) : 1
    const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages || 1)

    const paginatedData = useMemo(() => {
        if (!pageSize) return sortedData
        const start = (safeCurrentPage - 1) * pageSize
        return sortedData.slice(start, start + pageSize)
    }, [sortedData, safeCurrentPage, pageSize])

    return (
        <div className={`data-table-container ${className}`.trim()}>
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={col.sortable ? 'sortable' : ''}
                                style={{
                                    width: col.width,
                                    textAlign: col.align || 'left',
                                }}
                                onClick={() => handleSort(col.key, col.sortable)}
                            >
                                {col.label || col.header || col.title}
                                {col.sortable && (
                                    <span style={{ marginLeft: '6px', opacity: 0.6 }}>
                                        {sortConfig.key === col.key
                                            ? sortConfig.direction === 'asc'
                                                ? '▲'
                                                : '▼'
                                            : '↕'}
                                    </span>
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.length > 0 ? (
                        paginatedData.map((row, index) => (
                            <tr
                                key={row[keyField] || index}
                                className={onRowClick ? 'row-clickable' : ''}
                                onClick={() => onRowClick?.(row)}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        style={{ textAlign: col.align || 'left' }}
                                    >
                                        {renderCell(col, row, index)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={columns.length}
                                style={{ textAlign: 'center', padding: '36px' }}
                            >
                                {emptyState || 'No records found.'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {pageSize && totalPages > 1 && (
                <div className="data-table-pagination">
                    <span>
                        Showing{' '}
                        <strong>
                            {(safeCurrentPage - 1) * pageSize + 1}-
                            {Math.min(safeCurrentPage * pageSize, sortedData.length)}
                        </strong>{' '}
                        of <strong>{sortedData.length}</strong> items
                    </span>

                    <div className="pagination-controls">
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={safeCurrentPage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={safeCurrentPage >= totalPages}
                            onClick={() =>
                                setCurrentPage((p) => Math.min(p + 1, totalPages))
                            }
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DataTable
