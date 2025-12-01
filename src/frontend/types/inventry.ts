export type GstType = "IGST" | "CGST_SGST";

export interface InventorySummary {
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  stockValue: number;
}

export interface InventoryItem {
    id: string;
    productName: string;
    category: string;
    brand?: string;
    sku: string;
    barcode?: string;
    unit: string;
    stock: number;
    status?: string;
    reorderLevel: number;
    purchasePrice: number;
    sellingPrice: number;
    mrp: number;
    discount?: number;
    gstRate?: number;
    gstType?: GstType;
    isGstIncluded?: boolean;
    supplier?: string;
    description?: string;
    lowStockAlert?: boolean;
    purchaseDate?: string;
    expiryDate?: string;
    imageUrl?: string;
    hsnCode?: string;
}