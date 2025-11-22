export interface CartItem {
  id: string;
  inventoryId: string;
  barcode: string;
  sellingPrice: number;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  totalPrice: number;
  sku: string;
  taxableAmount: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  discount: number;
  gstRate: number;
  isGstIncluded: number;
  gstType?: string;
}
