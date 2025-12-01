import { ReactNode, useState, useMemo } from "react";
import {
  MoreVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  // Table as TableIcon,
  Plus,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom"; // agar React Router use kar rahe ho
// ya next/navigation ka useRouter agar Next.js hai

export interface Column<T> {
  key: keyof T | "actions";
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

interface CustomTableProps<T extends { id: string | number }> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  createButtonText?: string;
  createButtonPath?: string; // agar navigate karna hai → '/add-user'
  onCreateClick?: () => void; // agar modal kholna hai
  pageSize?: number;
  pageSizeOptions?: number[];
  showPagination?: boolean;
  isLoading?: boolean;
}

export default function CustomTable<T extends { id: string | number }>({
  data,
  columns,
  emptyMessage = "No data found",
  createButtonText = "Create New",
  createButtonPath,
  onCreateClick,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  showPagination = true,
  isLoading = false,
}: CustomTableProps<T>) {
  const navigate = useNavigate?.(); // Next.js mein useRouter() use karna
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useMemo(() => setCurrentPage(1), [data.length, pageSize]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key || isLoading) return data;
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig, isLoading]);
  const totalPages = Math.ceil(sortedData.length / pageSize);

  const paginatedData = useMemo(() => {
    if (!showPagination || isLoading) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, showPagination, isLoading]);

  const hasData = data.length > 0;

  const handleCreateClick = () => {
    if (onCreateClick) {
      onCreateClick(); // modal open karo
    }
    if (createButtonPath && navigate) {
      navigate(createButtonPath); // ya page pe le jao
    }
  };

  const handleSort = (key: keyof T) => {
    if (isLoading) return;
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

  return (
    <div className="w-full space-y-6">
      <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border border-white/30 overflow-hidden">
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
                          ? "cursor-pointer select-none hover:text-blue-700 dark:hover:text-blue-300"
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
            {/* Loading */}
            {isLoading && (
              <>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {columns.map((col) => (
                      <td key={String(col.key)} className="px-6 py-5">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-full max-w-xs" />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}

            {/* No Data + Create Button */}
            {!isLoading && !hasData && (
              <tr>
                <td colSpan={columns.length} className="p-6 text-center">
                  <div className="flex flex-col items-center">
                    <div className="mb-3 p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-full">
                      <Search className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                    </div>
                    <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {emptyMessage}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                      Get started by creating a new entry
                    </p>

                    {/* Create Button - Only show if at least one action is provided */}
                    {(onCreateClick || createButtonPath) && (
                      <button
                        onClick={handleCreateClick}
                        className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                      >
                        <Plus className="w-5 h-5" />
                        {createButtonText}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* Actual Data */}
            {!isLoading &&
              hasData &&
              paginatedData.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`border-b border-gray-100 dark:border-slate-700/50 hover:bg-blue-50/50 dark:hover:bg-slate-700/40 transition-all ${
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
                          <div className="hidden md:flex items-center justify-center gap-2">
                            {col.render?.(item)}
                          </div>
                          <div className="md:hidden">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(
                                  openDropdown === String(item.id)
                                    ? null
                                    : String(item.id)
                                );
                              }}
                              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600"
                            >
                              <MoreVertical className="w-4 h-4" />
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
                            : (item[col.key as keyof T] as any)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && !isLoading && data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
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

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md border border-white/40 hover:bg-blue-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
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
                  className={`min-w-[40px] h-10 px-3 rounded-full font-semibold text-sm transition-all ${
                    currentPage === pageNum
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                      : "bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-700 border border-white/40"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="px-2 text-gray-400">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="min-w-[40px] h-10 px-3 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-700 border border-white/40 font-semibold text-sm"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md border border-white/40 hover:bg-blue-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
