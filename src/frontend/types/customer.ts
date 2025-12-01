export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  created_at: string;
}

export interface InvoiceItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineDiscount: number;
  gstRate: number;
  lineTotal?: number;
}

export interface DueInvoice {
  id: string;
  invoice_no: string;
  date: string;
  grandTotal: number;
  subtotal: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  totalItems: number;
  items: InvoiceItem[];
}

export interface Transaction {
  type: "credit" | "debit";
  amount: number;
  balance: number;
  date: string;
  reference?: string;
  invoice_no?: string;
}

export interface Summary {
  totalDue: number;
  pendingInvoices: number;
  totalPendingAmount: number;
}

export interface CustomerData {
  customer: Customer;
  dueInvoices: DueInvoice[];
  recentTransactions: Transaction[];
  summary: Summary;
}
