import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileSpreadsheet,
  Plus,
  Inbox,
  X
} from 'lucide-react';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  keyField = 'id',
  title = 'Data Export',
  searchable = true,
  searchPlaceholder = 'Search records...',
  initialSort = { key: null, direction: 'asc' },
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onRowClick = null,
  actions = null,
  emptyTitle = 'No records found',
  emptySubtitle = 'There are no entries matching your search or filter criteria.',
  emptyIcon: EmptyIcon = Inbox,
  onAdd = null,
  addLabel = '+ Add New Record',
  exportable = true,
  onExport = null,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // ─── 1. Sorting Handler ─────────────────────────────────────────────────────
  const handleSort = (key, sortable = true) => {
    if (!sortable) return;
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return { key: null, direction: 'asc' }; // Reset to unsorted
      }
      return { key, direction: 'asc' };
    });
  };

  // ─── 2. Search & Filter ─────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((row) => {
      return columns.some((col) => {
        const val = row[col.key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, columns]);

  // ─── 3. Sort Execution ──────────────────────────────────────────────────────
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Handle numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle strings
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // ─── 4. Pagination Calculation ──────────────────────────────────────────────
  const totalEntries = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));

  // Reset page when search changes
  useMemo(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // ─── 5. Export CSV Helper ───────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (onExport) {
      onExport(sortedData);
      return;
    }

    if (!sortedData || sortedData.length === 0) return;

    // Build CSV Headers
    const headers = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`);

    // Build CSV Rows
    const rows = sortedData.map((row) => {
      return columns
        .map((col) => {
          let val = row[col.key];
          if (val === null || val === undefined) val = '';
          else if (typeof val === 'object') val = JSON.stringify(val);
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const safeTitle = (title || 'export').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${safeTitle}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);

      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* ─────────────────────────────────────────────────────────────
          TOP TOOLBAR: SEARCH, ENTRIES SELECTOR & ACTIONS
      ───────────────────────────────────────────────────────────── */}
      <div className="p-3.5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Universal Debounced Search */}
        {searchable && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Right: Page Size, Custom Toolbar Slot & CSV Export */}
        <div className="flex items-center space-x-2.5 self-end sm:self-center flex-wrap gap-y-2">
          {actions}

          {/* Page Size Selector */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <span className="text-[11px] text-slate-400 font-semibold uppercase hidden md:inline">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#1E40AF] cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} entries
                </option>
              ))}
            </select>
          </div>

          {/* Export to CSV Button */}
          {exportable && (
            <button
              onClick={handleExportCSV}
              disabled={loading || totalEntries === 0}
              title="Export filtered records to CSV / Excel"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold uppercase transition-colors shadow-2xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>
          )}

          {/* Optional Primary Add CTA */}
          {onAdd && (
            <button
              onClick={onAdd}
              className="flex items-center space-x-1 px-3 py-1.5 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#FDE68A]" />
              <span>{addLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TABLE BODY & HEADERS
      ───────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto min-h-[240px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              {columns.map((col) => {
                const isSorted = sortConfig.key === col.key;
                const isSortable = col.sortable !== false;
                const alignCls =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';

                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key, isSortable)}
                    className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 select-none ${alignCls} ${
                      col.width || ''
                    } ${isSortable ? 'cursor-pointer hover:text-slate-800' : ''}`}
                  >
                    <div
                      className={`inline-flex items-center space-x-1.5 ${
                        col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                      }`}
                    >
                      <span className={isSorted ? 'text-[#1E40AF] font-black' : ''}>{col.header}</span>
                      {isSortable && (
                        <span className="shrink-0">
                          {isSorted ? (
                            sortConfig.direction === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-[#1E40AF]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-[#1E40AF]" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 text-slate-300 opacity-60" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              // Skeleton loading rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((col, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2.5 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                      <EmptyIcon className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-800">{emptyTitle}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{emptySubtitle}</p>
                    </div>
                    {onAdd && (
                      <button
                        onClick={onAdd}
                        className="mt-2 flex items-center space-x-1.5 px-4 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#FDE68A]" />
                        <span>{addLabel}</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Data rows
              paginatedData.map((row, rowIdx) => {
                const keyVal = row[keyField] ?? `row-${startIndex + rowIdx}`;
                const isClickable = !!onRowClick;

                return (
                  <tr
                    key={keyVal}
                    onClick={() => isClickable && onRowClick(row)}
                    className={`transition-colors text-xs text-slate-700 ${
                      isClickable ? 'cursor-pointer hover:bg-blue-50/40' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {columns.map((col) => {
                      const val = row[col.key];
                      const alignCls =
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left';

                      return (
                        <td key={col.key} className={`px-4 py-3 ${alignCls} ${col.width || ''}`}>
                          {col.render ? col.render(val, row, startIndex + rowIdx) : val ?? '-'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PAGINATION BAR & RANGE INDICATOR
      ───────────────────────────────────────────────────────────── */}
      {!loading && totalEntries > 0 && (
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Range text */}
          <div className="text-slate-500 font-medium">
            Showing <strong className="text-slate-800 font-semibold">{totalEntries > 0 ? startIndex + 1 : 0}</strong> to{' '}
            <strong className="text-slate-800 font-semibold">{endIndex}</strong> of{' '}
            <strong className="text-slate-800 font-semibold">{totalEntries}</strong> entries
            {searchTerm && <span className="text-slate-400 italic ml-1">(filtered from {data.length} total)</span>}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-1 self-end sm:self-center">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="First Page"
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              {/* Prev Page */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title="Previous Page"
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Page Number Buttons */}
              {getPageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-md text-xs font-bold transition-all border ${
                    currentPage === pageNum
                      ? 'bg-[#1E40AF] text-white border-[#1E40AF] shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                title="Next Page"
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                title="Last Page"
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

