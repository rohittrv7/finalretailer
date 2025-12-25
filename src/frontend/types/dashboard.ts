export interface Category {
  category: string;
  margin: number;
  profit: number;
  sales: number;
}

export interface Product {
  product: string;
  profit: number;
  revenue: number;
  units: number;
}

export interface ReportData {
  categories: Category[];
  products: Product[];
}
