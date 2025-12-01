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

export const initializeDatabase = async (): Promise<void> => {
  const db = getDB();
  // addColumn("customers", "created_at", "TEXT").catch((err) => {
  //   console.error("Error adding hsnCode column:", err);
  // });

  // updateColumn("customers", "created_at", "datetime('now')").catch((err) => {
  //   console.error("Error updating created_at column:", err);
  // });
  return new Promise<void>((resolve, _reject) => {
    db.serialize(() => {
      // auth table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY, -- UUID

          -- Business Info
          businessName TEXT NOT NULL,
          ownerName TEXT NOT NULL,
          phone TEXT NOT NULL,
          businessCategory TEXT NOT NULL,

          -- Auth
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,

          -- Account Status
          isActive BOOLEAN DEFAULT 1,
          isTrial BOOLEAN DEFAULT 1,
          trialEndsAt DATETIME DEFAULT (datetime('now', '+14 days')),
          isEmailVerified BOOLEAN DEFAULT 0,

          -- Security
          failedLoginAttempts INTEGER DEFAULT 0,
          lockedUntil DATETIME NULL,

          -- Role & Permissions (Future mein multiple users ke liye)
          role TEXT DEFAULT 'owner' CHECK(role IN ('owner', 'admin', 'cashier', 'viewer')),

          -- App State
          isFirstLogin BOOLEAN DEFAULT 1,
          plan TEXT DEFAULT 'trial', -- trial, pro, enterprise
          licenseKey TEXT NULL,

          -- Timestamps
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Ensure only ONE user (owner) exists
        CREATE UNIQUE INDEX IF NOT EXISTS idx_single_owner ON users ((1));
      `);

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
          hsnCode TEXT,
          gstAmount REAl DEFAULT 0,
          taxableAmount REAL DEFAULT 0,
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

      // store settings
      db.run(`
        CREATE TABLE IF NOT EXISTS store_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          storeName TEXT NOT NULL,
          ownerName TEXT,
          phone TEXT,
          email TEXT,
          address TEXT,
          gstNumber TEXT,
          stateCode TEXT, -- e.g. RJ = 08
          isGstEnabled INTEGER DEFAULT 1, -- 1 = GST billing, 0 = NO GST
          gstIncludedDefault INTEGER DEFAULT 0, -- MRP included GST hota hai = 1
          invoicePrefix TEXT DEFAULT 'INV',
          invoiceStartNumber INTEGER DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Invoices Table
      db.run(`
        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          invoiceNumber TEXT UNIQUE,
          date TEXT,
          customerId TEXT,
          customerName TEXT,
          customerPhone TEXT,
          billingAddress TEXT,
          shippingAddress TEXT,
          transportDetails TEXT, -- JSON string (vehicle,lr,transportName)
          paymentMeta TEXT,      -- JSON string (payments array)
          subTotal REAL,
          discount REAL,
          discountType TEXT,
          taxableAmount REAL,
          gstAmount REAL,
          cgst REAL,
          sgst REAL,
          igst REAL,
          roundOff REAL,
          grandTotal REAL,
          totalQty REAL,
          status TEXT DEFAULT 'Due' CHECK (status IN ('Paid', 'Partial', 'Due')),  -- Auto-set based on due_amount,
          totalItems INTEGER,
          cashierName TEXT,
          storeId TEXT,
          paidAmount REAL DEFAULT 0,
          dueAmount REAL DEFAULT 0,
          paymentStatus TEXT DEFAULT 'Paid',
          notes TEXT,
          footerMessage TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          -- FOREIGN KEY(customerId) REFERENCES customers(id)
        );
      `);

      // Invoice Items Table
      db.run(`
        CREATE TABLE IF NOT EXISTS invoice_items (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          invoiceId TEXT,
          inventoryId TEXT,
          productName TEXT,
          hsnCode TEXT,
          sku TEXT,
          unit TEXT,
          quantity REAL,
          unitPrice REAL,
          lineDiscount REAL DEFAULT 0,
          taxableAmount REAL,
          gstRate REAL,
          gstAmount REAL,
          cgst REAL,
          sgst REAL,
          igst REAL,
          lineTotal REAL, -- taxable + gst - discount
          FOREIGN KEY(invoiceId) REFERENCES invoices(id) ON DELETE CASCADE
        );
      `);

      // Invoice Meta Table
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

      // Custmer details
      db.run(`
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT UNIQUE NOT NULL,
          address TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `);

      // Customer Ledger Table
      db.run(`
        CREATE TABLE IF NOT EXISTS customer_ledger (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          invoice_id TEXT,
          type TEXT NOT NULL,
          amount REAL NOT NULL,
          balance REAL NOT NULL,       -- Running balance after this entry (for easy querying)
          date TEXT NOT NULL DEFAULT (datetime('now')),
          reference TEXT,
          notes TEXT,
          FOREIGN KEY(customer_id) REFERENCES customers(id)
        );
      `);

      // Suppliers Table
      db.run(`
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          address TEXT,
          gstNumber TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
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

export const addColumn = (
  table: string,
  column: string,
  definition: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const db = getDB();
    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (err) => {
      if (err && !err.message.includes("duplicate column name")) {
        reject(err);
      } else {
        if (!err) console.log(`Added column: ${column}`);
        resolve();
      }
    });
  });
};

export const updateColumn = (
  table: string,
  column: string,
  definition: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const db = getDB();
    db.run(
      `UPDATE ${table} SET ${column} = ${definition} WHERE created_at IS NULL OR created_at = ''`,
      (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Updated column: ${column}`);
          resolve();
        }
      }
    );
  });
};
