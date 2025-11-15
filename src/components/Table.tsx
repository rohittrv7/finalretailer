import HighlightText from "@/components/HighlightedText";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import React, { useMemo, useState } from "react";

const perPageValues = [5, 10, 25, 50, 100];

export interface TableColumn<T> {
  id: string;
  header: React.ReactNode;
  accessor?: keyof T | ((row: T) => T[keyof T]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cell?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  width?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  className?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  headerClassName?: string;
  tableClassName?: string;
  bodyClassName?: string;
  onRowClick?: (row: T, index: number) => void;
  sortable?: boolean;
  pagination?: {
    pageSize?: number;
    currentPage?: number;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    totalItems?: number;
  };
  isLoading?: boolean;
  loadingRows?: number;
  emptyState?: React.ReactNode;
  keyExtractor?: (row: T, index: number) => string | number;
  afterHeaderContent?: React.ReactNode;
  searchedTerm?: string;
  highlightColumns?: string[];
}

function CustomTable<T extends object>({
  data,
  columns,
  className,
  rowClassName,
  headerClassName,
  tableClassName,
  bodyClassName,
  onRowClick,
  sortable = true,
  pagination,
  isLoading = false,
  loadingRows = 5,
  emptyState,
  keyExtractor,
  afterHeaderContent,
  searchedTerm,
  highlightColumns,
}: Readonly<TableProps<T>>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const handleSort = (columnId: string) => {
    if (!sortable) return;

    let direction: "asc" | "desc" = "asc";

    if (sortConfig?.key === columnId && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (
      sortConfig?.key === columnId &&
      sortConfig.direction === "desc"
    ) {
      return setSortConfig(null);
    }

    setSortConfig({ key: columnId, direction });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const column = columns.find((col) => col.id === sortConfig.key);
      if (!column) return 0;

      let aValue;
      let bValue;

      if (typeof column.accessor === "function") {
        aValue = column.accessor(a);
        bValue = column.accessor(b);
      } else if (column.accessor) {
        aValue = a[column.accessor as keyof T];
        bValue = b[column.accessor as keyof T];
      } else {
        return 0;
      }

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

  const renderCellContent = (
    row: T,
    column: TableColumn<T>,
    rowIndex: number,
    pagination?: { currentPage?: number; pageSize?: number }
  ) => {
    const currentPage = pagination?.currentPage ?? 1;
    const pageSize = pagination?.pageSize ?? 10;
    const globalIndex = (currentPage - 1) * pageSize + rowIndex;
    const emptySymbol = "N/A";

    if (column.cell) {
      const value =
        typeof column.accessor === "function"
          ? column.accessor(row)
          : column.accessor
          ? row[column.accessor as keyof T]
          : undefined;

      if (
        highlightColumns?.includes(
          typeof column.accessor === "string" ? column.accessor : column.id
        ) &&
        typeof value === "string" &&
        searchedTerm
      ) {
        return (
          <HighlightText
            text={value || emptySymbol}
            searchTerm={searchedTerm}
          />
        );
      }

      const cellResult =
        value !== undefined ? column.cell(value, row, globalIndex) : null;

      if (
        !cellResult ||
        (typeof cellResult === "string" && cellResult.trim() === "")
      ) {
        return emptySymbol;
      }

      return cellResult;
    }

    if (typeof column.accessor === "function") {
      const value = column.accessor(row);

      if (!value || (typeof value === "string" && value.trim() === "")) {
        return emptySymbol;
      }

      return value;
    }

    if (column.accessor) {
      const value = row[column.accessor as keyof T];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        return emptySymbol;
      }

      return value as React.ReactNode;
    }

    return emptySymbol;
  };

  const renderLoadingSkeleton = () => {
    return Array(loadingRows)
      .fill(0)
      .map((_, rowIndex) => (
        <tr
          key={`loading-row-${rowIndex}`}
          className="animate-shimmer bg-gradient-to-r from-transparent via-gray-100 to-transparent bg-[length:200%_100%]"
        >
          {columns.map((column, cellIndex) => (
            <td
              key={`loading-cell-${rowIndex}-${cellIndex}`}
              className={cn("px-4 py-3", column.className)}
            >
              <div className="h-5 w-4/5 rounded-md bg-gray-200 opacity-70"></div>
            </td>
          ))}
        </tr>
      ));
  };

  const showEmpty = !isLoading && data.length === 0;

  return (
    <div className={cn("w-full !rounded-md", className)}>
      <div className="custom-scrollbar w-full overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table
              className={cn(
                "min-w-full divide-y divide-gray-200",
                tableClassName
              )}
            >
              <thead
                className={cn(
                  "bg-sidebarBackgroundColor text-left",
                  headerClassName
                )}
              >
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.id}
                      className={cn(
                        "px-4 py-3 font-medium text-black transition-colors",
                        column?.sortable && sortable && "cursor-pointer",
                        column.className,
                        column.width ? `w-[${column.width}]` : ""
                      )}
                      onClick={() =>
                        column?.sortable && sortable && handleSort(column.id)
                      }
                      style={column.width ? { width: column.width } : {}}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.header}</span>
                        {column?.sortable && sortable && (
                          <span className="flex flex-col">
                            <ChevronUp
                              className={cn(
                                "-mb-1 h-3 w-3",
                                sortConfig?.key === column.id &&
                                  sortConfig.direction === "asc"
                                  ? "text-black"
                                  : "text-gray-400"
                              )}
                            />
                            <ChevronDown
                              className={cn(
                                "h-3 w-3",
                                sortConfig?.key === column.id &&
                                  sortConfig.direction === "desc"
                                  ? "text-black"
                                  : "text-gray-400"
                              )}
                            />
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Render custom content after header if provided */}
              {afterHeaderContent && (
                <tbody className="w-full">
                  <tr>
                    <td colSpan={columns.length} className="border-0 p-0">
                      {afterHeaderContent}
                    </td>
                  </tr>
                </tbody>
              )}

              <tbody className={cn("divide-y divide-gray-200", bodyClassName)}>
                {isLoading ? (
                  renderLoadingSkeleton()
                ) : showEmpty ? (
                  <tr>
                    <td colSpan={columns.length} className="py-10 text-center">
                      {emptyState ?? (
                        <div className="text-muted-foreground flex flex-col items-center justify-center space-y-2">
                          <p>No data available</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  sortedData?.map((row, index) => {
                    const rowKey = keyExtractor
                      ? keyExtractor(row, index)
                      : index;
                    const rowClasses =
                      typeof rowClassName === "function"
                        ? rowClassName(row, index)
                        : rowClassName;

                    return (
                      <tr
                        key={rowKey}
                        className={cn(
                          "table-cell-fade-in border-b border-gray-100",
                          rowClasses,
                          onRowClick && "cursor-default hover:bg-gray-50"
                        )}
                        style={{ animationDelay: `${index * 30}ms` }}
                        onClick={() => onRowClick && onRowClick(row, index)}
                      >
                        {columns.map((column, colIndex) => (
                          <td
                            key={`${rowKey}-${column.id}-${colIndex}`}
                            className={cn(
                              "px-4 py-3 text-gray-800",
                              column.className
                            )}
                          >
                            {
                              renderCellContent(
                                row,
                                column,
                                index
                              ) as React.ReactNode
                            }
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {pagination && !showEmpty && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            {(() => {
              const currentPage = pagination.currentPage ?? 1;
              const pageSize = pagination.pageSize ?? 10;
              const totalItems = pagination.totalItems ?? 0;
              const totalPages = Math.ceil(totalItems / pageSize);
              return (
                <>
                  <div className="flex items-center">
                    <div className="relative">
                      <select
                        id="perPage"
                        value={pagination.pageSize}
                        onChange={(e) =>
                          pagination.onPerPageChange?.(Number(e.target.value))
                        }
                        className="focus:ring-buttonBackgroundColor appearance-none rounded border border-gray-300 px-4 py-2 pr-8 pl-4 text-sm focus:ring-1 focus:outline-none"
                      >
                        {perPageValues.map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 transform`}
                      />
                    </div>
                    <label
                      htmlFor="perPage"
                      className={`text-[13px] font-medium text-gray-700`}
                    >
                      'Entries Per Page'
                    </label>
                  </div>
                  <div>
                    <p className="text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * pageSize + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * pageSize, totalItems)}
                      </span>{" "}
                      of <span className="font-medium">{totalItems}</span>{" "}
                      results
                    </p>
                  </div>
                  {/* // pagination controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center space-x-2">
                      {/* Prev button */}
                      <button
                        onClick={() =>
                          pagination.onPageChange?.(currentPage - 1)
                        }
                        disabled={currentPage === 1}
                        className={cn(
                          "relative inline-flex cursor-pointer items-center rounded-md px-2 py-2 font-medium",
                          currentPage === 1
                            ? "cursor-not-allowed text-gray-300"
                            : "text-muted-foreground hover:bg-gray-50"
                        )}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      {/* Page numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }).map(
                          (_, idx) => {
                            let pageNumber: number;

                            if (totalPages <= 5) {
                              pageNumber = idx + 1;
                            } else if (currentPage <= 3) {
                              pageNumber = idx + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + idx;
                            } else {
                              pageNumber = currentPage - 2 + idx;
                            }

                            return (
                              <button
                                type="button"
                                key={pageNumber}
                                onClick={() =>
                                  pagination.onPageChange?.(pageNumber)
                                }
                                className={cn(
                                  "relative inline-flex cursor-pointer items-center rounded-md px-4 py-2 font-medium",
                                  pageNumber === currentPage
                                    ? "bg-primary text-amber-200"
                                    : "text-muted-foreground hover:bg-gray-50"
                                )}
                              >
                                {pageNumber}
                              </button>
                            );
                          }
                        )}
                      </div>

                      {/* Next button */}
                      <button
                        onClick={() =>
                          pagination.onPageChange?.(currentPage + 1)
                        }
                        disabled={currentPage === totalPages}
                        className={cn(
                          "relative inline-flex cursor-pointer items-center rounded-md px-2 py-2 font-medium",
                          currentPage === totalPages
                            ? "cursor-not-allowed text-gray-300"
                            : "text-muted-foreground hover:bg-gray-50"
                        )}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomTable;
