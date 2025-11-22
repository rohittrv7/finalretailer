import { app } from "electron";
import path from "path";
import { Database } from "sqlite3";

const DB_PATH = path.join(app.getPath("userData"), "retail.db");

let dbInstance: Database | null = null;

export const getDB = (): Database => {
  if (dbInstance === null) {
    dbInstance = new Database(DB_PATH, (err) => {
      if (err) {
        console.error("Database connection failed:", err);
        app.quit();
        return;
      }
      console.log("Connected to database:", DB_PATH);
      dbInstance?.run("PRAGMA foreign_keys = ON");
      dbInstance?.run("PRAGMA journal_mode = WAL");
    });

    // Graceful shutdown
    app.once("quit", () => {
      if (dbInstance !== null) {
        dbInstance.close((err) => {
          if (err) console.error("Error closing database:", err);
          else console.log("Database closed properly");
        });
        dbInstance = null;
      }
    });
  }

  // Yahan TypeScript ko guarantee hai ki dbInstance null nahi hoga
  // Kyunki agar null tha to upar bana diya
  return dbInstance as Database;
};

// Initialize all tables (ek hi baar)
export const initializeDatabase = async (): Promise<void> => {
  const db = getDB();

  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      // Inventory Table
      db.run(`
        CREATE TABLE IF NOT EXISTS inventory (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          productName TEXT NOT NULL,
          category TEXT NOT NULL,
          brand TEXT,
          sku TEXT NOT NULL UNIQUE,
          barcode TEXT,
          unit TEXT NOT NULL,
          stock INTEGER NOT NULL DEFAULT 0,
          status TEXT DEFAULT 'active',
          reorderLevel INTEGER NOT NULL DEFAULT 10,
          purchasePrice REAL NOT NULL,
          sellingPrice REAL NOT NULL,
          mrp REAL,
          discount REAL DEFAULT 0,
          gstRate REAL NOT NULL DEFAULT 0,
          gstType TEXT DEFAULT 'CGST_SGST',
          isGstIncluded INTEGER NOT NULL DEFAULT 1,
          supplier TEXT,
          description TEXT,
          lowStockAlert INTEGER NOT NULL DEFAULT 1,
          purchaseDate TEXT,
          expiryDate TEXT,
          imageUrl TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Cart
      db.run(`
        CREATE TABLE IF NOT EXISTS cart (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          inventoryId TEXT NOT NULL,
          productName TEXT NOT NULL,
          sku TEXT NOT NULL,
          barcode TEXT,
          unit TEXT NOT NULL,
          sellingPrice REAL NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          discount REAL DEFAULT 0, -- new
          taxableAmount REAL NOT NULL,
          gstAmount REAL NOT NULL,
          cgst REAL DEFAULT 0,
          sgst REAL DEFAULT 0,
          igst REAL DEFAULT 0,
          totalPrice REAL NOT NULL, -- taxable + gst - discount
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (inventoryId) REFERENCES inventory(id) ON DELETE CASCADE
        );
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS store_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          storeName TEXT NOT NULL DEFAULT 'My Store',
          email TEXT,
          phone TEXT NOT NULL DEFAULT '',
          gstin TEXT UNIQUE,
          companyName TEXT,
          taxId TEXT,
          address TEXT NOT NULL DEFAULT '',
          logoUrl TEXT,
          gstVerified INTEGER DEFAULT 0,
          defaultCurrency TEXT NOT NULL DEFAULT 'INR',
          defaultTaxRate REAL NOT NULL DEFAULT 18.0,
          returnPolicy TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,                   -- UUID
          invoiceNumber TEXT UNIQUE,             -- INV-2025-000123
          date TEXT,                             -- ISO date

          customerName TEXT,
          customerPhone TEXT,

          paymentMethod TEXT,                    -- Cash, Card, UPI
          paymentRef TEXT,                       -- UPI ID / Txn ID / Card last 4
          subTotal REAL,
          discount REAL,
          discountType TEXT,                     -- percent | flat
          taxableAmount REAL,
          gstAmount REAL,
          cgst REAL,
          sgst REAL,
          igst REAL,

          roundOff REAL,
          grandTotal REAL,

          cashReceived REAL,                     -- Only for cash
          changeReturned REAL,

          storeId TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS invoice_items (
          id TEXT PRIMARY KEY,
          invoiceId TEXT,
          inventoryId TEXT,
          productName TEXT,
          quantity REAL,
          price REAL,
          taxableAmount REAL,
          gstRate REAL,
          gstAmount REAL,
          lineTotal REAL,

          FOREIGN KEY(invoiceId) REFERENCES invoices(id)
        );
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS invoice_meta (
          id TEXT PRIMARY KEY,
          invoiceId TEXT,
          cashierName TEXT,
          notes TEXT,
          footerMessage TEXT,

          FOREIGN KEY(invoiceId) REFERENCES invoices(id)
        );
      `);

      // Indexes
      const indexes = [
        "CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku)",
        "CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category)",
        "CREATE INDEX IF NOT EXISTS idx_inventory_stock ON inventory(stock)",
        "CREATE INDEX IF NOT EXISTS idx_cart_inventoryId ON cart(inventoryId)",
        "CREATE INDEX IF NOT EXISTS idx_cart_sku ON cart(sku)",
      ];

      let done = 0;
      const total = indexes.length + 2;

      const checkComplete = () => {
        if (++done === total) {
          console.log("Database & tables initialized successfully!");
          resolve();
        }
      };

      indexes.forEach((sql) => db.run(sql, checkComplete));

      // Triggers
      db.run(
        `
        CREATE TRIGGER IF NOT EXISTS trg_inventory_update 
        AFTER UPDATE ON inventory
        BEGIN
          UPDATE inventory SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `,
        checkComplete
      );

      db.run(
        `
        CREATE TRIGGER IF NOT EXISTS trg_cart_update 
        AFTER UPDATE ON cart
        BEGIN
          UPDATE cart SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `,
        checkComplete
      );

      db.run(`
        CREATE TRIGGER IF NOT EXISTS update_store_settings_updatedAt
        AFTER UPDATE ON store_settings
        FOR EACH ROW
        BEGIN
          UPDATE store_settings SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
        END;
      `),
        checkComplete();
    });
  });
};
