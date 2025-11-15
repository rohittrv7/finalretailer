import { ReactNode, useState, useMemo } from "react";
import {
  MoreVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface Column<T> {
  key: keyof T | "actions";
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

interface CustomTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
}

export default function CustomTable<T extends { id: string | number }>({
  data,
  columns,
  emptyMessage = "No data found",
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
}: CustomTableProps<T>) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Reset page when data or pageSize changes
  useMemo(() => setCurrentPage(1), [data.length, pageSize]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: keyof T) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (colKey: keyof T) => {
    if (!sortConfig.key || sortConfig.key !== colKey)
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5" />
    );
  };

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Table Container - NO SCROLLBAR */}
      <div className="w-full rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border border-white/30">
        <div className="w-full overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700">
                {columns.map((col) => {
                  const isSortable = col.sortable && col.key !== "actions";
                  const alignClass = {
                    left: "justify-start",
                    center: "justify-center",
                    right: "justify-end",
                  }[col.align || "left"];

                  return (
                    <th
                      key={String(col.key)}
                      className={`px-6 py-4 font-semibold text-blue-600 dark:text-blue-400 ${
                        col.className || ""
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 text-sm ${alignClass} ${
                          isSortable
                            ? "cursor-pointer select-none hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            : ""
                        }`}
                        onClick={() =>
                          isSortable && handleSort(col.key as keyof T)
                        }
                      >
                        <span className="whitespace-nowrap">{col.header}</span>
                        {isSortable && getSortIcon(col.key as keyof T)}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`border-b border-gray-100 dark:border-slate-700/50 hover:bg-blue-50/50 dark:hover:bg-slate-700/40 transition-all duration-200 ${
                    idx % 2 === 0
                      ? "bg-gray-50/30 dark:bg-slate-800/30"
                      : "bg-white dark:bg-slate-800/10"
                  }`}
                >
                  {columns.map((col) => {
                    const alignClass = {
                      left: "text-left",
                      center: "text-center",
                      right: "text-right",
                    }[col.align || "left"];

                    if (col.key === "actions") {
                      return (
                        <td
                          key="actions"
                          className={`px-6 py-4 ${alignClass} relative`}
                        >
                          {/* Desktop Actions */}
                          <div className="hidden md:flex items-center justify-center gap-2">
                            {col.render?.(item)}
                          </div>
                          {/* Mobile Dropdown */}
                          <div className="md:hidden flex justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(
                                  openDropdown === String(item.id)
                                    ? null
                                    : String(item.id)
                                );
                              }}
                              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                            {openDropdown === String(item.id) && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setOpenDropdown(null)}
                                />
                                <div className="absolute right-6 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 z-50 py-2">
                                  {col.render?.(item)}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={String(col.key)}
                        className={`px-6 py-4 ${alignClass} ${
                          col.className || ""
                        } text-sm text-gray-700 dark:text-gray-300`}
                      >
                        <div className="break-words">
                          {col.render
                            ? col.render(item)
                            : (item[col.key as keyof T] as ReactNode)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        {/* Rows per page selector */}
        <div className="flex items-center gap-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-md border border-white/40">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Rows per page
          </span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="bg-transparent text-sm font-semibold text-blue-600 dark:text-blue-400 focus:outline-none cursor-pointer"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Page info */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {(currentPage - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {Math.min(currentPage * pageSize, sortedData.length)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {sortedData.length}
          </span>{" "}
          entries
        </div>

        {/* Pagination buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2.5 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md border border-white/40 hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-200 dark:hover:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) pageNum = i + 1;
            else if (currentPage <= 3) pageNum = i + 1;
            else if (currentPage >= totalPages - 2)
              pageNum = totalPages - 4 + i;
            else pageNum = currentPage - 2 + i;

            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`min-w-[40px] h-10 px-3 rounded-full font-semibold text-sm transition-all duration-200 ${
                  currentPage === pageNum
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105"
                    : "bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-700 border border-white/40 hover:border-blue-200 dark:hover:border-blue-500"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="px-2 text-gray-400 dark:text-gray-500">...</span>
              <button
                onClick={() => setCurrentPage(totalPages)}
                className="min-w-[40px] h-10 px-3 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-700 border border-white/40 hover:border-blue-200 dark:hover:border-blue-500 transition-all duration-200 font-semibold text-sm"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2.5 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md border border-white/40 hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-200 dark:hover:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
