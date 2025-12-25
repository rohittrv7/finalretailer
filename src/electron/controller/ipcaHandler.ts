import { ipcMain } from "electron";
import jwt from "jsonwebtoken";
// eslint-disable-next-line import/no-unresolved
import { InventoryItem } from "@/frontend/types/inventry";
import { getDB } from "../database/db";
// import { CartItem } from "@/frontend/types/cart";
import { Database } from "sqlite3";
import {
  getUser,
  isFirstTimeSetup,
  checkSetupComplete,
  setupBusiness,
  updateUser,
} from "../service/authService";
// import { checkUserEntitlements } from "../services/licenseService";
import { UserProfile } from "../types/user";
import { checkUserEntitlements } from "../database/licenseService";

// This secret should NOT be in the renderer process.
const JWT_SECRET = "your-super-secret-for-license-keys-that-is-very-long";

// This is a main-process-only utility function.
// It is NOT exported and NOT available to the renderer process.
const generateLicense = (
  plan: "starter" | "standard" | "pro",
  durationInDays?: number
): string => {
  const payload: { plan: string; expiresAt?: string } = { plan };
  if (plan !== "starter" && durationInDays) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationInDays);
    payload.expiresAt = expiryDate.toISOString();
  }
  return jwt.sign(payload, JWT_SECRET);
};

export function calculateTotals(
  unitPrice: number,
  qty: number,
  gstRate: number,
  isGstIncluded: boolean,
  discountPerItem: number = 0,
  applyGST: boolean = true
) {
  const rate = Number(gstRate) || 0;
  const q = Math.max(1, Number(qty) || 1);
  const disc = Math.max(0, Number(discountPerItem) || 0);

  // Effective price after discount
  const discountedUnit = Math.max(0, unitPrice - disc);

  // If GST not applied (store unverified OR gstRate === 0)
  if (!applyGST || rate === 0) {
    const taxable = discountedUnit * q;
    return {
      taxable: +taxable.toFixed(2),
      gstAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      total: +taxable.toFixed(2),
    };
  }

  let unitTaxable = 0;
  let unitGst = 0;

  if (isGstIncluded) {
    unitTaxable = discountedUnit / (1 + rate / 100);
    unitGst = discountedUnit - unitTaxable;
  } else {
    unitTaxable = discountedUnit;
    unitGst = (unitTaxable * rate) / 100;
  }

  const taxable = unitTaxable * q;
  const gstAmount = unitGst * q;

  return {
    taxable: +taxable.toFixed(2),
    gstAmount: +gstAmount.toFixed(2),
    cgst: +(gstAmount / 2).toFixed(2),
    sgst: +(gstAmount / 2).toFixed(2),
    igst: 0,
    total: +(taxable + gstAmount).toFixed(2),
  };
}

async function generateInvoiceNumber(db: Database): Promise<string> {
  const currentYear = new Date().getFullYear();

  return new Promise<string>((resolve, reject) => {
    db.serialize(() => {
      // Step 1: Billing settings fetch karo (sirf ek row assume kar rahe hain)
      db.get(
        `SELECT invoicePrefix, invoiceStartNumber FROM billingSettings LIMIT 1`,
        [],
        (err: any, settingsRow: any) => {
          if (err) return reject(err);

          const prefix = (settingsRow?.invoicePrefix || "INV-").trim();
          const startNum = Number(settingsRow?.invoiceStartNumber || 1);

          if (!prefix) {
            return reject(
              new Error("Invoice prefix not configured in billing settings")
            );
          }

          // Step 2: Is saal ka last invoice dhundho
          db.get(
            `SELECT invoiceNumber 
             FROM invoices 
             WHERE invoiceNumber LIKE ? 
             ORDER BY createdAt DESC 
             LIMIT 1`,
            [`${prefix}${currentYear}-%`],
            (err: any, row: any) => {
              if (err) return reject(err);

              let nextNumber: number;

              if (!row) {
                // Is saal ka pehla invoice → start number se shuru
                nextNumber = startNum;
              } else {
                const lastInvoice = row.invoiceNumber as string; // e.g., "INV-2025-00123"
                const parts = lastInvoice.split("-");
                const numPart = parts[parts.length - 1]; // last part after final -
                const lastNum = Number(numPart || "0");
                nextNumber = lastNum + 1;
              }

              // Pad with zeros (6 digits recommended for clean look)
              const padded = String(nextNumber).padStart(6, "0");

              const newInvoiceNumber = `${prefix}${currentYear}-${padded}`;
              resolve(newInvoiceNumber);
            }
          );
        }
      );
    });
  });
}

function calculateTotalsWithDiscount(
  unitPrice: number,
  qty: number,
  gstRate: number,
  isGstIncluded: boolean,
  lineDiscount = 0,
  applyGST = true
) {
  const rate = Number(gstRate) || 0;
  const discountPerUnit = Number(lineDiscount) || 0;

  // effective unit price after discount
  const priceAfterDiscount = unitPrice - discountPerUnit;

  let unitTaxable = 0;
  let unitGST = 0;

  if (!applyGST || rate === 0) {
    unitTaxable = priceAfterDiscount;
    unitGST = 0;
  } else if (isGstIncluded) {
    unitTaxable = priceAfterDiscount / (1 + rate / 100);
    unitGST = priceAfterDiscount - unitTaxable;
  } else {
    unitTaxable = priceAfterDiscount;
    unitGST = (unitTaxable * rate) / 100;
  }

  const taxable = +(unitTaxable * qty).toFixed(2);
  const gstAmount = +(unitGST * qty).toFixed(2);
  const cgst = +(gstAmount / 2 || 0).toFixed(2);
  const sgst = +(gstAmount / 2 || 0).toFixed(2);
  const igst = 0;
  const total = +(taxable + gstAmount).toFixed(2);

  return { taxable, gstAmount, cgst, sgst, igst, total };
}

export const setupIpcHandlers = () => {
  // ====================== AUTH HANDLERS ============================
  ipcMain.handle(
    "app-is-setup-complete",
    async () => await checkSetupComplete()
  );
  ipcMain.handle("app-is-first-time", () => isFirstTimeSetup());

  // ================== inventory state ============================
  ipcMain.handle("inventory:state", async () => {
    const db = await getDB();

    const runGet = (query: string, params: any[] = []) =>
      new Promise<any>((resolve, reject) => {
        db.get(query, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

    try {
      const total = await runGet("SELECT COUNT(*) AS total FROM inventory");
      const low = await runGet(
        "SELECT COUNT(*) AS low FROM inventory WHERE stock <= reorderLevel AND stock > 0"
      );
      const oos = await runGet(
        "SELECT COUNT(*) AS oos FROM inventory WHERE stock = 0"
      );
      const val = await runGet(
        "SELECT SUM(stock * sellingPrice) AS stockVal FROM inventory"
      );

      const stats = {
        totalItems: total.total || 0,
        lowStock: low.low || 0,
        outOfStock: oos.oos || 0,
        stockValue: val.stockVal || 0,
      };

      return {
        success: true,
        data: stats,
      };
    } catch (e: any) {
      return {
        success: false,
        message: e.message,
      };
    }
  });

  // Dashboard summary handler: returns today's sales/profit/orders, monthly sales & profit, low stock and expiring items
  ipcMain.handle("dashboard:get", async () => {
    const db = await getDB();

    const runGet = (query: string, params: any[] = []) =>
      new Promise<any>((resolve, reject) => {
        db.get(query, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

    const runAll = (query: string, params: any[] = []) =>
      new Promise<any[]>((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

    try {
      // Today's sales & orders
      const todayRow = (await runGet(
        `SELECT IFNULL(SUM(grandTotal),0) AS todaySales, COUNT(*) AS orders
         FROM invoices
         WHERE date(date) = date('now','localtime')`
      )) || { todaySales: 0, orders: 0 };

      // Today's profit (using invoice items and inventory purchasePrice)
      const profitRow = (await runGet(
        `SELECT IFNULL(SUM((ii.unitPrice - COALESCE(inv.purchasePrice, ii.unitPrice)) * ii.quantity),0) AS profit
         FROM invoiceItems ii
         JOIN invoices i ON ii.invoiceId = i.id
         LEFT JOIN inventory inv ON ii.inventoryId = inv.id
         WHERE date(i.date) = date('now','localtime')`
      )) || { profit: 0 };

      // Monthly sales for current year (array of 12 months)
      const salesRows = (await runAll(
        `SELECT strftime('%m', date) AS month, IFNULL(SUM(grandTotal),0) AS sales
         FROM invoices
         WHERE strftime('%Y', date) = strftime('%Y','now','localtime')
         GROUP BY month
         ORDER BY month`
      )) || [];

      // Monthly profit for current year
      const profitRows = (await runAll(
        `SELECT strftime('%m', i.date) AS month, IFNULL(SUM((ii.unitPrice - COALESCE(inv.purchasePrice, ii.unitPrice)) * ii.quantity),0) AS profit
         FROM invoiceItems ii
         JOIN invoices i ON ii.invoiceId = i.id
         LEFT JOIN inventory inv ON ii.inventoryId = inv.id
         WHERE strftime('%Y', i.date) = strftime('%Y','now','localtime')
         GROUP BY month
         ORDER BY month`
      )) || [];

      // Build full 12-month arrays (Jan..Dec)
      const months = Array.from({ length: 12 }, (_, i) => ({
        month: String(i + 1).padStart(2, '0'),
        sales: 0,
        profit: 0,
      }));

      for (const r of salesRows) {
        const idx = Number(r.month) - 1;
        if (months[idx]) months[idx].sales = Number(r.sales) || 0;
      }
      for (const r of profitRows) {
        const idx = Number(r.month) - 1;
        if (months[idx]) months[idx].profit = Number(r.profit) || 0;
      }

      // Low stock items
      const lowStock = (await runAll(
        `SELECT id, productName, stock, reorderLevel
         FROM inventory
         WHERE stock <= reorderLevel AND stock > 0
         ORDER BY stock ASC
         LIMIT 10`
      )) || [];

      // Expiring soon (next 30 days)
      const expiring = (await runAll(
        `SELECT id, productName, stock, expiryDate,
                CAST((julianday(expiryDate) - julianday('now')) AS INTEGER) AS daysToExpiry
         FROM inventory
         WHERE expiryDate IS NOT NULL
           AND date(expiryDate) BETWEEN date('now','localtime') AND date('now','+30 days','localtime')
         ORDER BY expiryDate ASC
         LIMIT 10`
      )) || [];

      return {
        success: true,
        data: {
          todaySales: Number(todayRow.todaySales) || 0,
          todayProfit: Number(profitRow.profit) || 0,
          todayOrders: Number(todayRow.orders) || 0,
          months,
          lowStock,
          expiring,
        },
      };
    } catch (e: any) {
      console.error("dashboard:get error:", e);
      return { success: false, message: e.message };
    }
  });

  // Dashboard: Top categories & top products for sidebar cards / lists
  ipcMain.handle("dashboard:topLists", async () => {
    const db = await getDB();

    const runAll = (query: string, params: any[] = []) =>
      new Promise<any[]>((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

    try {
      const categoriesRows = await runAll(`
        SELECT COALESCE(inv.category, 'Uncategorized') AS category,
               IFNULL(SUM(ii.unitPrice * ii.quantity),0) AS sales,
               IFNULL(SUM((ii.unitPrice - COALESCE(inv.purchasePrice, ii.unitPrice)) * ii.quantity),0) AS profit
        FROM invoiceItems ii
        JOIN invoices i ON ii.invoiceId = i.id
        LEFT JOIN inventory inv ON ii.inventoryId = inv.id
        WHERE strftime('%Y', i.date) = strftime('%Y','now','localtime')
        GROUP BY category
        ORDER BY sales DESC
        LIMIT 10
      `);

      const productsRows = await runAll(`
        SELECT COALESCE(ii.productName, 'Unknown') AS productName,
               IFNULL(SUM(ii.quantity),0) AS units,
               IFNULL(SUM(ii.unitPrice * ii.quantity),0) AS revenue,
               IFNULL(SUM((ii.unitPrice - COALESCE(inv.purchasePrice, ii.unitPrice)) * ii.quantity),0) AS profit
        FROM invoiceItems ii
        JOIN invoices i ON ii.invoiceId = i.id
        LEFT JOIN inventory inv ON ii.inventoryId = inv.id
        WHERE strftime('%Y', i.date) = strftime('%Y','now','localtime')
        GROUP BY ii.productName
        ORDER BY units DESC
        LIMIT 10
      `);

      const categories = (categoriesRows || []).map((r) => ({
        category: r.category,
        sales: Number(r.sales) || 0,
        profit: Number(r.profit) || 0,
        margin: Number(r.sales) ? +((Number(r.profit) / Number(r.sales)) * 100).toFixed(1) : 0,
      }));

      const products = (productsRows || []).map((r) => ({
        product: r.productName,
        units: Number(r.units) || 0,
        revenue: Number(r.revenue) || 0,
        profit: Number(r.profit) || 0,
      }));

      return { success: true, data: { categories, products } };
    } catch (e: any) {
      console.error("dashboard:topLists error:", e);
      return { success: false, message: e.message };
    }
  });

  // --- Consolidated & Corrected Auth Handlers ---
  ipcMain.handle("app-setup-business", async (event, data) => {
    // The trial period is now set inside the setupBusiness service itself.
    return setupBusiness(data);
  });

  ipcMain.handle("app-get-user", async () => {
    const user = await getUser();
    if (!user) {
      // This can happen before setup is complete. It's not an error.
      return null;
    }
    const entitlements = checkUserEntitlements(user);
    return { user, entitlements };
  });

  ipcMain.handle(
    "license:simulatePurchase",
    async (
      event,
      planName: "Starter" | "Standard" | "Pro",
      billingCycle: "monthly" | "yearly"
    ) => {
      // 1. Generate the license key securely in the main process
      const plan = planName.toLowerCase() as "starter" | "standard" | "pro";
      let licenseKey: string;
      if (plan === "starter") {
        licenseKey = generateLicense("starter");
      } else {
        const duration = billingCycle === "yearly" ? 365 : 30;
        licenseKey = generateLicense(plan, duration);
      }

      // 2. Activate the license (logic from the old 'license:activate' handler)
      const user = await getUser();
      if (!user) {
        throw new Error("User not found. Cannot activate license.");
      }

      const updatedProfile: Partial<UserProfile> = {
        licenseKey,
        isTrial: false,
      };

      await updateUser(updatedProfile);

      // 3. Re-fetch user and return new entitlements
      const finalUser = await getUser();
      if (!finalUser) {
        throw new Error("Failed to retrieve updated user profile.");
      }
      const entitlements = checkUserEntitlements(finalUser);

      return { success: true, data: { user: finalUser, entitlements } };
    }
  );

  // ================== Add inventory item =========================
  // ipcMain.handle("inventory:add", async (_, item: InventoryItem) => {
  //   try {
  //     const db = await getDB();

  //     return new Promise((resolve) => {
  //       db.run(
  //         `
  //                   INSERT INTO inventory (
  //                   productName, category, brand, sku, barcode,
  //                   unit, stock, status, reorderLevel, purchasePrice,
  //                   sellingPrice, mrp, discount, gstRate, gstType, isGstIncluded,
  //                   supplier, description, lowStockAlert, purchaseDate, expiryDate, imageUrl
  //                   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  //                   `,
  //         [
  //           item.productName,
  //           item.category,
  //           item.brand ?? null,
  //           item.sku,
  //           item.barcode ?? null,
  //           item.unit,
  //           item.stock ?? 0,
  //           item.status ?? "active",
  //           item.reorderLevel ?? 10,
  //           item.purchasePrice,
  //           item.sellingPrice,
  //           item.mrp ?? null,
  //           item.discount ?? 0,
  //           item.gstRate ?? 0,
  //           item.gstType ?? "CGST_SGST",
  //           item.isGstIncluded ? 1 : 0,
  //           item.supplier ?? null,
  //           item.description ?? null,
  //           item.lowStockAlert ?? 1,
  //           item.purchaseDate ?? null,
  //           item.expiryDate ?? null,
  //           item.imageUrl ?? null,
  //         ],
  //         function (err) {
  //           if (err) {
  //             resolve({ success: false, error: err.message });
  //           } else {
  //             resolve({ success: true, id: this.lastID.toString() });
  //           }
  //         }
  //       );
  //     });
  //   } catch (error) {
  //     return { success: false, error: error.message };
  //   }
  // });
  ipcMain.handle("inventory:add", async (_event, item: InventoryItem) => {
    try {
      const db = await getDB();

      const user = await getUser();

      if (!user) {
        return { success: false, error: "User not logged in" };
      }

      return new Promise((resolve) => {
        db.run(
          `
        INSERT INTO inventory (
          userId,
          productName,
          category,
          brand,
          sku,
          barcode,
          unit,
          stock,
          reorderLevel,
          purchasePrice,
          sellingPrice,
          mrp,
          discount,
          hsnCode,
          gstRate,
          supplier,
          description,
          -- purchaseDate,
          -- expiryDate,
          imageUrl,
          status
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        `,
          [
            user.id,

            item.productName,
            item.category,
            item.brand ?? null,
            item.sku,
            item.barcode ?? null,
            item.unit,

            item.stock ?? 0,
            item.reorderLevel ?? 10,

            item.purchasePrice,
            item.sellingPrice,
            item.mrp ?? null,
            item.discount ?? 0,

            item.hsnCode ?? null,
            item.gstRate ?? 0,

            item.supplier ?? null,
            item.description ?? null,
            // item.purchaseDate ?? null,
            // item.expiryDate ?? null,
            item.imageUrl ?? null,
            item.status ?? "active",
          ],
          function (err) {
            if (err) {
              return resolve({ success: false, error: err.message });
            }

            resolve({ success: true });
          }
        );
      });
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // ================== Get all inventory items =====================
  ipcMain.handle("inventory:getAll", async () => {
    try {
      const db = await getDB();

      return new Promise((resolve) => {
        db.all(
          "SELECT * FROM inventory ORDER BY createdAt DESC",
          (err, rows: InventoryItem[]) => {
            if (err) {
              resolve({ success: false, error: err.message });
            } else {
              resolve({ success: true, data: rows });
            }
          }
        );
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ================== Get inventory item by ID =====================
  ipcMain.handle("inventory:getById", async (_, id: string) => {
    try {
      const db = await getDB();

      return new Promise((resolve) => {
        db.get(
          "SELECT * FROM inventory WHERE id = ?",
          [id],
          (err, row: InventoryItem) => {
            if (err) {
              resolve({ success: false, error: err.message });
            } else {
              resolve({ success: true, data: row });
            }
          }
        );
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ================== Update inventory item =====================
  ipcMain.handle(
    "inventory:update",
    async (event, id: string, item: Partial<InventoryItem>) => {
      try {
        const db = await getDB();

        const fields = Object.keys(item).filter((key) => key !== "id");
        const values = fields.map((key) => item[key as keyof InventoryItem]);
        const setClause = fields.map((field) => `${field} = ?`).join(", ");

        return new Promise((resolve) => {
          db.run(
            `UPDATE inventory SET ${setClause} WHERE id = ?`,
            [...values, id],
            function (err) {
              if (err) {
                resolve({ success: false, error: err.message });
              } else {
                resolve({ success: true });
              }
            }
          );
        });
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  );

  // ================== Delete inventory item =====================
  ipcMain.handle("inventory:delete", async (_, id: string) => {
    try {
      const db = await getDB();

      return new Promise((resolve) => {
        db.run("DELETE FROM inventory WHERE id = ?", [id], function (err) {
          if (err) {
            resolve({ success: false, error: err.message });
          } else {
            resolve({ success: true });
          }
        });
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ================== Add to Cart (Smart: Merge if exists) ==================
  ipcMain.handle("cart:add", async (_, { item, quantity = 1 }) => {
    const db = getDB();
    const qtyToAdd = Math.max(1, quantity);

    try {
      await new Promise<void>((resolve, reject) => {
        db.serialize(() => {
          db.run("BEGIN TRANSACTION");

          // Step 1: Check if item already exists in cart
          db.get(
            `SELECT * FROM cart WHERE inventoryId = ?`,
            [item.id],
            (err, existingRow: any) => {
              if (err) {
                db.run("ROLLBACK");
                return reject(err);
              }

              if (existingRow) {
                // Item already in cart → Increase quantity
                const newQty = existingRow.quantity + qtyToAdd;

                // Update stock (decrease by qtyToAdd)
                db.run(
                  `UPDATE inventory SET stock = stock - ? WHERE id = ?`,
                  [qtyToAdd, item.id],
                  function (err) {
                    if (err || this.changes === 0) {
                      db.run("ROLLBACK");
                      return reject(new Error("Failed to update stock"));
                    }

                    // Recalculate totals
                    const totals = calculateTotals(
                      existingRow.sellingPrice,
                      newQty,
                      item.gstRate,
                      !!item.isGstIncluded,
                      existingRow.discount ?? 0,
                      true
                    );

                    // Update cart row
                    db.run(
                      `
                    UPDATE cart SET
                      quantity = ?,
                      taxableAmount = ?,
                      gstAmount = ?,
                      cgst = ?,
                      sgst = ?,
                      igst = ?,
                      totalPrice = ?,
                      updatedAt = CURRENT_TIMESTAMP
                    WHERE id = ?
                  `,
                      [
                        newQty,
                        totals.taxable,
                        totals.gstAmount,
                        totals.cgst,
                        totals.sgst,
                        totals.igst,
                        totals.total,
                        existingRow.id,
                      ],
                      function (err) {
                        if (err) {
                          db.run("ROLLBACK");
                          return reject(err);
                        }
                        db.run("COMMIT");
                        resolve();
                      }
                    );
                  }
                );
              } else {
                // New item → Insert fresh row
                // First reduce stock
                db.run(
                  `UPDATE inventory SET stock = stock - ? WHERE id = ?`,
                  [qtyToAdd, item.id],
                  function (err) {
                    if (err || this.changes === 0) {
                      db.run("ROLLBACK");
                      return reject(
                        new Error("Out of stock or item not found")
                      );
                    }

                    const totals = calculateTotals(
                      item.sellingPrice,
                      qtyToAdd,
                      item.gstRate,
                      !!item.isGstIncluded,
                      item.discount ?? 0,
                      true
                    );

                    db.run(
                      `
                    INSERT INTO cart (
                      inventoryId, productName, sku, barcode, unit, sellingPrice,
                      quantity, discount, taxableAmount, gstAmount, cgst, sgst, igst, totalPrice
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `,
                      [
                        item.id,
                        item.productName,
                        item.sku,
                        item.barcode,
                        item.unit,
                        item.sellingPrice,
                        qtyToAdd,
                        item.discount ?? 0,
                        totals.taxable,
                        totals.gstAmount,
                        totals.cgst,
                        totals.sgst,
                        totals.igst,
                        totals.total,
                      ],
                      function (err) {
                        if (err) {
                          db.run("ROLLBACK");
                          return reject(err);
                        }
                        db.run("COMMIT");
                        resolve();
                      }
                    );
                  }
                );
              }
            }
          );
        });
      });

      return { success: true };
    } catch (error: any) {
      console.error("cart:add error:", error);
      return {
        success: false,
        error: error.message || "Failed to add to cart",
      };
    }
  });

  // ================== Update Quantity ==================
  ipcMain.handle("cart:updateQuantity", async (_, { cartId, newQuantity }) => {
    const db = getDB();
    const qty = Math.max(1, newQuantity);

    try {
      await new Promise<void>((resolve, reject) => {
        db.get(`SELECT * FROM cart WHERE id = ?`, [cartId], (err, row: any) => {
          if (err || !row) {
            return resolve(); // or reject if you want strict
          }

          const oldQty = row.quantity;
          const diff = qty - oldQty;

          db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            if (diff !== 0) {
              db.run(
                `UPDATE inventory SET stock = stock - ? WHERE id = ?`,
                [diff, row.inventoryId],
                function (err) {
                  if (err || this.changes === 0) {
                    db.run("ROLLBACK");
                    return reject(new Error("Stock update failed"));
                  }
                }
              );
            }

            const updated = calculateTotals(
              row.sellingPrice,
              qty,
              row.gstRate,
              !!row.isGstIncluded,
              row.discount ?? 0,
              true
            );

            db.run(
              `
            UPDATE cart SET
              quantity = ?,
              taxableAmount = ?,
              gstAmount = ?,
              cgst = ?,
              sgst = ?,
              igst = ?,
              totalPrice = ?,
              updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
          `,
              [
                qty,
                updated.taxable,
                updated.gstAmount,
                updated.cgst,
                updated.sgst,
                updated.igst,
                updated.total,
                cartId,
              ],
              function (err) {
                if (err) {
                  db.run("ROLLBACK");
                  reject(err);
                } else {
                  db.run("COMMIT");
                  resolve();
                }
              }
            );
          });
        });
      });

      return { success: true };
    } catch (error) {
      console.error("cart:updateQuantity error:", error);
      return { success: false };
    }
  });

  // ================== Remove Cart Item ==================
  ipcMain.handle("cart:remove", async (_, cartId) => {
    const db = getDB();

    try {
      await new Promise<void>((resolve, reject) => {
        db.get(
          `SELECT quantity, inventoryId FROM cart WHERE id = ?`,
          [cartId],
          (err, row: any) => {
            if (err || !row) {
              return reject(new Error("Cart item not found"));
            }

            db.serialize(() => {
              db.run("BEGIN TRANSACTION");

              // Restore stock
              db.run(
                `UPDATE inventory SET stock = stock + ? WHERE id = ?`,
                [row.quantity, row.inventoryId],
                function (err) {
                  if (err) {
                    db.run("ROLLBACK");
                    return reject(err);
                  }
                }
              );

              // Delete from cart
              db.run(`DELETE FROM cart WHERE id = ?`, [cartId], function (err) {
                if (err) {
                  db.run("ROLLBACK");
                  reject(err);
                } else {
                  db.run("COMMIT");
                  resolve();
                }
              });
            });
          }
        );
      });

      return { success: true };
    } catch (error: any) {
      console.error("cart:remove error:", error);
      return { success: false, error: error.message };
    }
  });

  // ================== Clear Cart ==================
  ipcMain.handle("cart:clear", async () => {
    const db = getDB();

    try {
      await new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run("BEGIN TRANSACTION");

          db.all(
            `SELECT inventoryId, quantity FROM cart`,
            (err, rows: any[]) => {
              if (err || rows.length === 0) {
                db.run("COMMIT");
                return resolve({
                  success: true,
                  message: "Cart already empty",
                });
              }

              let restored = 0;
              const total = rows.length;

              rows.forEach((row) => {
                db.run(
                  `UPDATE inventory SET stock = stock + ? WHERE id = ?`,
                  [row.quantity, row.inventoryId],
                  function (err) {
                    if (err) {
                      db.run("ROLLBACK");
                      return reject(new Error("Failed to restore stock"));
                    }
                    restored++;
                    if (restored === total) {
                      db.run(`DELETE FROM cart`, (err) => {
                        if (err) {
                          db.run("ROLLBACK");
                          reject(err);
                        } else {
                          db.run("COMMIT");
                          resolve({
                            success: true,
                            message: "Cart cleared successfully",
                          });
                        }
                      });
                    }
                  }
                );
              });
            }
          );
        });
      });

      return { success: true };
    } catch (error: any) {
      console.error("cart:clear error:", error);
      return { success: false, error: error.message };
    }
  });

  // ================= GET CURRENT CART =================
  ipcMain.handle("cart:getAll", async () => {
    const db = getDB();

    return new Promise((resolve) => {
      db.all(`SELECT * FROM cart ORDER BY createdAt DESC`, (err, rows) => {
        if (err) {
          return resolve({ success: false, data: [], error: err.message });
        }

        resolve({ success: true, data: rows });
      });
    });
  });

  // ================= STORE: GET =================
  // 07AAHCC9731E1ZN
  ipcMain.handle("store:get", async () => {
    const db = getDB();

    return new Promise((resolve) => {
      db.get(`SELECT * FROM storeSettings`, (err, row: any) => {
        if (err) {
          return resolve({ success: false, error: err.message });
        }

        if (!row) {
          return resolve({ success: true, data: null });
        }

        resolve({ success: true, data: row });
      });
    });
  });

  ipcMain.handle("store:billingSettings", async () => {
    const db = getDB();

    return new Promise((resolve) => {
      db.get(`SELECT * FROM billingSettings LIMIT 1`, (err, row) => {
        if (err) {
          return resolve({ success: false, error: err.message });
        }

        // 👉 Agar first time hai (row nahi hai)
        if (!row) {
          db.run(
            `
          INSERT INTO billingSettings (
            gstIncludedDefault,
            defaultGstRate,
            invoicePrefix,
            invoiceStartNumber,
            roundOffBill,
            showHsnOnInvoice,
            showCustomerPhone,
            invoiceFooterNote
          ) VALUES (
            0, 0, 'INV-', 1, 1, 1, 1, ''
          )
        `,
            function (insertErr) {
              if (insertErr) {
                return resolve({ success: false, error: insertErr.message });
              }

              db.get(
                `SELECT * FROM billingSettings LIMIT 1`,
                (fetchErr, newRow) => {
                  if (fetchErr) {
                    return resolve({
                      success: false,
                      error: fetchErr.message,
                    });
                  }
                  resolve({ success: true, data: newRow });
                }
              );
            }
          );
          return;
        }

        resolve({ success: true, data: row });
      });
    });
  });

  ipcMain.handle("store:notifications", async () => {
    const db = getDB();

    return new Promise((resolve) => {
      db.get(`SELECT * FROM notificationSettings LIMIT 1`, (err, row) => {
        if (err) {
          return resolve({ success: false, error: err.message });
        }

        if (!row) {
          db.run(
            `
            INSERT INTO notificationSettings DEFAULT VALUES
            `,
            function (insertErr) {
              if (insertErr) {
                return resolve({ success: false, error: insertErr.message });
              }

              db.get(
                `SELECT * FROM notificationSettings WHERE rowid = last_insert_rowid()`,
                (_, newRow) => {
                  resolve({ success: true, data: newRow });
                }
              );
            }
          );
          return;
        }

        resolve({ success: true, data: row });
      });
    });
  });

  ipcMain.handle("store:preference", async () => {
    const db = getDB();

    return new Promise((resolve) => {
      db.get(`SELECT * FROM appPreferences LIMIT 1`, (err, row) => {
        if (err) {
          return resolve({ success: false, error: err.message });
        }

        // Agar table empty hai → default insert
        if (!row) {
          db.run(
            `
          INSERT INTO appPreferences (
            showDashboardStocks,
            theme,
            language,
            autoBackup
          ) VALUES (1, 'light', 'en', 1)
        `,
            (insertErr) => {
              if (insertErr) {
                return resolve({ success: false, error: insertErr.message });
              }

              db.get(
                `SELECT * FROM appPreferences LIMIT 1`,
                (fetchErr, newRow) => {
                  if (fetchErr) {
                    return resolve({ success: false, error: fetchErr.message });
                  }

                  resolve({ success: true, data: newRow });
                }
              );
            }
          );
        } else {
          resolve({ success: true, data: row });
        }
      });
    });
  });

  // ================= STORE: SAVE =================
  ipcMain.handle("store:save", async (_, settings: any) => {
    const db = getDB();

    return new Promise((resolve) => {
      db.run(
        `
        INSERT INTO storeSettings (
          id, storeName, ownerName, phone, email, address, gstNumber,
          stateCode, gstEnabled
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          storeName = excluded.storeName,
          ownerName = excluded.ownerName,
          phone = excluded.phone,
          email = excluded.email,
          address = excluded.address,
          gstNumber = excluded.gstNumber,
          stateCode = excluded.stateCode,
          gstEnabled = excluded.gstEnabled,
          // gstIncludedDefault = excluded.gstIncludedDefault,
          // invoicePrefix = excluded.invoicePrefix,
          // invoiceStartNumber = excluded.invoiceStartNumber,
          updatedAt = CURRENT_TIMESTAMP
        `,
        [
          settings.id, // the UUID
          settings.storeName,
          settings.ownerName,
          settings.phone,
          settings.email,
          settings.address,
          settings.gstNumber,
          settings.stateCode,
          settings.gstEnabled ? 1 : 0,
          // settings.gstIncludedDefault ? 1 : 0,
          // settings.invoicePrefix || "INV",
          // settings.invoiceStartNumber || 1,
        ],
        (err) => {
          if (err) {
            console.error("Store save error:", err.message);
            return resolve({ success: false, error: err.message });
          }
          resolve({ success: true });
        }
      );
    });
  });

  // ================= INVOICE HANDLERS ============================
  ipcMain.handle("invoice:create", async (_, payload: any) => {
    const db: Database = getDB();
    const {
      cartItems,
      customerName: rawName = "",
      customerPhone: rawPhone = "",
      billingAddress: rawAddress = "",
      shippingAddress = "",
      transportDetails = null,
      payments = [],
      discountType = "flat",
      discountValue = 0,
      cashierName = "",
      storeId = "1",
      applyGST = true,
      roundOff = true,
      notes = "",
      footerMessage = "",
    } = payload || {};

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    return new Promise((resolve) => {
      db.serialize(async () => {
        try {
          db.run("BEGIN TRANSACTION");

          const invoiceNumber = await generateInvoiceNumber(db);
          const date = new Date().toISOString();

          let subTotal = 0;
          let totalTaxable = 0;
          let totalGst = 0;
          let totalCgst = 0;
          let totalSgst = 0;
          let totalIgst = 0;
          let totalQty = 0;
          const totalItems = cartItems.length;

          const lineRecords: any[] = [];

          for (const item of cartItems) {
            const qty = Math.max(1, Number(item.quantity) || 1);
            const unitPrice = Number(item.unitPrice ?? item.sellingPrice ?? 0);
            const gstRate = Number(item.gstRate || 0);
            const isGstIncluded =
              item.isGstIncluded === true || item.isGstIncluded === 1;
            const lineDiscount = Number(item.discount || 0);

            const totals = calculateTotalsWithDiscount(
              unitPrice,
              qty,
              gstRate,
              isGstIncluded,
              lineDiscount,
              applyGST
            );

            subTotal += totals.total;
            totalTaxable += totals.taxable;
            totalGst += totals.gstAmount;
            totalCgst += totals.cgst;
            totalSgst += totals.sgst;
            totalIgst += totals.igst;
            totalQty += qty;

            lineRecords.push({
              inventoryId: item.inventoryId || null,
              productName: item.productName || "Unknown",
              hsnCode: item.hsnCode || null,
              sku: item.sku || null,
              barcode: item.barcode || null,
              unit: item.unit || null,
              quantity: qty,
              unitPrice,
              discount: lineDiscount,
              gstRate,
              taxableAmount: totals.taxable,
              gstAmount: totals.gstAmount,
              cgst: totals.cgst,
              sgst: totals.sgst,
              igst: totals.igst,
              lineTotal: totals.total,
            });
          }

          // Invoice-level discount
          let invoiceDiscount = 0;
          if (discountType === "percentage" && discountValue > 0) {
            invoiceDiscount = +(subTotal * (discountValue / 100)).toFixed(2);
          } else if (discountType === "flat") {
            invoiceDiscount = +Number(discountValue || 0).toFixed(2);
          }

          let amountBeforeRound = +(subTotal - invoiceDiscount).toFixed(2);
          let roundOffAmount = 0;
          if (roundOff) {
            const rounded = Math.round(amountBeforeRound);
            roundOffAmount = +(rounded - amountBeforeRound).toFixed(2);
            amountBeforeRound = rounded;
          }

          const grandTotal = +amountBeforeRound.toFixed(2);
          const paidAmount = payments.reduce(
            (sum: number, p: any) => sum + Number(p.amount || 0),
            0
          );
          const dueAmount = Math.max(0, grandTotal - paidAmount);
          const status =
            dueAmount === 0 ? "Paid" : paidAmount > 0 ? "Partial" : "Due";

          // ======================= SAFE CUSTOMER HANDLING =======================
          let customerId: string | null = null;
          let safeCustomerName = "";
          let safeCustomerPhone = "";
          let safeCustomerAddress = "";

          if (dueAmount > 0) {
            // Convert everything to string and trim safely
            safeCustomerName = (rawName ?? "").toString().trim();
            safeCustomerPhone = (rawPhone ?? "").toString().trim();
            safeCustomerAddress = (rawAddress ?? "").toString().trim();

            if (
              !safeCustomerName ||
              !safeCustomerPhone ||
              !safeCustomerAddress
            ) {
              throw new Error(
                "Customer name, phone, and address are required for credit sale"
              );
            }

            // Now use safe values
            customerId = await new Promise<string>((res, rej) => {
              db.get(
                `SELECT id FROM customers WHERE phone = ?`,
                [safeCustomerPhone],
                (err, row: any) => {
                  if (err) return rej(err);

                  if (row) {
                    db.run(
                      `UPDATE customers SET name = ?, address = ? WHERE id = ?`,
                      [safeCustomerName, safeCustomerAddress, row.id],
                      (err) => (err ? rej(err) : res(row.id))
                    );
                  } else {
                    db.run(
                      `INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)`,
                      [
                        safeCustomerName,
                        safeCustomerPhone,
                        safeCustomerAddress,
                      ],
                      function (err) {
                        if (err) return rej(err);
                        db.get(
                          `SELECT id FROM customers WHERE phone = ?`,
                          [safeCustomerPhone],
                          (e, newRow: any) => {
                            if (e || !newRow)
                              return rej(
                                new Error("Failed to retrieve new customer ID")
                              );
                            res(newRow.id);
                          }
                        );
                      }
                    );
                  }
                }
              );
            });
          }

          // Insert Invoice — safe values use kar rahe hain
          const invoiceId = await new Promise<string>((res, rej) => {
            db.run(
              `INSERT INTO invoices (
              id, invoiceNumber, date, customerId, customerName, customerPhone, customerAddress,
              shippingAddress, transportDetails, paymentMeta,
              subTotal, discount, discountType, taxableAmount, gstAmount,
              cgst, sgst, igst, roundOff, grandTotal,
              totalQty, totalItems, paidAmount, dueAmount, status, paymentStatus,
              cashierName, storeId, notes, footerMessage
            ) VALUES (
              lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )`,
              [
                invoiceNumber,
                date,
                customerId,
                dueAmount > 0 ? safeCustomerName : null,
                dueAmount > 0 ? safeCustomerPhone : null,
                dueAmount > 0 ? safeCustomerAddress : null,
                shippingAddress || null,
                transportDetails ? JSON.stringify(transportDetails) : null,
                payments.length ? JSON.stringify(payments) : null,
                subTotal,
                invoiceDiscount,
                discountType,
                totalTaxable,
                totalGst,
                totalCgst,
                totalSgst,
                totalIgst,
                roundOffAmount,
                grandTotal,
                totalQty,
                totalItems,
                paidAmount,
                dueAmount,
                status,
                status,
                cashierName || null,
                storeId,
                notes || null,
                footerMessage || null,
              ],
              function (err) {
                if (err) return rej(err);
                db.get(
                  `SELECT id FROM invoices WHERE invoiceNumber = ?`,
                  [invoiceNumber],
                  (e, row: any) => {
                    if (e || !row)
                      return rej(new Error("Failed to get invoice ID"));
                    res(row.id);
                  }
                );
              }
            );
          });

          // Insert invoice items (same as before)
          for (const item of lineRecords) {
            await new Promise<void>((res, rej) => {
              db.run(
                `INSERT INTO invoiceItems (
                id, invoiceId, inventoryId, productName, hsnCode, sku, barcode, unit,
                quantity, unitPrice, discount, taxableAmount, gstRate,
                gstAmount, cgst, sgst, igst, lineTotal
              ) VALUES (
                lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
              )`,
                [
                  invoiceId,
                  item.inventoryId,
                  item.productName,
                  item.hsnCode,
                  item.sku,
                  item.barcode,
                  item.unit,
                  item.quantity,
                  item.unitPrice,
                  item.discount,
                  item.taxableAmount,
                  item.gstRate,
                  item.gstAmount,
                  item.cgst,
                  item.sgst,
                  item.igst,
                  item.lineTotal,
                ],
                (err) => (err ? rej(err) : res())
              );
            });
          }

          // Ledger entries (only if credit sale)
          if (dueAmount > 0 && customerId) {
            const currentBalance = await new Promise<number>(
              (resBal, rejBal) => {
                db.get(
                  `SELECT COALESCE(SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE -amount END), 0) AS balance
               FROM customerLedger WHERE customerId = ?`,
                  [customerId],
                  (err, row: any) =>
                    err ? rejBal(err) : resBal(row?.balance || 0)
                );
              }
            );

            const debitBalance = currentBalance + grandTotal;
            await new Promise<void>((res, rej) => {
              db.run(
                `INSERT INTO customerLedger (customerId, invoiceId, type, amount, balance, notes, createdAt)
               VALUES (?, ?, 'DEBIT', ?, ?, ?, ?)`,
                [
                  customerId,
                  invoiceId,
                  grandTotal,
                  debitBalance,
                  `Invoice ${invoiceNumber}`,
                  date,
                ],
                (err) => (err ? rej(err) : res())
              );
            });

            if (paidAmount > 0) {
              const creditBalance = debitBalance - paidAmount;
              await new Promise<void>((res, rej) => {
                db.run(
                  `INSERT INTO customerLedger (customerId, invoiceId, type, amount, balance, notes, createdAt)
                 VALUES (?, ?, 'CREDIT', ?, ?, ?, ?)`,
                  [
                    customerId,
                    invoiceId,
                    paidAmount,
                    creditBalance,
                    `Payment for Invoice ${invoiceNumber}`,
                    date,
                  ],
                  (err) => (err ? rej(err) : res())
                );
              });
            }
          }

          // Clear cart
          await new Promise<void>((res, rej) => {
            db.run(`DELETE FROM cart`, (err) => (err ? rej(err) : res()));
          });

          db.run("COMMIT");
          resolve({
            success: true,
            invoiceId,
            invoiceNumber,
            grandTotal,
            dueAmount,
          });
        } catch (err: any) {
          db.run("ROLLBACK");
          console.error("Invoice creation failed:", err);
          resolve({
            success: false,
            error: err?.message || "Invoice creation failed",
          });
        }
      });
    });
  });

  // ================= INVOICE: PRINT ============================
  ipcMain.handle("invoice:print", async (_, invoiceId: string) => {
    const db: Database = getDB();

    return new Promise((resolve) => {
      db.get(
        `SELECT * FROM invoices WHERE id = ?`,
        [invoiceId],
        (err, invoice: any) => {
          if (err) return resolve({ success: false, error: err.message });

          if (!invoice)
            return resolve({ success: false, error: "Invoice not found" });

          // -------- Items --------
          db.all(
            `SELECT * FROM invoiceItems WHERE invoiceId = ?`,
            [invoiceId],
            (err2, items) => {
              if (err2) return resolve({ success: false, error: err2.message });

              // -------- Customer --------
              db.get(
                `SELECT * FROM customers WHERE phone = ? LIMIT 1`,
                [invoice.customerPhone],
                (err3, customer) => {
                  if (err3)
                    return resolve({ success: false, error: err3.message });

                  // -------- Ledger --------
                  db.all(
                    `SELECT * FROM customerLedger WHERE invoiceId = ? ORDER BY date ASC`,
                    [invoiceId],
                    (err4, ledger) => {
                      if (err4)
                        return resolve({ success: false, error: err4.message });

                      try {
                        const html = generateInvoiceHTML(
                          invoice,
                          items,
                          customer,
                          ledger
                        );

                        return resolve({ success: true, data: html });
                      } catch (e: any) {
                        return resolve({
                          success: false,
                          error: "HTML generation failed: " + e.message,
                        });
                      }
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });

  // ================= INVOICE: GET ALL ============================
  ipcMain.handle("invoice:getAll", async () => {
    const db = getDB();

    return new Promise((resolve) => {
      db.all(
        `SELECT 
        id,
        invoiceNumber,
        date,
        customerName,
        customerPhone,
        grandTotal,
        paidAmount,
        dueAmount,
        paymentStatus,
        createdAt
       FROM invoices
       ORDER BY createdAt DESC`,
        [],
        (err, rows) => {
          if (err) return resolve({ success: false, error: err.message });

          resolve({ success: true, data: rows });
        }
      );
    });
  });

  // ================= INVOICE: GET BY ID ============================
  ipcMain.handle("invoice:getById", async (_, invoiceId: string) => {
    if (!invoiceId) {
      return { success: false, error: "Invoice ID is required" };
    }

    const db: Database = getDB();

    try {
      // --- Fetch invoice ---
      const invoice = await new Promise<any>((resolve, reject) => {
        db.get(
          `SELECT * FROM invoices WHERE id = ?`,
          [invoiceId],
          (err, row: any) => {
            if (err) return reject(err);
            resolve(row);
          }
        );
      });

      if (!invoice) {
        return { success: false, error: "Invoice not found" };
      }

      // --- Fetch invoice items ---
      const items = await new Promise<any[]>((resolve, reject) => {
        db.all(
          `SELECT * FROM invoiceItems WHERE invoiceId = ? ORDER BY id ASC`,
          [invoiceId],
          (err, rows: any[]) => {
            if (err) return reject(err);
            resolve(rows);
          }
        );
      });

      // --- Parse payment details from paymentMeta ---
      let payments: any[] = [];
      try {
        if (invoice.paymentMeta) {
          payments = JSON.parse(invoice.paymentMeta);
        }
      } catch (parseErr) {
        console.error("Error parsing paymentMeta:", parseErr);
        payments = [];
      }

      // Recalculate total paid from payments (fallback if invoice.paidAmount is incorrect)
      const calculatedPaidAmount = payments.reduce(
        (sum: number, p: any) => sum + Number(p.amount || 0),
        0
      );
      if (
        calculatedPaidAmount > 0 &&
        invoice.paidAmount !== calculatedPaidAmount
      ) {
        console.warn(
          `Paid amount mismatch for invoice ${invoiceId}: DB=${invoice.paidAmount}, Calculated=${calculatedPaidAmount}`
        );
        // Optionally update DB here if needed: db.run(`UPDATE invoices SET paidAmount = ? WHERE id = ?`, [calculatedPaidAmount, invoiceId]);
      }

      // --- Fetch customer if customer_id exists (or fallback to phone if no customer_id) ---
      let customer = null;
      if (invoice.customer_id) {
        customer = await new Promise<any>((resolve, reject) => {
          db.get(
            `SELECT * FROM customers WHERE id = ?`,
            [invoice.customer_id],
            (err, row: any) => {
              if (err) return reject(err);
              resolve(row);
            }
          );
        });
      } else if (invoice.customerPhone) {
        // Fallback for older invoices without customer_id
        customer = await new Promise<any>((resolve, reject) => {
          db.get(
            `SELECT * FROM customers WHERE phone = ?`,
            [invoice.customerPhone],
            (err, row: any) => {
              if (err) return reject(err);
              resolve(row);
            }
          );
        });
      }

      // --- Fetch ledger entries if customer exists ---
      let ledger: any[] = [];
      if (customer || invoice.customer_id) {
        // const custId = customer?.id || invoice.customer_id;
        ledger = await new Promise<any[]>((resolve, reject) => {
          db.all(
            `SELECT * FROM customerLedger WHERE invoiceId = ? ORDER BY date ASC`,
            [invoiceId],
            (err, rows: any[]) => {
              if (err) return reject(err);
              resolve(rows);
            }
          );
        });
      }

      // --- Calculate payment breakdown summary ---
      const paymentBreakdown = payments.reduce((acc: any, p: any) => {
        const mode = p.mode || "Unknown";
        acc[mode] = (acc[mode] || 0) + Number(p.amount || 0);
        return acc;
      }, {} as Record<string, number>);

      return {
        success: true,
        data: {
          invoice: {
            ...invoice,
            paidAmount: calculatedPaidAmount, // Use calculated if mismatch
          },
          items, // Array of items with productName, quantity, lineTotal, etc.
          payments, // Full array: [{ mode: 'Cash', amount: 30 }, { mode: 'UPI', amount: 29 }, ...]
          paymentBreakdown, // Summary: { Cash: 30, UPI: 29 }
          customer, // Full customer: { name, phone, address, ... }
          ledger, // Array: [{ type: 'debit', amount: 59, balance: 59, ... }, { type: 'credit', amount: 59, ... }]
        },
      };
    } catch (err: any) {
      console.error("Error fetching invoice by ID:", err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("customer:getListWithDue", async () => {
    const db = getDB();

    try {
      const customers = await new Promise<any[]>((resolve, reject) => {
        db.all(
          `
        SELECT 
          c.id,
          c.name,
          c.phone,
          c.address,
          c.createdAt,
          
          MAX(i.date) AS lastVisit,
          
          COALESCE((
            SELECT balance 
            FROM customerLedger cl 
            WHERE cl.customerId = c.id
            ORDER BY cl.id DESC 
            LIMIT 1
          ), 0) AS dueAmount,

          COUNT(i.id) AS totalInvoices

        FROM customers c
        LEFT JOIN invoices i ON i.customerId = c.id
        
        WHERE 
          c.name IS NOT NULL 
          AND TRIM(c.name) != ''
          AND c.phone IS NOT NULL 
          AND TRIM(c.phone) != ''
          -- Optional: Sirf jinka due hai unko dikhao (agar chahiye to uncomment kar dena)
          -- AND COALESCE((
          --   SELECT balance FROM customerLedger cl 
          --   WHERE cl.customer_id = c.id 
          --   ORDER BY cl.id DESC LIMIT 1
          -- ), 0) > 0

        GROUP BY c.id
        HAVING c.id IS NOT NULL

        ORDER BY 
          lastVisit DESC NULLS LAST, 
          c.name ASC
        `,
          [],
          (err, rows: any[]) => {
            if (err) {
              console.error("DB Error:", err);
              return reject(err);
            }
            resolve(rows);
          }
        );
      });

      return { success: true, data: customers };
    } catch (err: any) {
      console.error("Error in customer:getListWithDue:", err);
      return {
        success: false,
        error: err.message || "Failed to fetch customers",
      };
    }
  });

  ipcMain.handle("customer:getDetails", async (_, customerId: number) => {
    const db = getDB();

    try {
      // 1. Customer basic info
      const customer = await new Promise<any>((resolve, reject) => {
        db.get(
          `
        SELECT 
          c.*,
          COALESCE((
            SELECT balance 
            FROM customerLedger cl 
            WHERE cl.customerId = c.id 
            ORDER BY cl.id DESC 
            LIMIT 1
          ), 0) AS dueAmount
        FROM customers c 
        WHERE c.id = ?
        `,
          [customerId],
          (err, row) => (err ? reject(err) : resolve(row || null))
        );
      });

      if (!customer) throw new Error("Customer not found");

      // 2. Due Invoices + Unke Items
      const dueInvoices = await new Promise<any[]>((resolve, reject) => {
        db.all(
          `
        SELECT 
          i.id,
          i.invoiceNumber AS invoice_no,
          i.date,
          i.grandTotal,
          i.paidAmount,
          i.dueAmount AS remainingAmount,
          i.status
        FROM invoices i 
        WHERE i.customerId = ? 
          AND i.dueAmount > 0
        ORDER BY i.date DESC
        `,
          [customerId],
          async (err, invoices) => {
            if (err) return reject(err);

            // Har invoice ke liye items fetch karo
            const invoicesWithItems = await Promise.all(
              invoices.map(async (inv: any) => {
                const items = await new Promise<any[]>((res, rej) => {
                  db.all(
                    `
                  SELECT 
                    productName,
                    quantity,
                    unitPrice,
                    discount,
                    gstRate,
                    gstAmount,
                    lineTotal
                  FROM invoiceItems 
                  WHERE invoiceId = ?
                  ORDER BY id
                  `,
                    [inv.id],
                    (err, rows) => (err ? rej(err) : res(rows || []))
                  );
                });

                return {
                  ...inv,
                  items,
                  totalItems: items.length,
                  subtotal: items.reduce(
                    (sum: number, it: any) => sum + it.lineTotal,
                    0
                  ),
                };
              })
            );

            resolve(invoicesWithItems);
          }
        );
      });

      // 3. Recent Ledger Transactions
      const recentTransactions = await new Promise<any[]>((resolve, reject) => {
        db.all(
          `
        SELECT 
          cl.date,
          cl.type,
          cl.amount,
          cl.balance,
          cl.reference,
          i.invoiceNumber AS invoice_no
        FROM customerLedger cl
        LEFT JOIN invoices i ON cl.invoiceId = i.id
        WHERE cl.customerId = ?
        ORDER BY cl.id DESC
        LIMIT 10
        `,
          [customerId],
          (err, rows) => (err ? reject(err) : resolve(rows || []))
        );
      });

      return {
        success: true,
        data: {
          customer,
          dueInvoices, // ← Ab items bhi included hain!
          recentTransactions,
          summary: {
            totalDue: customer.dueAmount,
            pendingInvoices: dueInvoices.length,
            totalPendingAmount: dueInvoices.reduce(
              (s: number, i: any) => s + i.remainingAmount,
              0
            ),
          },
        },
      };
    } catch (err: any) {
      console.error("Error in customer:getDetails:", err);
      return { success: false, error: err.message || "Failed to load details" };
    }
  });

  ipcMain.handle("store:updateNotifications", async (_event, payload) => {
    const db = getDB();

    const {
      lowStockAlert,
      emailNotification,
      whatsappNotification,
      smsNotification,
      dailySalesReport,
    } = payload;

    return new Promise((resolve) => {
      db.run(
        `
      UPDATE notificationSettings
      SET
        lowStockAlert = ?,
        emailNotification = ?,
        whatsappNotification = ?,
        smsNotification = ?,
        dailySalesReport = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE rowid = (
        SELECT rowid FROM notificationSettings LIMIT 1
      )
      `,
        [
          lowStockAlert,
          emailNotification,
          whatsappNotification,
          smsNotification,
          dailySalesReport,
        ],
        function (err) {
          if (err) {
            return resolve({ success: false, error: err.message });
          }

          db.get(`SELECT * FROM notificationSettings LIMIT 1`, (_, row) => {
            resolve({ success: true, data: row });
          });
        }
      );
    });
  });

  ipcMain.handle("store:updatePreference", async (_event, payload) => {
    const db = getDB();

    const { showDashboardStocks, theme, language, autoBackup } = payload;

    return new Promise((resolve) => {
      db.run(
        `
      UPDATE appPreferences SET
        showDashboardStocks = COALESCE(?, showDashboardStocks),
        theme = COALESCE(?, theme),
        language = COALESCE(?, language),
        autoBackup = COALESCE(?, autoBackup),
        updatedAt = CURRENT_TIMESTAMP
      `,
        [showDashboardStocks, theme, language, autoBackup],
        (err) => {
          if (err) {
            return resolve({ success: false, error: err.message });
          }

          db.get(`SELECT * FROM appPreferences LIMIT 1`, (fetchErr, row) => {
            if (fetchErr) {
              return resolve({ success: false, error: fetchErr.message });
            }

            resolve({ success: true, data: row });
          });
        }
      );
    });
  });

  ipcMain.handle("store:updateBillingSettings", async (_event, payload) => {
    const db = getDB();

    const {
      gstIncludedDefault,
      defaultGstRate,
      invoicePrefix,
      invoiceStartNumber,
      roundOffBill,
      showHsnOnInvoice,
      showCustomerPhone,
      invoiceFooterNote,
    } = payload;

    return new Promise((resolve) => {
      db.run(
        `
      UPDATE billingSettings SET
        gstIncludedDefault = COALESCE(?, gstIncludedDefault),
        defaultGstRate = COALESCE(?, defaultGstRate),
        invoicePrefix = COALESCE(?, invoicePrefix),
        invoiceStartNumber = COALESCE(?, invoiceStartNumber),
        roundOffBill = COALESCE(?, roundOffBill),
        showHsnOnInvoice = COALESCE(?, showHsnOnInvoice),
        showCustomerPhone = COALESCE(?, showCustomerPhone),
        invoiceFooterNote = COALESCE(?, invoiceFooterNote),
        updatedAt = CURRENT_TIMESTAMP
      `,
        [
          gstIncludedDefault,
          defaultGstRate,
          invoicePrefix,
          invoiceStartNumber,
          roundOffBill,
          showHsnOnInvoice,
          showCustomerPhone,
          invoiceFooterNote,
        ],
        function (err) {
          if (err) {
            return resolve({ success: false, error: err.message });
          }

          db.get(`SELECT * FROM billingSettings LIMIT 1`, (fetchErr, row) => {
            if (fetchErr) {
              return resolve({
                success: false,
                error: fetchErr.message,
              });
            }

            resolve({ success: true, data: row });
          });
        }
      );
    });
  });

  ipcMain.handle("store:updateStoreSettings", async (_event, payload) => {
    const db = getDB();

    const {
      storeName,
      companyName,
      ownerName,
      phone,
      email,
      address,

      gstEnabled,
      gstNumber,
      stateCode,

      currency,
      financialYear,
      storeImageUrl,
    } = payload;

    return new Promise((resolve) => {
      db.run(
        `
      UPDATE storeSettings SET
        storeName = COALESCE(?, storeName),
        companyName = COALESCE(?, companyName),
        ownerName = COALESCE(?, ownerName),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        address = COALESCE(?, address),

        gstEnabled = COALESCE(?, gstEnabled),
        gstNumber = COALESCE(?, gstNumber),
        stateCode = COALESCE(?, stateCode),

        currency = COALESCE(?, currency),
        financialYear = COALESCE(?, financialYear),
        storeImageUrl = COALESCE(?, storeImageUrl),

        updatedAt = CURRENT_TIMESTAMP
      `,
        [
          storeName,
          companyName,
          ownerName,
          phone,
          email,
          address,

          gstEnabled,
          gstNumber,
          stateCode,

          currency,
          financialYear,
          storeImageUrl,
        ],
        function (err) {
          if (err) {
            return resolve({ success: false, error: err.message });
          }

          // 👉 Updated data return
          db.get(`SELECT * FROM storeSettings LIMIT 1`, (fetchErr, row) => {
            if (fetchErr) {
              return resolve({
                success: false,
                error: fetchErr.message,
              });
            }

            resolve({ success: true, data: row });
          });
        }
      );
    });
  });

  ipcMain.handle("store:getStoreSettings", async () => {
    const db = getDB();

    return new Promise((resolve) => {
      db.get(`SELECT * FROM storeSettings LIMIT 1`, (err, row) => {
        if (err) {
          return resolve({ success: false, error: err.message });
        }

        if (!row) {
          db.run(
            `
          INSERT INTO storeSettings (
            storeName,
            gstEnabled,
            currency
          ) VALUES (
            'My Store', 0, 'INR'
          )
        `,
            function (insertErr) {
              if (insertErr) {
                return resolve({
                  success: false,
                  error: insertErr.message,
                });
              }

              db.get(
                `SELECT * FROM storeSettings LIMIT 1`,
                (fetchErr, newRow) => {
                  if (fetchErr) {
                    return resolve({
                      success: false,
                      error: fetchErr.message,
                    });
                  }
                  resolve({ success: true, data: newRow });
                }
              );
            }
          );
          return;
        }

        resolve({ success: true, data: row });
      });
    });
  });
};

function generateInvoiceHTML(
  inv: any,
  items: any[],
  customer: any,
  ledger: any[]
) {
  const store = getStoreSync();

  const paymentRows = ledger
    .map(
      (l) => `
      <tr>
        <td style="padding:4px">${l.type}</td>
        <td style="padding:4px">₹${l.amount}</td>
        <td style="padding:4px">${new Date(l.date).toLocaleString()}</td>
        <td style="padding:4px">${l.reference}</td>
      </tr>`
    )
    .join("");

  const itemRows = items
    .map(
      (it, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${it.productName}<br/><small>HSN: ${it.hsnCode || "-"}</small></td>
        <td style="text-align:center">${it.quantity} ${it.unit || ""}</td>
        <td style="text-align:right">₹${it.unitPrice.toFixed(2)}</td>
        <td style="text-align:right">₹${it.lineTotal.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  return `
  <html>
  <body style="font-family:Arial;padding:20px;">
    
    <h2 style="text-align:center;margin:0;">${
      store.storeName || "My Store"
    }</h2>
    <div style="text-align:center;font-size:12px;">
      ${store.address || ""}
      <br/>GSTIN: ${store.gstin || ""}
    </div>
    <hr/>

    <div style="display:flex;justify-content:space-between">
      <div>
        <strong>Customer:</strong><br/>
        ${inv.customerName || "-"}<br/>
        Phone: ${inv.customerPhone || "-"}<br/>
        ${inv.customerAddress || ""}
      </div>

      <div style="text-align:right">
        <strong>Invoice No:</strong> ${inv.invoiceNumber}<br/>
        <strong>Date:</strong> ${new Date(inv.date).toLocaleString()}<br/>
        <strong>Cashier:</strong> ${inv.cashierName || ""}
      </div>
    </div>

    <h3 style="margin-top:12px;">Items</h3>

    <table width="100%" style="border-collapse: collapse;" border="1">
      <thead style="background:#f5f5f5">
        <tr>
          <th>#</th>
          <th>Item</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <h3 style="text-align:right;margin-top:10px;">
      Total Amount: ₹${inv.grandTotal.toFixed(2)}
    </h3>
    <div style="text-align:right;">
      Paid: ₹${inv.paidAmount.toFixed(2)}<br/>
      Due: <strong>₹${inv.dueAmount.toFixed(2)}</strong>
      Change Return: <strong>₹${inv.changeReturn.toFixed(2)}</strong>
    </div>

    <h3 style="margin-top:18px;">Payment History</h3>
    <table width="100%" border="1" style="border-collapse: collapse;">
      <tr style="background:#f5f5f5">
        <th>Type</th>
        <th>Amount</th>
        <th>Date</th>
        <th>Reference</th>
      </tr>
      ${paymentRows || `<tr><td colspan="4">No payments recorded</td></tr>`}
    </table>

    <div style="margin-top:20px;text-align:center;font-size:12px;color:#666">
      ${inv.footerMessage || "Thank you!"}
    </div>

  </body>
  </html>
  `;
}

function getStoreSync() {
  return {
    storeName: "My Store",
    address: "Address",
    gstin: "",
  };
}
