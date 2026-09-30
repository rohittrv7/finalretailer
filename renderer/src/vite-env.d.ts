/// <reference types="vite/client" />

export interface Category {
  id: number
  name: string
  description?: string | null
  product_count?: number
  created_at: string
  updated_at: string
}

export interface StockHistoryEntry {
  id: number
  product_id: number
  product_name?: string
  sku?: string | null
  change_qty: number
  balance_qty: number
  reason: 'sale' | 'return' | 'manual-adjustment' | 'restock'
  notes?: string | null
  reference_id?: string | null
  created_at: string
}

export interface Product {
  id: number
  name: string
  sku?: string | null
  category_id?: number | null
  category?: string | null
  purchase_price: number
  selling_price: number
  mrp: number
  stock_qty: number
  unit: string
  hsn_code?: string | null
  gst_rate: number
  low_stock_threshold: number
  expiry_date?: string | null
  supplier_name?: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: number
  name: string
  phone?: string | null
  gstin?: string | null
  address?: string | null
  credit_balance: number
  is_archived?: number
  last_transaction_date?: string | null
  created_at: string
  updated_at: string
}

export interface CustomerLedgerEntry {
  id: string
  date: string
  type: 'INVOICE' | 'PAYMENT'
  refNo: string
  description: string
  debit: number
  credit: number
  balance: number
  invoiceId?: number
  paymentId?: number
}

export interface InvoiceItem {
  id?: number
  invoice_id?: number
  product_id: number
  product_name: string
  sku?: string | null
  hsn_code?: string | null
  unit?: string
  price?: number
  unit_price: number
  mrp?: number
  qty: number
  discount?: number
  discount_type?: 'percent' | 'flat'
  discount_value?: number
  discount_amount?: number
  gst_rate?: number
  tax_amount?: number
  cgst_amount?: number
  sgst_amount?: number
  line_total: number
}

export interface Payment {
  id: number
  invoice_id?: number | null
  customer_id?: number | null
  amount: number
  payment_mode: string
  payment_date: string
  notes?: string | null
  created_at: string
}

export interface Invoice {
  id: number
  invoice_no: string
  invoice_seq: number
  date: string
  customer_id?: number | null
  customer_name?: string | null
  subtotal: number
  discount_amount: number
  discount_type: 'percent' | 'flat'
  discount_value: number
  tax_amount: number
  cgst_amount: number
  sgst_amount: number
  round_off: number
  total: number
  amount_paid: number
  amount_due: number
  payment_mode: 'CASH' | 'UPI' | 'CARD' | 'CREDIT' | 'SPLIT'
  payment_details?: string | null
  status: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'CANCELLED'
  notes?: string | null
  tax_pricing_mode?: 'INCLUSIVE' | 'EXCLUSIVE'
  tax_breakup_json?: string | null
  items?: InvoiceItem[]
  payments?: Payment[]
  created_at: string
  updated_at: string
}

export interface HeldBill {
  id: number
  bill_label: string
  customer_id?: number | null
  customer_name?: string | null
  cart_json: string
  bill_discount_type: 'percent' | 'flat'
  bill_discount_value: number
  round_off_enabled: number
  notes?: string | null
  created_at: string
}

export interface ReportStats {
  period: 'today' | 'week' | 'month'
  stockValuationCost: number
  stockValuationRetail: number
  projectedGrossMargin: number
  totalStockUnits: number
  totalProductsCount: number
  lowStockCount: number
  periodSalesTotal: number
  periodPaidTotal: number
  periodDueTotal: number
  periodInvoiceCount: number
  periodCostOfGoods: number
  periodGrossProfit: number
  periodGrossMarginPct: number
  totalCreditDue: number
  debtorsCount: number
  tenderDistribution: {
    cashAmount: number
    cashCount: number
    cashPercentage: number
    upiAmount: number
    upiCount: number
    upiPercentage: number
    totalRecorded: number
    totalCount: number
  }
  categoriesBreakdown: Array<{
    name: string
    productCount: number
    percentage: number
  }>
}

export type NewProduct = Omit<
  Product,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'purchase_price'
  | 'low_stock_threshold'
  | 'mrp'
  | 'stock_qty'
  | 'unit'
  | 'gst_rate'
> & {
  sku?: string | null
  category_id?: number | null
  category?: string | null
  purchase_price?: number
  selling_price: number
  mrp?: number
  stock_qty?: number
  unit?: string
  hsn_code?: string | null
  gst_rate?: number
  low_stock_threshold?: number
  expiry_date?: string | null
  supplier_name?: string | null
}

export type NewCustomer = Omit<
  Customer,
  'id' | 'created_at' | 'updated_at' | 'is_archived' | 'last_transaction_date'
> & {
  phone?: string | null
  gstin?: string | null
  address?: string | null
  credit_balance?: number
}

export interface CreateInvoicePayload {
  customer_id?: number | null
  customer_name?: string | null
  items: Array<{
    product_id: number
    product_name: string
    sku?: string | null
    hsn_code?: string | null
    unit?: string
    price?: number
    unit_price: number
    mrp?: number
    qty: number
    discount?: number
    discount_type: 'percent' | 'flat'
    discount_value: number
    discount_amount: number
    gst_rate: number
    tax_amount: number
    cgst_amount: number
    sgst_amount: number
    line_total: number
  }>
  subtotal: number
  discount_amount: number
  discount_type: 'percent' | 'flat'
  discount_value: number
  tax_amount: number
  cgst_amount: number
  sgst_amount: number
  round_off: number
  total: number
  amount_paid: number
  payment_mode: 'CASH' | 'UPI' | 'CARD' | 'CREDIT' | 'SPLIT'
  payment_details?: string | null
  notes?: string | null
  tax_pricing_mode?: 'INCLUSIVE' | 'EXCLUSIVE'
  tax_breakup_json?: string | null
}

export interface SetupPinResult {
  success: boolean
  recoveryCode?: string
  error?: string
}

export interface VerifyPinResult {
  success: boolean
  error?: string
  remainingAttempts?: number
  lockedSeconds?: number
}

export interface ResetPinResult {
  success: boolean
  newRecoveryCode?: string
  error?: string
}

declare global {
  interface Window {
    electronAPI?: {
      onMainProcessMessage: (callback: (message: string) => void) => void
      window?: {
        toggleFullscreen: () => Promise<boolean>
        isFullscreen: () => Promise<boolean>
        print: (options?: { silent?: boolean }) => Promise<{ success: boolean; error?: string }>
        saveAsPDF: (options?: { filename?: string; layout?: 'thermal' | 'a4' }) => Promise<{ success: boolean; filePath?: string; cancelled?: boolean; error?: string }>
      }
      db: {
        getInfo: () => Promise<{ dbPath: string }>
        backup: {
          export: () => Promise<{ success: boolean; filePath?: string; cancelled?: boolean; error?: string }>
          restore: () => Promise<{ success: boolean; filePath?: string; cancelled?: boolean; error?: string }>
        }
        categories: {
          getAll: () => Promise<Category[]>
          create: (data: { name: string; description?: string | null }) => Promise<Category>
          update: (id: number, data: { name?: string; description?: string | null }) => Promise<Category | undefined>
          delete: (id: number) => Promise<boolean>
        }
        products: {
          getAll: () => Promise<Product[]>
          getById: (id: number) => Promise<Product | undefined>
          create: (data: NewProduct) => Promise<Product>
          update: (id: number, data: Partial<NewProduct>) => Promise<Product | undefined>
          delete: (id: number) => Promise<boolean>
        }
        stock: {
          adjust: (params: {
            productId: number
            changeQty: number
            reason: 'sale' | 'return' | 'manual-adjustment' | 'restock'
            notes?: string | null
            referenceId?: string | null
          }) => Promise<Product>
          getHistory: (productId?: number, limit?: number) => Promise<StockHistoryEntry[]>
        }
        customers: {
          getAll: (options?: { includeArchived?: boolean; onlyWithDues?: boolean }) => Promise<Customer[]>
          getById: (id: number) => Promise<Customer | undefined>
          findByPhone: (phone: string) => Promise<Customer | undefined>
          create: (data: NewCustomer) => Promise<Customer>
          update: (id: number, data: Partial<NewCustomer>) => Promise<Customer | undefined>
          delete: (id: number) => Promise<{ success: boolean; softDeleted: boolean; reason?: string }>
          getLedger: (customerId: number) => Promise<CustomerLedgerEntry[]>
          recordPayment: (params: {
            customerId: number
            amount: number
            paymentMode: string
            invoiceId?: number | null
            notes?: string | null
          }) => Promise<{
            customer: Customer
            paymentId: number
            allocatedInvoices: Array<{ invoiceNo: string; amountAllocated: number; remainingDue: number }>
          }>
        }
        invoices: {
          getNextNumber: () => Promise<{ invoiceNo: string; seq: number }>
          create: (payload: CreateInvoicePayload) => Promise<Invoice>
          cancel: (id: number, reason?: string) => Promise<Invoice>
          recordPayment: (params: {
            invoiceId: number
            amount: number
            paymentMode: string
            notes?: string | null
          }) => Promise<Invoice>
          getById: (id: number) => Promise<Invoice | undefined>
          getAll: (filters?: {
            status?: string
            customerId?: number
            search?: string
            limit?: number
          }) => Promise<Invoice[]>
        }
        heldBills: {
          getAll: () => Promise<HeldBill[]>
          create: (data: {
            bill_label: string
            customer_id?: number | null
            customer_name?: string | null
            cart_json: string
            bill_discount_type?: 'percent' | 'flat'
            bill_discount_value?: number
            round_off_enabled?: number
            notes?: string | null
          }) => Promise<HeldBill>
          delete: (id: number) => Promise<boolean>
        }
        settings: {
          get: (key: string) => Promise<string | null>
          set: (key: string, value: string) => Promise<void>
        }
        reports: {
          getStats: (period?: 'today' | 'week' | 'month') => Promise<ReportStats>
        }
      }
      auth: {
        isConfigured: () => Promise<boolean>
        isSessionUnlocked: () => Promise<boolean>
        lockSession: () => Promise<boolean>
        setSessionUnlocked: (unlocked: boolean) => Promise<boolean>
        getLockStatus: () => Promise<{ isLocked: boolean; remainingSeconds: number }>
        setupPin: (pin: string) => Promise<SetupPinResult>
        verifyPin: (pin: string) => Promise<VerifyPinResult>
        resetWithRecovery: (recoveryCode: string, newPin: string) => Promise<ResetPinResult>
        changePin: (oldPin: string, newPin: string) => Promise<{ success: boolean; error?: string }>
      }
    }
  }
}
