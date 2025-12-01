export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string | null;
  customerPhone: string | null;
  billingAddress: string | null;
  shippingAddress: string | null;
  subTotal: number;
  discount: number;
  discountType: "flat" | "percent";
  gstAmount: number;
  roundOff: number;
  grandTotal: number;
  totalItems: number;
  totalQty: number;
  paidAmount: number;
  dueAmount: number;
  status: "Paid" | "Partial" | "Due";
  paymentStatus: string;
  cashierName: string | null;
  storeId: string;
  notes: string | null;
  footerMessage: string | null;
  paymentMeta: string | null;
  transportDetails: string | null;
  cgst: number;
  sgst: number;
  igst: number;
  taxableAmount: number;
  createdAt: string;
}

export interface Item {
  id: string;
  invoiceId: string;
  inventoryId: string;
  productName: string;
  hsnCode: string | null;
  sku: string | null;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  lineDiscount: number;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  lineTotal: number;
}

export interface Payment {
  mode: string;
  amount: number;
  ref?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  created_at: string;
}

export interface LedgerEntry {
  id: number;
  customer_id: number;
  invoice_id: string;
  type: "debit" | "credit";
  amount: number;
  balance: number;
  date: string;
  reference: string;
  notes?: string;
}

interface PaymentBreakdown {
  [mode: string]: number;
}

export interface InvoiceData {
  invoice: Invoice;
  items: Item[];
  payments: Payment[];
  paymentBreakdown: PaymentBreakdown;
  customer: Customer | null;
  ledger: LedgerEntry[];
}
