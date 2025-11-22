
export interface TableColumn<T> {
  id: string;
  header: string;
  accessor?: keyof T | ((row: T) => any);
  cell?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface CustomTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  sortable?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface TierColors {
  bg: string;
  text: string;
  border: string;
}