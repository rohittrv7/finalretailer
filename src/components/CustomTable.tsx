import React, { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { CustomTableProps, SortConfig } from "../types/common";

const perPageOptions: number[] = [5, 10, 25, 50];

export default function CustomTable<T extends Record<string, any>>({
  data,
  columns,
  sortable = true,
  onRowClick,
  emptyMessage = "No data available",
}: CustomTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);

  const handleSort = (columnId: string, isSortable: boolean) => {
    if (!isSortable) return;

    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === columnId && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (
      sortConfig?.key === columnId &&
      sortConfig.direction === "desc"
    ) {
      setSortConfig(null);
      return;
    }
    setSortConfig({ key: columnId, direction });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const column = columns.find((col) => col.id === sortConfig.key);
      if (!column?.accessor) return 0;

      const aValue =
        typeof column.accessor === "function"
          ? column.accessor(a)
          : a[column.accessor as string];
      const bValue =
        typeof column.accessor === "function"
          ? column.accessor(b)
          : b[column.accessor as string];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig, columns]);

  const totalItems: number = sortedData.length;
  const totalPages: number = Math.ceil(totalItems / perPage);
  const startIndex: number = (currentPage - 1) * perPage;
  const endIndex: number = Math.min(startIndex + perPage, totalItems);
  const paginatedData: T[] = sortedData.slice(startIndex, endIndex);

  const handlePageChange = (page: number): void => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePerPageChange = (value: number): void => {
    setPerPage(value);
    setCurrentPage(1);
  };

  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-red-500">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
          {/* <thead className="border border-red-500"> */}
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`px-6 py-4 text-left text-sm font-semibold text-gray-700 ${
                    column.sortable !== false && sortable
                      ? "cursor-pointer select-none hover:bg-slate-200 transition-colors"
                      : ""
                  }`}
                  onClick={() =>
                    handleSort(column.id, column.sortable !== false && sortable)
                  }
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {column.sortable !== false && sortable && (
                      <div className="flex flex-col">
                        <ChevronUp
                          className={`h-3 w-3 -mb-1 ${
                            sortConfig?.key === column.id &&
                            sortConfig.direction === "asc"
                              ? "text-blue-600"
                              : "text-gray-400"
                          }`}
                        />
                        <ChevronDown
                          className={`h-3 w-3 ${
                            sortConfig?.key === column.id &&
                            sortConfig.direction === "desc"
                              ? "text-blue-600"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={(row as any).id || rowIndex}
                  className={`hover:bg-slate-50 transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className="px-6 py-4 text-sm text-gray-800"
                    >
                      {column.cell
                        ? column.cell(
                            typeof column.accessor === "function"
                              ? column.accessor(row)
                              : row[column.accessor as string],
                            row
                          )
                        : typeof column.accessor === "function"
                        ? column.accessor(row)
                        : row[column.accessor as string]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <select
              value={perPage}
              onChange={(e) => handlePerPageChange(Number(e.target.value))}
              className="px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer"
            >
              {perPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600 font-medium">
              Entries Per Page
            </span>
          </div>

          <div className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {startIndex + 1}
            </span>{" "}
            to <span className="font-semibold text-gray-900">{endIndex}</span>{" "}
            of <span className="font-semibold text-gray-900">{totalItems}</span>{" "}
            results
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {getPageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pageNum === currentPage
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === totalPages
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
