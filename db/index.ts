import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import { calculateBillGst, TaxPricingMode } from './gstCalculator'

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

export interface Setting {
  key: string
  value: string
  updated_at: string
}

export type NewProduct = Omit<Product, 'id' | 'created_at' | 'updated_at'> & {
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

export type NewCustomer = Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'is_archived' | 'last_transaction_date'> & {
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
    unit_price: number
    mrp?: number
    qty: number
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

let dbInstance: Database.Database | null = null
let dbPath: string = ''

/**
 * Cleanly closes the active database instance
 */
export function closeDatabase(): void {
  if (dbInstance) {
    try {
      dbInstance.close()
    } catch {}
    dbInstance = null
  }
}

/**
 * Initializes the database in the app's userData directory
 */
export function initDatabase(userDataPath: string): { db: Database.Database; path: string } {
  if (dbInstance) {
    return { db: dbInstance, path: dbPath }
  }

  // Ensure directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }

  dbPath = path.join(userDataPath, 'retailer.db')
  console.log(`[Database] Initializing SQLite database at: ${dbPath}`)

  const db = new Database(dbPath)

  // Configure SQLite pragmas for performance and data integrity
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Create core tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      category TEXT,
      purchase_price REAL DEFAULT 0,
      selling_price REAL NOT NULL DEFAULT 0,
      mrp REAL DEFAULT 0,
      stock_qty REAL NOT NULL DEFAULT 0,
      unit TEXT DEFAULT 'pcs',
      hsn_code TEXT DEFAULT '',
      gst_rate REAL DEFAULT 0,
      low_stock_threshold REAL DEFAULT 5,
      expiry_date TEXT,
      supplier_name TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS stock_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      change_qty REAL NOT NULL,
      balance_qty REAL NOT NULL,
      reason TEXT NOT NULL,
      notes TEXT,
      reference_id TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      gstin TEXT,
      credit_balance REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no TEXT UNIQUE NOT NULL,
      invoice_seq INTEGER UNIQUE,
      date TEXT NOT NULL,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      customer_name TEXT,
      subtotal REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      discount_type TEXT DEFAULT 'flat',
      discount_value REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      cgst_amount REAL DEFAULT 0,
      sgst_amount REAL DEFAULT 0,
      round_off REAL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      amount_paid REAL DEFAULT 0,
      amount_due REAL DEFAULT 0,
      payment_mode TEXT DEFAULT 'CASH',
      payment_details TEXT,
      status TEXT DEFAULT 'PAID',
      notes TEXT,
      tax_pricing_mode TEXT DEFAULT 'INCLUSIVE',
      tax_breakup_json TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      sku TEXT,
      hsn_code TEXT,
      unit TEXT DEFAULT 'pcs',
      price REAL NOT NULL DEFAULT 0,
      unit_price REAL NOT NULL DEFAULT 0,
      mrp REAL DEFAULT 0,
      qty REAL NOT NULL,
      discount REAL DEFAULT 0,
      discount_type TEXT DEFAULT 'percent',
      discount_value REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      gst_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      cgst_amount REAL DEFAULT 0,
      sgst_amount REAL DEFAULT 0,
      line_total REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      amount REAL NOT NULL,
      payment_mode TEXT NOT NULL,
      payment_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS held_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_label TEXT NOT NULL,
      customer_id INTEGER,
      customer_name TEXT,
      cart_json TEXT NOT NULL,
      bill_discount_type TEXT DEFAULT 'flat',
      bill_discount_value REAL DEFAULT 0,
      round_off_enabled INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `)

  // --- Safe Migrations for products, invoices, and invoice_items ---
  const applyColumnMigrations = (tableName: string, cols: Array<{ name: string; def: string }>) => {
    try {
      const existing = db.prepare(`PRAGMA table_info('${tableName}')`).all() as Array<{ name: string }>
      const colSet = new Set(existing.map((c) => c.name))
      for (const col of cols) {
        if (!colSet.has(col.name)) {
          console.log(`[Migration] Adding column ${col.name} to ${tableName}...`)
          db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.def}`)
        }
      }
    } catch (e) {
      console.warn(`[Migration] Failed migrating ${tableName}:`, e)
    }
  }

  applyColumnMigrations('products', [
    { name: 'mrp', def: 'REAL DEFAULT 0' },
    { name: 'category_id', def: 'INTEGER REFERENCES categories(id) ON DELETE SET NULL' },
    { name: 'hsn_code', def: "TEXT DEFAULT ''" },
    { name: 'gst_rate', def: 'REAL DEFAULT 0' },
    { name: 'low_stock_threshold', def: 'REAL DEFAULT 5' },
    { name: 'expiry_date', def: 'TEXT' },
    { name: 'supplier_name', def: 'TEXT' },
  ])

  applyColumnMigrations('invoices', [
    { name: 'invoice_seq', def: 'INTEGER' },
    { name: 'customer_name', def: 'TEXT' },
    { name: 'subtotal', def: 'REAL DEFAULT 0' },
    { name: 'discount_amount', def: 'REAL DEFAULT 0' },
    { name: 'discount_type', def: "TEXT DEFAULT 'flat'" },
    { name: 'discount_value', def: 'REAL DEFAULT 0' },
    { name: 'cgst_amount', def: 'REAL DEFAULT 0' },
    { name: 'sgst_amount', def: 'REAL DEFAULT 0' },
    { name: 'round_off', def: 'REAL DEFAULT 0' },
    { name: 'amount_paid', def: 'REAL DEFAULT 0' },
    { name: 'amount_due', def: 'REAL DEFAULT 0' },
    { name: 'payment_details', def: 'TEXT' },
    { name: 'status', def: "TEXT DEFAULT 'PAID'" },
    { name: 'notes', def: 'TEXT' },
    { name: 'tax_pricing_mode', def: "TEXT DEFAULT 'INCLUSIVE'" },
    { name: 'tax_breakup_json', def: 'TEXT' },
    { name: 'updated_at', def: "TEXT DEFAULT (datetime('now', 'localtime'))" },
  ])

  applyColumnMigrations('invoice_items', [
    { name: 'price', def: 'REAL DEFAULT 0' },
    { name: 'discount', def: 'REAL DEFAULT 0' },
    { name: 'product_name', def: "TEXT DEFAULT 'Item'" },
    { name: 'sku', def: 'TEXT' },
    { name: 'hsn_code', def: 'TEXT' },
    { name: 'unit', def: "TEXT DEFAULT 'pcs'" },
    { name: 'unit_price', def: 'REAL DEFAULT 0' },
    { name: 'mrp', def: 'REAL DEFAULT 0' },
    { name: 'discount_type', def: "TEXT DEFAULT 'percent'" },
    { name: 'discount_value', def: 'REAL DEFAULT 0' },
    { name: 'discount_amount', def: 'REAL DEFAULT 0' },
    { name: 'gst_rate', def: 'REAL DEFAULT 0' },
    { name: 'tax_amount', def: 'REAL DEFAULT 0' },
    { name: 'cgst_amount', def: 'REAL DEFAULT 0' },
    { name: 'sgst_amount', def: 'REAL DEFAULT 0' },
    { name: 'line_total', def: 'REAL DEFAULT 0' },
  ])

  applyColumnMigrations('customers', [
    { name: 'address', def: 'TEXT' },
    { name: 'is_archived', def: 'INTEGER DEFAULT 0' },
  ])

  // Seed default categories if empty
  const catCount = (db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }).count
  if (catCount === 0) {
    const defaultCategories = [
      { name: 'Grocery & Staples', description: 'Grains, flour, rice, pulses, sugar and salt' },
      { name: 'Snacks & Biscuits', description: 'Packaged snacks, chips, biscuits, namkeen' },
      { name: 'Beverages', description: 'Tea, coffee, cold drinks, juices, bottled water' },
      { name: 'Dairy & Cold Storage', description: 'Milk, butter, curd, cheese, ice cream' },
      { name: 'Personal Care', description: 'Soaps, shampoos, oral care, cosmetics' },
      { name: 'Household & Cleaning', description: 'Detergents, cleaners, repellents, disinfectants' },
      { name: 'Stationery & General', description: 'Pens, notebooks, batteries, general utilities' },
    ]
    const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)')
    for (const cat of defaultCategories) {
      insertCat.run(cat.name, cat.description)
    }
  }

  // Ensure default setting for allow_negative_stock
  const negStockSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('allow_negative_stock')
  if (!negStockSetting) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('allow_negative_stock', '0')").run()
  }

  dbInstance = db
  return { db, path: dbPath }
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    throw new Error('Database has not been initialized. Call initDatabase(userDataPath) first.')
  }
  return dbInstance
}

export function getDbPath(): string {
  return dbPath
}

// ==================== Categories CRUD ====================

export const categoryRepository = {
  getAll(): Category[] {
    const db = getDb()
    return db
      .prepare(`
        SELECT c.*, 
          COUNT(p.id) AS product_count
        FROM categories c
        LEFT JOIN products p ON (p.category_id = c.id OR (p.category_id IS NULL AND p.category = c.name))
        GROUP BY c.id
        ORDER BY c.name ASC
      `)
      .all() as Category[]
  },

  getById(id: number): Category | undefined {
    const db = getDb()
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined
  },

  create(data: { name: string; description?: string | null }): Category {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO categories (name, description)
      VALUES (?, ?)
    `)
    const info = stmt.run(data.name.trim(), data.description?.trim() ?? null)
    return this.getById(Number(info.lastInsertRowid))!
  },

  update(id: number, data: { name?: string; description?: string | null }): Category | undefined {
    const db = getDb()
    const current = this.getById(id)
    if (!current) return undefined

    const stmt = db.prepare(`
      UPDATE categories
      SET name = ?,
          description = ?,
          updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `)
    stmt.run(
      data.name !== undefined ? data.name.trim() : current.name,
      data.description !== undefined ? data.description : current.description,
      id
    )
    return this.getById(id)
  },

  delete(id: number): boolean {
    const db = getDb()
    db.prepare('UPDATE products SET category_id = NULL WHERE category_id = ?').run(id)
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id)
    return result.changes > 0
  },
}

// ==================== Products CRUD ====================

export const productRepository = {
  getAll(): Product[] {
    const db = getDb()
    return db
      .prepare(`
        SELECT p.*,
          COALESCE(c.name, p.category, 'General') as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.id DESC
      `)
      .all()
      .map((row: any) => ({
        ...row,
        category: row.category_name,
        mrp: row.mrp || row.selling_price || 0,
        gst_rate: row.gst_rate || 0,
        low_stock_threshold: row.low_stock_threshold ?? 5,
      })) as Product[]
  },

  getById(id: number): Product | undefined {
    const db = getDb()
    const row: any = db
      .prepare(`
        SELECT p.*,
          COALESCE(c.name, p.category, 'General') as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `)
      .get(id)

    if (!row) return undefined

    return {
      ...row,
      category: row.category_name,
      mrp: row.mrp || row.selling_price || 0,
      gst_rate: row.gst_rate || 0,
      low_stock_threshold: row.low_stock_threshold ?? 5,
    }
  },

  create(product: NewProduct): Product {
    const db = getDb()

    let catId = product.category_id ?? null
    let catName = product.category ?? null
    if (!catId && catName) {
      const match = db.prepare('SELECT id FROM categories WHERE name = ? COLLATE NOCASE').get(catName) as { id: number } | undefined
      if (match) catId = match.id
    }

    const stmt = db.prepare(`
      INSERT INTO products (
        name, sku, category_id, category, purchase_price, selling_price,
        mrp, stock_qty, unit, hsn_code, gst_rate, low_stock_threshold,
        expiry_date, supplier_name
      )
      VALUES (
        @name, @sku, @category_id, @category, @purchase_price, @selling_price,
        @mrp, @stock_qty, @unit, @hsn_code, @gst_rate, @low_stock_threshold,
        @expiry_date, @supplier_name
      )
    `)

    const initialStock = Number(product.stock_qty) || 0

    const info = stmt.run({
      name: product.name,
      sku: product.sku ?? null,
      category_id: catId,
      category: catName,
      purchase_price: Number(product.purchase_price) || 0,
      selling_price: Number(product.selling_price) || 0,
      mrp: Number(product.mrp) || Number(product.selling_price) || 0,
      stock_qty: initialStock,
      unit: product.unit ?? 'pcs',
      hsn_code: product.hsn_code ?? '',
      gst_rate: Number(product.gst_rate) || 0,
      low_stock_threshold: Number(product.low_stock_threshold) >= 0 ? Number(product.low_stock_threshold) : 5,
      expiry_date: product.expiry_date ?? null,
      supplier_name: product.supplier_name ?? null,
    })

    const newId = Number(info.lastInsertRowid)

    if (initialStock > 0) {
      db.prepare(`
        INSERT INTO stock_history (product_id, change_qty, balance_qty, reason, notes)
        VALUES (?, ?, ?, 'restock', 'Initial stock on product creation')
      `).run(newId, initialStock, initialStock)
    }

    return this.getById(newId)!
  },

  update(id: number, data: Partial<NewProduct>): Product | undefined {
    const db = getDb()
    const current = this.getById(id)
    if (!current) return undefined

    let catId = data.category_id !== undefined ? data.category_id : current.category_id
    let catName = data.category !== undefined ? data.category : current.category
    if (catName && !catId) {
      const match = db.prepare('SELECT id FROM categories WHERE name = ? COLLATE NOCASE').get(catName) as { id: number } | undefined
      if (match) catId = match.id
    }

    const stmt = db.prepare(`
      UPDATE products
      SET name = @name,
          sku = @sku,
          category_id = @category_id,
          category = @category,
          purchase_price = @purchase_price,
          selling_price = @selling_price,
          mrp = @mrp,
          stock_qty = @stock_qty,
          unit = @unit,
          hsn_code = @hsn_code,
          gst_rate = @gst_rate,
          low_stock_threshold = @low_stock_threshold,
          expiry_date = @expiry_date,
          supplier_name = @supplier_name,
          updated_at = datetime('now', 'localtime')
      WHERE id = @id
    `)

    stmt.run({
      id,
      name: data.name ?? current.name,
      sku: data.sku !== undefined ? data.sku : current.sku,
      category_id: catId,
      category: catName,
      purchase_price: data.purchase_price !== undefined ? Number(data.purchase_price) : current.purchase_price,
      selling_price: data.selling_price !== undefined ? Number(data.selling_price) : current.selling_price,
      mrp: data.mrp !== undefined ? Number(data.mrp) : current.mrp,
      stock_qty: data.stock_qty !== undefined ? Number(data.stock_qty) : current.stock_qty,
      unit: data.unit ?? current.unit,
      hsn_code: data.hsn_code !== undefined ? data.hsn_code : current.hsn_code,
      gst_rate: data.gst_rate !== undefined ? Number(data.gst_rate) : current.gst_rate,
      low_stock_threshold:
        data.low_stock_threshold !== undefined
          ? Number(data.low_stock_threshold)
          : current.low_stock_threshold,
      expiry_date: data.expiry_date !== undefined ? data.expiry_date : current.expiry_date,
      supplier_name: data.supplier_name !== undefined ? data.supplier_name : current.supplier_name,
    })

    return this.getById(id)
  },

  delete(id: number): boolean {
    const db = getDb()
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(id)
    return result.changes > 0
  },
}

// ==================== Stock Ledger & Transactions ====================

export const stockRepository = {
  adjustStock(params: {
    productId: number
    changeQty: number
    reason: 'sale' | 'return' | 'manual-adjustment' | 'restock'
    notes?: string | null
    referenceId?: string | null
  }): Product {
    const db = getDb()

    const executeAdjustment = db.transaction(() => {
      const product = productRepository.getById(params.productId)
      if (!product) {
        throw new Error(`Product with ID ${params.productId} not found`)
      }

      const newQty = product.stock_qty + params.changeQty
      const allowNegative = settingsRepository.get('allow_negative_stock') === '1'

      if (newQty < 0 && !allowNegative) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.stock_qty}, attempted deduction: ${Math.abs(
            params.changeQty
          )}`
        )
      }

      db.prepare(`
        UPDATE products
        SET stock_qty = ?,
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(newQty, params.productId)

      db.prepare(`
        INSERT INTO stock_history (product_id, change_qty, balance_qty, reason, notes, reference_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        params.productId,
        params.changeQty,
        newQty,
        params.reason,
        params.notes ?? null,
        params.referenceId ?? null
      )

      return productRepository.getById(params.productId)!
    })

    return executeAdjustment()
  },

  getHistory(productId?: number, limit = 100): StockHistoryEntry[] {
    const db = getDb()
    if (productId) {
      return db
        .prepare(`
          SELECT h.*, p.name AS product_name, p.sku
          FROM stock_history h
          JOIN products p ON h.product_id = p.id
          WHERE h.product_id = ?
          ORDER BY h.id DESC
          LIMIT ?
        `)
        .all(productId, limit) as StockHistoryEntry[]
    }

    return db
      .prepare(`
        SELECT h.*, p.name AS product_name, p.sku
        FROM stock_history h
        JOIN products p ON h.product_id = p.id
        ORDER BY h.id DESC
        LIMIT ?
      `)
      .all(limit) as StockHistoryEntry[]
  },
}

// ==================== Customers CRUD & Khata Ledger ====================

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

export const customerRepository = {
  getAll(options?: { includeArchived?: boolean; onlyWithDues?: boolean }): Customer[] {
    const db = getDb()
    let query = `
      SELECT c.*,
        COALESCE(
          (
            SELECT MAX(date)
            FROM (
              SELECT date FROM invoices WHERE customer_id = c.id
              UNION ALL
              SELECT payment_date AS date FROM payments WHERE customer_id = c.id
            )
          ),
          c.created_at
        ) AS last_transaction_date
      FROM customers c
      WHERE 1=1
    `
    if (!options?.includeArchived) {
      query += ' AND (c.is_archived = 0 OR c.is_archived IS NULL)'
    }
    if (options?.onlyWithDues) {
      query += ' AND c.credit_balance > 0'
    }
    query += ' ORDER BY c.id DESC'
    return db.prepare(query).all() as Customer[]
  },

  getById(id: number): Customer | undefined {
    const db = getDb()
    return db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as Customer | undefined
  },

  findByPhone(phone: string): Customer | undefined {
    const db = getDb()
    const cleaned = phone.trim()
    if (!cleaned) return undefined
    return db
      .prepare('SELECT * FROM customers WHERE phone = ? AND (is_archived = 0 OR is_archived IS NULL)')
      .get(cleaned) as Customer | undefined
  },

  create(customer: NewCustomer): Customer {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO customers (name, phone, gstin, address, credit_balance, is_archived)
      VALUES (@name, @phone, @gstin, @address, @credit_balance, 0)
    `)
    const info = stmt.run({
      name: customer.name.trim(),
      phone: customer.phone ? customer.phone.trim() : null,
      gstin: customer.gstin ? customer.gstin.trim() : null,
      address: customer.address ? customer.address.trim() : null,
      credit_balance: customer.credit_balance ?? 0,
    })
    return this.getById(Number(info.lastInsertRowid))!
  },

  update(id: number, data: Partial<NewCustomer>): Customer | undefined {
    const db = getDb()
    const current = this.getById(id)
    if (!current) return undefined

    const stmt = db.prepare(`
      UPDATE customers
      SET name = @name,
          phone = @phone,
          gstin = @gstin,
          address = @address,
          credit_balance = @credit_balance,
          updated_at = datetime('now', 'localtime')
      WHERE id = @id
    `)

    stmt.run({
      id,
      name: data.name !== undefined ? data.name.trim() : current.name,
      phone: data.phone !== undefined ? (data.phone ? data.phone.trim() : null) : current.phone,
      gstin: data.gstin !== undefined ? (data.gstin ? data.gstin.trim() : null) : current.gstin,
      address: data.address !== undefined ? (data.address ? data.address.trim() : null) : current.address,
      credit_balance: data.credit_balance !== undefined ? data.credit_balance : current.credit_balance,
    })

    return this.getById(id)
  },

  delete(id: number): { success: boolean; softDeleted: boolean; reason?: string } {
    const db = getDb()
    const invoiceCount = (
      db.prepare('SELECT COUNT(*) as count FROM invoices WHERE customer_id = ?').get(id) as {
        count: number
      }
    ).count

    if (invoiceCount > 0) {
      // Soft-delete to preserve billing and GST audit history
      db.prepare(
        "UPDATE customers SET is_archived = 1, updated_at = datetime('now', 'localtime') WHERE id = ?"
      ).run(id)
      return {
        success: true,
        softDeleted: true,
        reason: `Customer has ${invoiceCount} invoice(s) on record. Profile has been archived to preserve transaction and audit history.`,
      }
    }

    const result = db.prepare('DELETE FROM customers WHERE id = ?').run(id)
    return {
      success: result.changes > 0,
      softDeleted: false,
    }
  },

  getLedger(customerId: number): CustomerLedgerEntry[] {
    const db = getDb()
    const invoices = db
      .prepare(`
      SELECT id, invoice_no, total, amount_paid, amount_due, date, created_at, status
      FROM invoices
      WHERE customer_id = ?
      ORDER BY date ASC, id ASC
    `)
      .all(customerId) as Array<{
      id: number
      invoice_no: string
      total: number
      amount_paid: number
      amount_due: number
      date: string
      created_at: string
      status: string
    }>

    const payments = db
      .prepare(`
      SELECT p.id, p.invoice_id, p.amount, p.payment_mode, p.payment_date, p.notes, i.invoice_no
      FROM payments p
      LEFT JOIN invoices i ON i.id = p.invoice_id
      WHERE p.customer_id = ?
      ORDER BY p.payment_date ASC, p.id ASC
    `)
      .all(customerId) as Array<{
      id: number
      invoice_id?: number | null
      amount: number
      payment_mode: string
      payment_date: string
      notes?: string | null
      invoice_no?: string | null
    }>

    const rawEvents: Array<{
      rawDate: string
      type: 'INVOICE' | 'PAYMENT'
      refNo: string
      description: string
      debit: number
      credit: number
      invoiceId?: number
      paymentId?: number
    }> = []

    for (const inv of invoices) {
      if (inv.status === 'CANCELLED') {
        rawEvents.push({
          rawDate: inv.date || inv.created_at,
          type: 'INVOICE',
          refNo: inv.invoice_no,
          description: `Invoice ${inv.invoice_no} (VOIDED)`,
          debit: 0,
          credit: 0,
          invoiceId: inv.id,
        })
        continue
      }

      rawEvents.push({
        rawDate: inv.date || inv.created_at,
        type: 'INVOICE',
        refNo: inv.invoice_no,
        description: `Sale Invoice ${inv.invoice_no}${
          inv.amount_due > 0 ? ` (Baki: ₹${inv.amount_due.toFixed(2)})` : ' (Full Paid)'
        }`,
        debit: inv.amount_due,
        credit: 0,
        invoiceId: inv.id,
      })
    }

    for (const p of payments) {
      rawEvents.push({
        rawDate: p.payment_date,
        type: 'PAYMENT',
        refNo: p.invoice_no || `RCP-${p.id}`,
        description: p.invoice_no
          ? `Payment received for ${p.invoice_no} (${p.payment_mode})`
          : `Khata payment received (${p.payment_mode})${p.notes ? ` - ${p.notes}` : ''}`,
        debit: 0,
        credit: p.amount,
        paymentId: p.id,
        invoiceId: p.invoice_id ?? undefined,
      })
    }

    // Sort chronologically
    rawEvents.sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime())

    let runningBalance = 0
    return rawEvents.map((ev, idx) => {
      runningBalance += ev.debit - ev.credit
      return {
        id: `${ev.type}-${idx}`,
        date: ev.rawDate,
        type: ev.type,
        refNo: ev.refNo,
        description: ev.description,
        debit: Number(ev.debit.toFixed(2)),
        credit: Number(ev.credit.toFixed(2)),
        balance: Math.max(0, Number(runningBalance.toFixed(2))),
        invoiceId: ev.invoiceId,
        paymentId: ev.paymentId,
      }
    })
  },

  recordPayment(params: {
    customerId: number
    amount: number
    paymentMode: string
    invoiceId?: number | null
    notes?: string | null
  }): {
    customer: Customer
    paymentId: number
    allocatedInvoices: Array<{ invoiceNo: string; amountAllocated: number; remainingDue: number }>
  } {
    const db = getDb()

    const executeKhataPayment = db.transaction(() => {
      const customer = this.getById(params.customerId)
      if (!customer) throw new Error(`Customer #${params.customerId} not found`)

      const payAmount = Math.max(0, Number(params.amount) || 0)
      if (payAmount <= 0) throw new Error('Payment amount must be greater than zero')

      const allocatedInvoices: Array<{
        invoiceNo: string
        amountAllocated: number
        remainingDue: number
      }> = []

      if (params.invoiceId) {
        // 1. Specific invoice payment
        const invoice = db
          .prepare('SELECT * FROM invoices WHERE id = ? AND customer_id = ?')
          .get(params.invoiceId, params.customerId) as Invoice | undefined
        if (!invoice) throw new Error(`Invoice #${params.invoiceId} not found for this customer`)
        if (invoice.status === 'CANCELLED') throw new Error(`Cannot record payment on cancelled invoice`)
        if (invoice.amount_due <= 0) throw new Error(`Invoice ${invoice.invoice_no} is already fully paid`)

        const alloc = Math.min(invoice.amount_due, payAmount)
        const newPaid = Number((invoice.amount_paid + alloc).toFixed(2))
        const newDue = Number((invoice.amount_due - alloc).toFixed(2))
        const newStatus = newDue <= 0 ? 'PAID' : 'PARTIALLY_PAID'

        db.prepare(`
          UPDATE invoices
          SET amount_paid = ?, amount_due = ?, status = ?, updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(newPaid, newDue, newStatus, invoice.id)

        allocatedInvoices.push({
          invoiceNo: invoice.invoice_no,
          amountAllocated: alloc,
          remainingDue: newDue,
        })
      } else {
        // 2. General Khata payment: Allocate oldest-first across invoices with dues
        const dueInvoices = db
          .prepare(`
          SELECT * FROM invoices
          WHERE customer_id = ? AND amount_due > 0 AND status != 'CANCELLED'
          ORDER BY date ASC, id ASC
        `)
          .all(params.customerId) as Invoice[]

        let unallocated = payAmount
        for (const inv of dueInvoices) {
          if (unallocated <= 0) break
          const alloc = Math.min(inv.amount_due, unallocated)
          const newPaid = Number((inv.amount_paid + alloc).toFixed(2))
          const newDue = Number((inv.amount_due - alloc).toFixed(2))
          const newStatus = newDue <= 0 ? 'PAID' : 'PARTIALLY_PAID'

          db.prepare(`
            UPDATE invoices
            SET amount_paid = ?, amount_due = ?, status = ?, updated_at = datetime('now', 'localtime')
            WHERE id = ?
          `).run(newPaid, newDue, newStatus, inv.id)

          allocatedInvoices.push({
            invoiceNo: inv.invoice_no,
            amountAllocated: alloc,
            remainingDue: newDue,
          })

          unallocated = Number((unallocated - alloc).toFixed(2))
        }
      }

      // 3. Update customer's overall credit_balance
      db.prepare(`
        UPDATE customers
        SET credit_balance = MAX(0, credit_balance - ?),
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(payAmount, params.customerId)

      // 4. Insert into payments table
      const pStmt = db.prepare(`
        INSERT INTO payments (invoice_id, customer_id, amount, payment_mode, payment_date, notes)
        VALUES (?, ?, ?, ?, datetime('now', 'localtime'), ?)
      `)
      const pInfo = pStmt.run(
        params.invoiceId ?? null,
        params.customerId,
        payAmount,
        params.paymentMode,
        params.notes || (params.invoiceId ? 'Invoice payment' : 'General balance payment')
      )

      const updatedCustomer = this.getById(params.customerId)!
      return {
        customer: updatedCustomer,
        paymentId: Number(pInfo.lastInsertRowid),
        allocatedInvoices,
      }
    })

    return executeKhataPayment()
  },
}

// ==================== Invoices & Payments ====================

export const invoiceRepository = {
  /**
   * Generates the next sequential invoice number without skipping or reusing
   */
  getNextInvoiceNo(): { invoiceNo: string; seq: number } {
    const db = getDb()
    const row = db.prepare('SELECT MAX(invoice_seq) as max_seq FROM invoices').get() as { max_seq: number | null }
    const nextSeq = (row?.max_seq ?? 0) + 1
    const formatted = `INV-${nextSeq.toString().padStart(6, '0')}`
    return { invoiceNo: formatted, seq: nextSeq }
  },

  /**
   * Saves invoice + invoice_items + deducts stock + logs stock history + records payment + updates customer credit
   * ALL inside a SINGLE atomic SQLite transaction.
   */
  createInvoice(payload: CreateInvoicePayload): Invoice {
    const db = getDb()

    const executeCreate = db.transaction(() => {
      if (!payload.items || payload.items.length === 0) {
        throw new Error('Cannot create invoice with an empty item list')
      }

      const { invoiceNo, seq } = this.getNextInvoiceNo()
      const allowNegative = settingsRepository.get('allow_negative_stock') === '1'

      // 1. Stock check: ensure sufficient stock if negative stock is disabled
      if (!allowNegative) {
        for (const item of payload.items) {
          const product = productRepository.getById(item.product_id)
          if (product && product.stock_qty < item.qty) {
            throw new Error(
              `Insufficient stock for "${product.name}". Available: ${product.stock_qty}, required: ${item.qty}`
            )
          }
        }
      }

      // Determine pricing mode and calculate statutory GST
      const pricingMode: TaxPricingMode = (payload.tax_pricing_mode || settingsRepository.get('tax_pricing_mode') || 'INCLUSIVE') as TaxPricingMode

      const rawItems = payload.items.map((it) => ({
        productId: it.product_id,
        productName: it.product_name,
        sku: it.sku,
        hsnCode: it.hsn_code,
        unit: it.unit,
        unitPrice: Number(it.unit_price ?? (it as any).price) || 0,
        qty: Number(it.qty) || 1,
        mrp: Number(it.mrp) || Number(it.unit_price ?? (it as any).price) || 0,
        discountType: it.discount_type || 'percent',
        discountValue: Number(it.discount_value) || 0,
        gstRate: Number(it.gst_rate) || 0,
      }))

      let flatBillDiscount = 0
      if (payload.discount_type === 'percent') {
        const grossSum = rawItems.reduce((acc, i) => acc + i.unitPrice * i.qty, 0)
        flatBillDiscount = (grossSum * (Number(payload.discount_value) || 0)) / 100
      } else {
        flatBillDiscount = Number(payload.discount_value) || 0
      }

      const gstCalc = calculateBillGst(rawItems, {
        pricingMode,
        billDiscount: flatBillDiscount,
        enableRoundOff: true,
      })

      // 2. Validate Partial Payment & Credit logic:
      // If there is an unpaid balance (baki / due amount), a customer MUST be selected
      const grandTotal = gstCalc.grandTotal
      const amountPaid = Math.max(0, Math.min(grandTotal, Number(payload.amount_paid) || 0))
      const amountDue = Math.max(0, Number((grandTotal - amountPaid).toFixed(2)))

      if (amountDue > 0 && !payload.customer_id) {
        throw new Error(
          'Customer selection is required when there is a pending due amount ("Baki" / Credit). Please select or add a customer.'
        )
      }

      // Determine invoice payment status
      let status: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' = 'PAID'
      if (amountPaid === 0) {
        status = 'UNPAID'
      } else if (amountDue > 0) {
        status = 'PARTIALLY_PAID'
      }

      // 3. Deduct stock and log stock_history for each line item
      for (const item of payload.items) {
        const product = productRepository.getById(item.product_id)
        if (product) {
          const newStock = product.stock_qty - item.qty
          db.prepare(`
            UPDATE products
            SET stock_qty = ?,
                updated_at = datetime('now', 'localtime')
            WHERE id = ?
          `).run(newStock, item.product_id)

          db.prepare(`
            INSERT INTO stock_history (product_id, change_qty, balance_qty, reason, notes, reference_id)
            VALUES (?, ?, ?, 'sale', ?, ?)
          `).run(item.product_id, -item.qty, newStock, `Invoice ${invoiceNo}`, invoiceNo)
        }
      }

      // 4. Insert into invoices table
      const insertInvoiceStmt = db.prepare(`
        INSERT INTO invoices (
          invoice_no, invoice_seq, date, customer_id, customer_name, subtotal,
          discount_amount, discount_type, discount_value, tax_amount, cgst_amount,
          sgst_amount, round_off, total, amount_paid, amount_due, payment_mode,
          payment_details, status, notes, tax_pricing_mode, tax_breakup_json
        )
        VALUES (
          @invoice_no, @invoice_seq, datetime('now', 'localtime'), @customer_id, @customer_name, @subtotal,
          @discount_amount, @discount_type, @discount_value, @tax_amount, @cgst_amount,
          @sgst_amount, @round_off, @total, @amount_paid, @amount_due, @payment_mode,
          @payment_details, @status, @notes, @tax_pricing_mode, @tax_breakup_json
        )
      `)

      const taxBreakupJson = JSON.stringify({
        pricingMode,
        rateBreakup: gstCalc.rateBreakup,
        hsnSummary: gstCalc.hsnSummary,
      })

      const invoiceInfo = insertInvoiceStmt.run({
        invoice_no: invoiceNo,
        invoice_seq: seq,
        customer_id: payload.customer_id ?? null,
        customer_name: payload.customer_name ?? null,
        subtotal: gstCalc.taxableSubtotal,
        discount_amount: gstCalc.totalDiscount,
        discount_type: payload.discount_type || 'flat',
        discount_value: Number(payload.discount_value) || 0,
        tax_amount: gstCalc.totalTax,
        cgst_amount: gstCalc.totalCgst,
        sgst_amount: gstCalc.totalSgst,
        round_off: gstCalc.roundOff,
        total: grandTotal,
        amount_paid: amountPaid,
        amount_due: amountDue,
        payment_mode: payload.payment_mode || 'CASH',
        payment_details: payload.payment_details ?? null,
        status,
        notes: payload.notes ?? null,
        tax_pricing_mode: pricingMode,
        tax_breakup_json: taxBreakupJson,
      })

      const invoiceId = Number(invoiceInfo.lastInsertRowid)

      // 5. Insert invoice line items
      const insertItemStmt = db.prepare(`
        INSERT INTO invoice_items (
          invoice_id, product_id, product_name, sku, hsn_code, unit,
          price, unit_price, mrp, qty, discount, discount_type,
          discount_value, discount_amount, gst_rate, tax_amount,
          cgst_amount, sgst_amount, line_total
        )
        VALUES (
          @invoice_id, @product_id, @product_name, @sku, @hsn_code, @unit,
          @price, @unit_price, @mrp, @qty, @discount, @discount_type,
          @discount_value, @discount_amount, @gst_rate, @tax_amount,
          @cgst_amount, @sgst_amount, @line_total
        )
      `)

      for (let i = 0; i < payload.items.length; i++) {
        const item = payload.items[i]
        const calcItem = gstCalc.items[i]
        const product = productRepository.getById(item.product_id)
        const itemPrice = Number(item.unit_price ?? (item as any).price) || 0
        const itemQty = Number(item.qty) || 1
        const itemDiscount = calcItem ? (calcItem.itemDiscount + calcItem.allocatedBillDiscount) : (Number(item.discount_amount ?? (item as any).discount) || 0)

        insertItemStmt.run({
          invoice_id: invoiceId,
          product_id: item.product_id,
          product_name: item.product_name || product?.name || 'Product',
          sku: item.sku ?? product?.sku ?? null,
          hsn_code: item.hsn_code ?? product?.hsn_code ?? null,
          unit: item.unit ?? product?.unit ?? 'pcs',
          price: itemPrice,
          unit_price: itemPrice,
          mrp: Number(item.mrp) || itemPrice,
          qty: itemQty,
          discount: itemDiscount,
          discount_type: item.discount_type || 'percent',
          discount_value: Number(item.discount_value) || 0,
          discount_amount: itemDiscount,
          gst_rate: Number(item.gst_rate) || 0,
          tax_amount: calcItem ? calcItem.totalGst : (Number(item.tax_amount) || 0),
          cgst_amount: calcItem ? calcItem.cgstAmount : (Number(item.cgst_amount) || 0),
          sgst_amount: calcItem ? calcItem.sgstAmount : (Number(item.sgst_amount) || 0),
          line_total: calcItem ? calcItem.lineTotal : (Number(item.line_total) || 0),
        })
      }

      // 6. Record initial payment if amount_paid > 0
      if (amountPaid > 0) {
        db.prepare(`
          INSERT INTO payments (invoice_id, customer_id, amount, payment_mode, payment_date, notes)
          VALUES (?, ?, ?, ?, datetime('now', 'localtime'), ?)
        `).run(
          invoiceId,
          payload.customer_id ?? null,
          amountPaid,
          payload.payment_mode,
          `Initial checkout payment for ${invoiceNo}`
        )
      }

      // 7. If there is a due amount ("Baki"), add it to customer's overall credit_balance
      if (amountDue > 0 && payload.customer_id) {
        db.prepare(`
          UPDATE customers
          SET credit_balance = credit_balance + ?,
              updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(amountDue, payload.customer_id)
      }

      return this.getById(invoiceId)!
    })

    return executeCreate()
  },

  /**
   * Cancels/voids an invoice:
   * - Marks status as CANCELLED (never deletes from DB for GST audit compliance)
   * - Restores stock quantities for each line item (logs with reason: 'return')
   * - If invoice had unpaid due amount, decrements customer credit balance
   */
  cancelInvoice(invoiceId: number, reason = 'Invoice cancelled by cashier'): Invoice {
    const db = getDb()

    const executeCancel = db.transaction(() => {
      const invoice = this.getById(invoiceId)
      if (!invoice) throw new Error(`Invoice with ID ${invoiceId} not found`)
      if (invoice.status === 'CANCELLED') throw new Error(`Invoice ${invoice.invoice_no} is already cancelled`)

      // 1. Mark status as CANCELLED
      db.prepare(`
        UPDATE invoices
        SET status = 'CANCELLED',
            notes = COALESCE(notes || ' | ', '') || ?,
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(`CANCELLED: ${reason}`, invoiceId)

      // 2. Restore stock for each item
      if (invoice.items) {
        for (const item of invoice.items) {
          const product = productRepository.getById(item.product_id)
          if (product) {
            const restoredStock = product.stock_qty + item.qty
            db.prepare(`
              UPDATE products
              SET stock_qty = ?,
                  updated_at = datetime('now', 'localtime')
              WHERE id = ?
            `).run(restoredStock, item.product_id)

            db.prepare(`
              INSERT INTO stock_history (product_id, change_qty, balance_qty, reason, notes, reference_id)
              VALUES (?, ?, ?, 'return', ?, ?)
            `).run(
              item.product_id,
              item.qty,
              restoredStock,
              `Cancelled ${invoice.invoice_no}: ${reason}`,
              invoice.invoice_no
            )
          }
        }
      }

      // 3. Reverse customer credit balance if invoice had pending dues
      if (invoice.amount_due > 0 && invoice.customer_id) {
        db.prepare(`
          UPDATE customers
          SET credit_balance = MAX(0, credit_balance - ?),
              updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(invoice.amount_due, invoice.customer_id)
      }

      return this.getById(invoiceId)!
    })

    return executeCancel()
  },

  /**
   * Records a subsequent payment against a specific invoice with pending due balance
   */
  recordInvoicePayment(params: {
    invoiceId: number
    amount: number
    paymentMode: string
    notes?: string | null
  }): Invoice {
    const db = getDb()

    const executePayment = db.transaction(() => {
      const invoice = this.getById(params.invoiceId)
      if (!invoice) throw new Error(`Invoice #${params.invoiceId} not found`)
      if (invoice.status === 'CANCELLED') throw new Error(`Cannot accept payment on a cancelled invoice`)
      if (invoice.amount_due <= 0) throw new Error(`Invoice #${invoice.invoice_no} is already fully paid`)

      const payAmount = Math.max(0, Math.min(invoice.amount_due, Number(params.amount) || 0))
      if (payAmount <= 0) throw new Error('Payment amount must be greater than zero')

      const newAmountPaid = Number((invoice.amount_paid + payAmount).toFixed(2))
      const newAmountDue = Number((invoice.amount_due - payAmount).toFixed(2))
      const newStatus = newAmountDue <= 0 ? 'PAID' : 'PARTIALLY_PAID'

      // 1. Insert payment record
      db.prepare(`
        INSERT INTO payments (invoice_id, customer_id, amount, payment_mode, payment_date, notes)
        VALUES (?, ?, ?, ?, datetime('now', 'localtime'), ?)
      `).run(
        invoice.id,
        invoice.customer_id ?? null,
        payAmount,
        params.paymentMode,
        params.notes || `Payment towards dues of ${invoice.invoice_no}`
      )

      // 2. Update invoice status & amounts
      db.prepare(`
        UPDATE invoices
        SET amount_paid = ?,
            amount_due = ?,
            status = ?,
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(newAmountPaid, newAmountDue, newStatus, invoice.id)

      // 3. Reduce customer credit balance
      if (invoice.customer_id) {
        db.prepare(`
          UPDATE customers
          SET credit_balance = MAX(0, credit_balance - ?),
              updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(payAmount, invoice.customer_id)
      }

      return this.getById(invoice.id)!
    })

    return executePayment()
  },

  getById(id: number): Invoice | undefined {
    const db = getDb()
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as Invoice | undefined
    if (!invoice) return undefined

    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(id) as InvoiceItem[]
    const payments = db.prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY id ASC').all(id) as Payment[]

    return {
      ...invoice,
      items,
      payments,
    }
  },

  getAll(filters?: {
    status?: string
    customerId?: number
    search?: string
    limit?: number
  }): Invoice[] {
    const db = getDb()
    let query = 'SELECT * FROM invoices WHERE 1=1'
    const params: any[] = []

    if (filters?.status) {
      query += ' AND status = ?'
      params.push(filters.status)
    }

    if (filters?.customerId) {
      query += ' AND customer_id = ?'
      params.push(filters.customerId)
    }

    if (filters?.search) {
      query += ' AND (invoice_no LIKE ? OR customer_name LIKE ?)'
      const s = `%${filters.search}%`
      params.push(s, s)
    }

    query += ' ORDER BY id DESC'

    if (filters?.limit) {
      query += ' LIMIT ?'
      params.push(filters.limit)
    } else {
      query += ' LIMIT 100'
    }

    return db.prepare(query).all(...params) as Invoice[]
  },
}

// ==================== Held Bills ====================

export const heldBillRepository = {
  getAll(): HeldBill[] {
    const db = getDb()
    return db.prepare('SELECT * FROM held_bills ORDER BY id DESC').all() as HeldBill[]
  },

  create(data: {
    bill_label: string
    customer_id?: number | null
    customer_name?: string | null
    cart_json: string
    bill_discount_type?: 'percent' | 'flat'
    bill_discount_value?: number
    round_off_enabled?: number
    notes?: string | null
  }): HeldBill {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO held_bills (
        bill_label, customer_id, customer_name, cart_json,
        bill_discount_type, bill_discount_value, round_off_enabled, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const info = stmt.run(
      data.bill_label.trim(),
      data.customer_id ?? null,
      data.customer_name ?? null,
      data.cart_json,
      data.bill_discount_type || 'flat',
      data.bill_discount_value ?? 0,
      data.round_off_enabled ?? 1,
      data.notes ?? null
    )
    return db.prepare('SELECT * FROM held_bills WHERE id = ?').get(Number(info.lastInsertRowid)) as HeldBill
  },

  delete(id: number): boolean {
    const db = getDb()
    const result = db.prepare('DELETE FROM held_bills WHERE id = ?').run(id)
    return result.changes > 0
  },
}

// ==================== Settings ====================

export const settingsRepository = {
  get(key: string): string | null {
    const db = getDb()
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
    return row ? row.value : null
  },

  set(key: string, value: string): void {
    const db = getDb()
    db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, datetime('now', 'localtime'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = datetime('now', 'localtime')
    `).run(key, value)
  },
}

// ==================== Reports & Analytics ====================

export interface ReportStats {
  period: 'today' | 'week' | 'month'
  // Valuation metrics
  stockValuationCost: number
  stockValuationRetail: number
  projectedGrossMargin: number
  totalStockUnits: number
  totalProductsCount: number
  lowStockCount: number

  // Period sales metrics
  periodSalesTotal: number
  periodPaidTotal: number
  periodDueTotal: number
  periodInvoiceCount: number
  periodCostOfGoods: number
  periodGrossProfit: number
  periodGrossMarginPct: number

  // Customer dues
  totalCreditDue: number
  debtorsCount: number

  // Tender breakdown (Real split between Cash and UPI)
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

  // Category breakdown
  categoriesBreakdown: Array<{
    name: string
    productCount: number
    percentage: number
  }>
}

export const reportsRepository = {
  getStats(period: 'today' | 'week' | 'month' = 'today'): ReportStats {
    const db = getDb()

    // 1. Determine period date clause for invoices
    let invoiceDateClause = "date(inv.date) = date('now', 'localtime')"
    let simpleDateClause = "date(date) = date('now', 'localtime')"
    if (period === 'week') {
      invoiceDateClause = "date(inv.date) >= date('now', 'localtime', '-6 days')"
      simpleDateClause = "date(date) >= date('now', 'localtime', '-6 days')"
    } else if (period === 'month') {
      invoiceDateClause = "strftime('%Y-%m', inv.date) = strftime('%Y-%m', 'now', 'localtime')"
      simpleDateClause = "strftime('%Y-%m', date) = strftime('%Y-%m', 'now', 'localtime')"
    }

    // 2. Catalog Stock Valuation
    const catalogRow = db.prepare(`
      SELECT 
        COALESCE(SUM(stock_qty * purchase_price), 0) AS stockValuationCost,
        COALESCE(SUM(stock_qty * selling_price), 0) AS stockValuationRetail,
        COALESCE(SUM(stock_qty), 0) AS totalStockUnits,
        COUNT(*) AS totalProductsCount,
        COUNT(CASE WHEN stock_qty <= COALESCE(low_stock_threshold, 5) THEN 1 END) AS lowStockCount
      FROM products
    `).get() as any

    const stockValuationCost = Number(catalogRow?.stockValuationCost || 0)
    const stockValuationRetail = Number(catalogRow?.stockValuationRetail || 0)
    const projectedGrossMargin = Math.max(0, stockValuationRetail - stockValuationCost)
    const totalStockUnits = Number(catalogRow?.totalStockUnits || 0)
    const totalProductsCount = Number(catalogRow?.totalProductsCount || 0)
    const lowStockCount = Number(catalogRow?.lowStockCount || 0)

    // 3. Customer Ledger Total Credit Due
    const customerRow = db.prepare(`
      SELECT 
        COALESCE(SUM(credit_balance), 0) AS totalCreditDue,
        COUNT(CASE WHEN credit_balance > 0 THEN 1 END) AS debtorsCount
      FROM customers
      WHERE is_archived = 0 OR is_archived IS NULL
    `).get() as any

    const totalCreditDue = Number(customerRow?.totalCreditDue || 0)
    const debtorsCount = Number(customerRow?.debtorsCount || 0)

    // 4. Period Invoices Aggregates
    const salesRow = db.prepare(`
      SELECT 
        COALESCE(SUM(total), 0) AS periodSalesTotal,
        COALESCE(SUM(amount_paid), 0) AS periodPaidTotal,
        COALESCE(SUM(amount_due), 0) AS periodDueTotal,
        COUNT(*) AS periodInvoiceCount
      FROM invoices
      WHERE status != 'CANCELLED' AND ${simpleDateClause}
    `).get() as any

    const periodSalesTotal = Number(salesRow?.periodSalesTotal || 0)
    const periodPaidTotal = Number(salesRow?.periodPaidTotal || 0)
    const periodDueTotal = Number(salesRow?.periodDueTotal || 0)
    const periodInvoiceCount = Number(salesRow?.periodInvoiceCount || 0)

    // 5. Cost of Goods Sold in Period
    const cogsRow = db.prepare(`
      SELECT 
        COALESCE(SUM(ii.qty * COALESCE(p.purchase_price, ii.price, 0)), 0) AS periodCostOfGoods
      FROM invoice_items ii
      JOIN invoices inv ON ii.invoice_id = inv.id
      LEFT JOIN products p ON ii.product_id = p.id
      WHERE inv.status != 'CANCELLED' AND ${invoiceDateClause}
    `).get() as any

    const periodCostOfGoods = Number(cogsRow?.periodCostOfGoods || 0)
    const periodGrossProfit = Number((periodSalesTotal - periodCostOfGoods).toFixed(2))
    const periodGrossMarginPct = periodSalesTotal > 0
      ? Number(((periodGrossProfit / periodSalesTotal) * 100).toFixed(1))
      : 0

    // 6. Tender Distribution (Cash vs UPI from actual non-cancelled invoices in period)
    const tenderRows = db.prepare(`
      SELECT 
        UPPER(payment_mode) AS mode,
        COUNT(*) AS cnt,
        COALESCE(SUM(amount_paid), 0) AS total_amount
      FROM invoices
      WHERE status != 'CANCELLED' AND ${simpleDateClause}
      GROUP BY UPPER(payment_mode)
    `).all() as any[]

    let cashAmount = 0
    let cashCount = 0
    let upiAmount = 0
    let upiCount = 0

    for (const row of tenderRows) {
      if (row.mode === 'CASH') {
        cashAmount += Number(row.total_amount) || 0
        cashCount += Number(row.cnt) || 0
      } else if (row.mode === 'UPI') {
        upiAmount += Number(row.total_amount) || 0
        upiCount += Number(row.cnt) || 0
      }
    }

    const totalRecorded = Number((cashAmount + upiAmount).toFixed(2))
    const totalCount = cashCount + upiCount

    let cashPercentage = 0
    let upiPercentage = 0
    if (totalRecorded > 0) {
      cashPercentage = Math.round((cashAmount / totalRecorded) * 100)
      upiPercentage = 100 - cashPercentage
    }

    // 7. Inventory by Category (all registered categories with product counts)
    const catRows = db.prepare(`
      SELECT 
        c.name, 
        COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON (p.category_id = c.id OR (p.category_id IS NULL AND p.category = c.name))
      GROUP BY c.id
      ORDER BY product_count DESC, c.name ASC
    `).all() as any[]

    const categoriesBreakdown = catRows.map((r) => ({
      name: r.name,
      productCount: Number(r.product_count) || 0,
      percentage: totalProductsCount > 0
        ? Math.round(((Number(r.product_count) || 0) / totalProductsCount) * 100)
        : 0,
    }))

    return {
      period,
      stockValuationCost,
      stockValuationRetail,
      projectedGrossMargin,
      totalStockUnits,
      totalProductsCount,
      lowStockCount,
      periodSalesTotal,
      periodPaidTotal,
      periodDueTotal,
      periodInvoiceCount,
      periodCostOfGoods,
      periodGrossProfit,
      periodGrossMarginPct,
      totalCreditDue,
      debtorsCount,
      tenderDistribution: {
        cashAmount,
        cashCount,
        cashPercentage,
        upiAmount,
        upiCount,
        upiPercentage,
        totalRecorded,
        totalCount,
      },
      categoriesBreakdown,
    }
  },
}

// ==================== Database Backup & Disaster Recovery ====================

export const backupRepository = {
  async exportBackup(destinationPath: string): Promise<string> {
    const db = getDb()
    // Perform an atomic online WAL-safe backup using better-sqlite3
    await db.backup(destinationPath)
    return destinationPath
  },

  validateBackup(backupFilePath: string): { valid: boolean; error?: string } {
    if (!fs.existsSync(backupFilePath)) {
      return { valid: false, error: 'Backup file does not exist.' }
    }
    let tempDb: Database.Database | null = null
    try {
      tempDb = new Database(backupFilePath, { readonly: true, fileMustExist: true })
      const integrity = tempDb.pragma('integrity_check') as any[]
      if (!integrity || integrity[0]?.integrity_check !== 'ok') {
        return { valid: false, error: 'Database integrity check failed. The file is corrupted.' }
      }
      const tables = tempDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]
      const tableNames = new Set(tables.map((t) => t.name))
      const requiredTables = ['products', 'customers', 'invoices', 'settings']
      for (const req of requiredTables) {
        if (!tableNames.has(req)) {
          return { valid: false, error: `Invalid backup file: missing essential table "${req}".` }
        }
      }
      return { valid: true }
    } catch (err: any) {
      return { valid: false, error: 'The selected file is not a valid Retailer POS database backup.' }
    } finally {
      if (tempDb) {
        try {
          tempDb.close()
        } catch {}
      }
    }
  },

  async restoreBackup(backupFilePath: string, userDataPath: string): Promise<void> {
    // 1. Strict pre-validation: never touch current DB if backup is invalid
    const validation = this.validateBackup(backupFilePath)
    if (!validation.valid) {
      throw new Error(validation.error || 'The selected file is not a valid Retailer POS database backup.')
    }

    const currentDbPath = getDbPath()

    // 2. Close active connection cleanly
    if (dbInstance) {
      try {
        dbInstance.close()
      } catch (err) {
        console.error('[Backup] Error closing active DB before restore:', err)
      }
      dbInstance = null
    }

    // 3. Remove current DB file and any WAL / SHM temporary files
    const walPath = `${currentDbPath}-wal`
    const shmPath = `${currentDbPath}-shm`
    try {
      if (fs.existsSync(currentDbPath)) fs.unlinkSync(currentDbPath)
    } catch {}
    try {
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath)
    } catch {}
    try {
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath)
    } catch {}

    // 4. Copy validated backup file to active location
    fs.copyFileSync(backupFilePath, currentDbPath)

    // 5. Re-initialize database instance
    initDatabase(userDataPath)
  },
}
