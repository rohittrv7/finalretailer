import { ipcMain } from "electron";
// eslint-disable-next-line import/no-unresolved
import { InventoryItem } from "@/frontend/types/inventry";
import { getDB } from "../database/db";
import { CartItem } from "@/frontend/types/cart";
import { Database } from "sqlite3";
import {
  getCurrentUser,
  isFirstTimeSetup,
  isSetupComplete,
  setupBusiness,
} from "../service/authService";

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

function pad(n: number, len = 6) {
  return String(n).padStart(len, "0");
}

async function generateInvoiceNumber(db: Database): Promise<string> {
  const year = new Date().getFullYear();
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT invoiceNumber FROM invoices WHERE invoiceNumber LIKE ? ORDER BY createdAt DESC LIMIT 1`,
      [`INV-${year}-%`],
      (err: any, row: any) => {
        if (err) return reject(err);
        if (!row) return resolve(`INV-${year}-${pad(1)}`);
        const last = row.invoiceNumber as string; // INV-2025-000123
        const parts = last.split("-");
        const lastNum = Number(parts[2] || "0");
        resolve(`INV-${year}-${pad(lastNum + 1)}`);
      }
    );
  });
}

function calculateTotalsWithDiscount(
  unitPrice: number,
  qty: number,
  gstRate: number,
  isGstIncluded: boolean,
  lineDiscount = 0, // per quantity (flat) OR pass 0
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
  ipcMain.handle("app-is-setup-complete", async () => await isSetupComplete());
  ipcMain.handle("app-is-first-time", () => isFirstTimeSetup());
  ipcMain.handle("app-setup-business", (e, data) => setupBusiness(data));
  ipcMain.handle("app-get-user", () => getCurrentUser());

  // ========================= OFFLINE LOGIN ============================
  // ipcMain.handle("auth:loginOffline", async (_, { username, password }) => {
  //   const user = await getLocalUser(username);
  //   if (!user) return { ok: false, msg: "User not found" };

  //   const ok = await verifyPassword(user.passwordHash, password);
  //   if (!ok) return { ok: false, msg: "Invalid password" };

  //   return { ok: true };
  // });

  // ipcMain.handle("auth:activateOnline", async (_, { username, password }) => {
  //   const user = await getLocalUser(username);
  //   if (!user) return { ok: false, msg: "Offline account not found" };

  //   const ok = await verifyPassword(user.passwordHash, password);
  //   if (!ok) return { ok: false, msg: "Invalid password" };

  //   const response = await activateOnlineAccount(username, password);

  //   if (!response.ok) return response;

  //   await storeRefreshToken(username, response.refreshToken);

  //   return {
  //     ok: true,
  //     accessToken: response.accessToken,
  //   };
  // });

  // ipcMain.handle("auth-get-current-user", async () => {
  //   return await getCurrentUser();
  // });

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

  // ================== Add inventory item =========================
  ipcMain.handle("inventory:add", async (_, item: InventoryItem) => {
    try {
      const db = await getDB();

      return new Promise((resolve) => {
        db.run(
          `
                    INSERT INTO inventory (
                    productName, category, brand, sku, barcode,
                    unit, stock, status, reorderLevel, purchasePrice,
                    sellingPrice, mrp, discount, gstRate, gstType, isGstIncluded,
                    supplier, description, lowStockAlert, purchaseDate, expiryDate, imageUrl
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
          [
            item.productName,
            item.category,
            item.brand ?? null,
            item.sku,
            item.barcode ?? null,
            item.unit,
            item.stock ?? 0,
            item.status ?? "active",
            item.reorderLevel ?? 10,
            item.purchasePrice,
            item.sellingPrice,
            item.mrp ?? null,
            item.discount ?? 0,
            item.gstRate ?? 0,
            item.gstType ?? "CGST_SGST",
            item.isGstIncluded ? 1 : 0,
            item.supplier ?? null,
            item.description ?? null,
            item.lowStockAlert ?? 1,
            item.purchaseDate ?? null,
            item.expiryDate ?? null,
            item.imageUrl ?? null,
          ],
          function (err) {
            if (err) {
              resolve({ success: false, error: err.message });
            } else {
              resolve({ success: true, id: this.lastID.toString() });
            }
          }
        );
      });
    } catch (error) {
      return { success: false, error: error.message };
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

  // ================== CART HANDLERS ============================
  ipcMain.handle("cart:add", async (_, { item, quantity }) => {
    const db = getDB();
    const qty = Math.max(1, quantity);

    // Reduce stock immediately
    await new Promise((resolve) =>
      db.run(
        `UPDATE inventory SET stock = stock - ? WHERE id = ?`,
        [qty, item.id],
        resolve
      )
    );

    const totals = calculateTotals(
      item.sellingPrice,
      qty,
      item.gstRate,
      !!item.isGstIncluded,
      item.discount ?? 0,
      true // applyGST
    );

    await db.run(
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
        qty,
        item.discount ?? 0,
        totals.taxable,
        totals.gstAmount,
        totals.cgst,
        totals.sgst,
        totals.igst,
        totals.total,
      ]
    );

    return { success: true };
  });

  // ================== Update cart item quantity ==================
  ipcMain.handle(
    "cart:updateQuantity",
    async (event, { cartId, newQuantity }) => {
      const db = getDB();

      return new Promise((resolve) => {
        db.get(`SELECT * FROM cart WHERE id = ?`, [cartId], (err, row: any) => {
          if (!row) return resolve({ success: false });

          const oldQty = row.quantity;
          const qty = Math.max(1, newQuantity);

          const diff = qty - oldQty;

          if (diff !== 0) {
            db.run(`UPDATE inventory SET stock = stock - ? WHERE id = ?`, [
              diff,
              row.inventoryId,
            ]);
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
            () => resolve({ success: true })
          );
        });
      });
    }
  );

  // ================== Remove cart item ==================
  ipcMain.handle("cart:remove", async (_, cartId) => {
    const db = getDB();

    return new Promise((resolve) => {
      db.get(
        `SELECT quantity, inventoryId FROM cart WHERE id = ?`,
        [cartId],
        (err, row: CartItem) => {
          if (!row) return resolve({ success: false });

          // stock restore
          db.run(`UPDATE inventory SET stock = stock + ? WHERE id = ?`, [
            row.quantity,
            row.inventoryId,
          ]);

          db.run(`DELETE FROM cart WHERE id = ?`, [cartId], () =>
            resolve({ success: true })
          );
        }
      );
    });
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

  // ================= CLEAR CART (Bill Done) =================
  ipcMain.handle("cart:clear", async () => {
    const db = getDB();

    return new Promise((resolve) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        db.all(`SELECT inventoryId, quantity FROM cart`, (err, rows: any[]) => {
          if (err) {
            db.run("ROLLBACK");
            return resolve({ success: false, error: err.message });
          }

          if (rows.length === 0) {
            db.run("COMMIT");
            return resolve({ success: true, message: "Cart already empty" });
          }

          let done = 0;
          const total = rows.length;
          let errorOccurred = false;

          rows.forEach((row) => {
            const qty = Number(row.quantity) || 0;
            const invId = row.inventoryId as string;

            db.run(
              `UPDATE inventory SET stock = stock + ? WHERE id = ?`,
              [qty, invId],
              function (err) {
                if (errorOccurred) return;

                if (err || this.changes === 0) {
                  db.run("ROLLBACK");
                  errorOccurred = true;
                  return resolve({
                    success: false,
                    error: `Failed to restore stock for item: ${invId}`,
                  });
                }

                done++;
                if (done === total) {
                  db.run(`DELETE FROM cart`, (err) => {
                    if (err) {
                      db.run("ROLLBACK");
                      return resolve({
                        success: false,
                        error: "Failed to clear cart",
                      });
                    }

                    db.run("COMMIT");
                    resolve({
                      success: true,
                      message: "Cart cleared & stock restored",
                    });
                  });
                }
              }
            );
          });
        });
      });
    });
  });

  // ================= STORE: GET =================
  ipcMain.handle("store:get", async () => {
    const db = getDB();
    return new Promise((resolve) => {
      db.get(`SELECT * FROM store_settings WHERE id = 1`, (err, row: any) => {
        if (err) return resolve({ success: false, error: err.message });

        if (!row) {
          // First time - create default row
          db.run(
            `
                    INSERT INTO store_settings (
                        id, storeName, phone, defaultCurrency, defaultTaxRate, gstVerified
                    ) VALUES (1, 'My Store', '', 'INR', 18.0, 0)
                `,
            () => {
              db.get(
                `SELECT * FROM store_settings WHERE id = 1`,
                (_, defaultRow) => {
                  resolve({ success: true, data: defaultRow });
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
            INSERT INTO store_settings (
                id, storeName, email, phone, gstin, companyName, taxId, address, logoUrl, gstVerified,
                defaultCurrency, defaultTaxRate, returnPolicy
            )
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                storeName = excluded.storeName,
                email = excluded.email,
                phone = excluded.phone,
                gstin = excluded.gstin,
                companyName = excluded.companyName,
                taxId = excluded.taxId,
                address = excluded.address,
                logoUrl = excluded.logoUrl,
                gstVerified = excluded.gstVerified,
                defaultCurrency = excluded.defaultCurrency,
                defaultTaxRate = excluded.defaultTaxRate,
                returnPolicy = excluded.returnPolicy,
                updatedAt = CURRENT_TIMESTAMP
        `,
        [
          settings.storeName || "My Store",
          settings.email || "",
          settings.phone || "",
          settings.gstin || null,
          settings.companyName || null,
          settings.taxId || "",
          settings.address || "",
          settings.logoUrl || null,
          settings.gstVerified ? 1 : 0,
          settings.defaultCurrency || "INR",
          Number(settings.defaultTaxRate) || 18.0,
          settings.returnPolicy || null,
        ],
        (err) => {
          if (err) {
            console.error("Store save error:", err.message);
            resolve({ success: false, error: err.message });
          } else {
            resolve({ success: true });
          }
        }
      );
    });
  });

  // ================= INVOICE HANDLERS ============================
  ipcMain.handle("invoice:create", async (_, payload: any) => {
    const db: Database = getDB();
    const {
      cartItems,
      customerName,
      customerPhone,
      billingAddress,
      shippingAddress,
      transportDetails,
      payments = [],
      discountType = "flat",
      discountValue = 0,
      cashierName,
      storeId = "1",
      applyGST = true,
      roundOff = true,
      notes = "",
      footerMessage = "",
      // Remove grandTotal and paidAmount from destructuring as we'll calculate them
    } = payload;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return { success: false, error: "Cart empty" };
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
          let totalItems = 0;

          const lineRecords: any[] = [];

          // --------------------------
          //  Cart Loop
          // --------------------------
          for (const it of cartItems) {
            const qty = Number(it.quantity) || 1;
            const unitPrice = Number(it.unitPrice ?? it.sellingPrice ?? 0) || 0;
            const gstRate = Number(it.gstRate || 0);
            const isIncluded =
              it.isGstIncluded === 1 || it.isGstIncluded === true;
            const lineDiscount = Number(it.lineDiscount || 0);

            const totals = calculateTotalsWithDiscount(
              unitPrice,
              qty,
              gstRate,
              isIncluded,
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
            totalItems += 1;

            lineRecords.push({
              inventoryId: it.inventoryId,
              productName: it.productName,
              hsnCode: it.hsnCode || null,
              sku: it.sku || null,
              unit: it.unit || null,
              quantity: qty,
              unitPrice,
              lineDiscount,
              taxableAmount: totals.taxable,
              gstRate,
              gstAmount: totals.gstAmount,
              cgst: totals.cgst,
              sgst: totals.sgst,
              igst: totals.igst,
              lineTotal: totals.total,
            });
          }

          // --------------------------
          //  Invoice-level discount
          // --------------------------
          let invoiceDiscountAmount = 0;
          if (discountType === "percent" && Number(discountValue) > 0) {
            invoiceDiscountAmount = +(
              subTotal *
              (Number(discountValue) / 100)
            ).toFixed(2);
          } else {
            invoiceDiscountAmount = +Number(discountValue || 0).toFixed(2);
          }

          // --------------------------
          //  Round OFF
          // --------------------------
          let grandBeforeRound = +(subTotal - invoiceDiscountAmount).toFixed(2);
          let roundOffAmount = 0;

          if (roundOff) {
            const rounded = Math.round(grandBeforeRound);
            roundOffAmount = +(rounded - grandBeforeRound).toFixed(2);
            grandBeforeRound = rounded;
          }

          const grandTotal = +grandBeforeRound.toFixed(2);
          const paidAmount = payments.reduce(
            (sum: number, p: any) => sum + Number(p.amount || 0),
            0
          );
          const dueAmount = Math.max(grandTotal - paidAmount, 0);
          const status =
            dueAmount > 0 ? (paidAmount > 0 ? "Partial" : "Due") : "Paid";
          const paymentStatus = status; // Align with status

          let customerId: number | null = null;

          // =======================================
          //  CREATE OR GET CUSTOMER (ONLY IF DUE > 0)
          // =======================================
          if (dueAmount > 0) {
            if (
              !customerName?.trim() ||
              !customerPhone?.trim() ||
              !billingAddress?.trim()
            ) {
              throw new Error(
                "Customer details (name, phone, address) are mandatory for due/partial payments."
              );
            }

            customerId = await new Promise<number>(
              (resolveCustomer, rejectCustomer) => {
                db.get(
                  `SELECT id FROM customers WHERE phone = ?`,
                  [customerPhone.trim()],
                  (err, row: any) => {
                    if (err) return rejectCustomer(err);

                    if (row) {
                      // Update if needed
                      db.run(
                        `UPDATE customers SET name = ?, address = ? WHERE id = ?`,
                        [customerName.trim(), billingAddress.trim(), row.id],
                        (updateErr) => {
                          if (updateErr) return rejectCustomer(updateErr);
                          resolveCustomer(row.id);
                        }
                      );
                    } else {
                      db.run(
                        `INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)`,
                        [
                          customerName.trim(),
                          customerPhone.trim(),
                          billingAddress.trim(),
                        ],
                        function (err2) {
                          if (err2) return rejectCustomer(err2);
                          resolveCustomer(this.lastID);
                        }
                      );
                    }
                  }
                );
              }
            );
          }

          // =======================================
          //   INSERT INVOICE
          // =======================================
          const invoiceId = await new Promise<string>((res, rej) => {
            db.run(
              `INSERT INTO invoices (
              id, customerId, invoiceNumber, date, customerName, customerPhone,
              billingAddress, shippingAddress, transportDetails, paymentMeta,
              subTotal, discount, discountType, taxableAmount, gstAmount,
              cgst, sgst, igst, roundOff, grandTotal, totalQty, totalItems,
              cashierName, storeId, notes, footerMessage, paidAmount, dueAmount, status, paymentStatus
            ) VALUES (
              lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )`,
              [
                customerId, // NULL if full paid
                invoiceNumber,
                date,
                customerName || null,
                customerPhone || null,
                billingAddress || null,
                shippingAddress || null,
                JSON.stringify(transportDetails || null),
                JSON.stringify(payments || []),
                +subTotal.toFixed(2),
                +invoiceDiscountAmount.toFixed(2),
                discountType,
                +totalTaxable.toFixed(2),
                +totalGst.toFixed(2),
                +totalCgst.toFixed(2),
                +totalSgst.toFixed(2),
                +totalIgst.toFixed(2),
                +roundOffAmount.toFixed(2),
                grandTotal,
                +totalQty,
                totalItems,
                cashierName || null,
                storeId,
                notes || null,
                footerMessage || null,
                paidAmount,
                dueAmount,
                status,
                paymentStatus,
              ],
              function (err) {
                if (err) return rej(err);

                db.get(
                  `SELECT id FROM invoices WHERE invoiceNumber = ?`,
                  [invoiceNumber],
                  (e, row: any) => {
                    if (e) return rej(e);
                    res(row.id);
                  }
                );
              }
            );
          });

          // =======================================
          //  INSERT ITEMS
          // =======================================
          for (const lr of lineRecords) {
            await new Promise<void>((res, rej) => {
              db.run(
                `INSERT INTO invoice_items (
                id, invoiceId, inventoryId, productName, hsnCode, sku, unit,
                quantity, unitPrice, lineDiscount, taxableAmount, gstRate,
                gstAmount, cgst, sgst, igst, lineTotal
              ) VALUES (
                lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
              )`,
                [
                  invoiceId,
                  lr.inventoryId,
                  lr.productName,
                  lr.hsnCode,
                  lr.sku,
                  lr.unit,
                  lr.quantity,
                  lr.unitPrice,
                  lr.lineDiscount,
                  lr.taxableAmount,
                  lr.gstRate,
                  lr.gstAmount,
                  lr.cgst,
                  lr.sgst,
                  lr.igst,
                  lr.lineTotal,
                ],
                (err) => (err ? rej(err) : res())
              );
            });
          }

          // =======================================
          //  LEDGER ENTRIES (ONLY IF DUE > 0 AND CUSTOMER EXISTS)
          // =======================================
          if (dueAmount > 0 && customerId) {
            // Get current balance
            const currentBalance = await new Promise<number>(
              (resolveBal, rejectBal) => {
                db.get(
                  `SELECT COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE -amount END), 0) as balance FROM customer_ledger WHERE customer_id = ?`,
                  [customerId],
                  (err, row: any) => {
                    if (err) return rejectBal(err);
                    resolveBal(row.balance || 0);
                  }
                );
              }
            );

            // 1. DEBIT ENTRY (full invoice amount)
            const newDebitBalance = currentBalance + grandTotal;
            await new Promise((resolveLedger, rejectLedger) => {
              db.run(
                `INSERT INTO customer_ledger (customer_id, invoice_id, type, amount, balance, date, reference)
               VALUES (?, ?, 'debit', ?, ?, ?, ?)`,
                [
                  customerId,
                  invoiceId,
                  grandTotal,
                  newDebitBalance,
                  date,
                  `Invoice ${invoiceNumber}`,
                ],
                (err) => (err ? rejectLedger(err) : resolveLedger(true))
              );
            });

            // 2. CREDIT ENTRY (paid amount, if > 0)
            if (paidAmount > 0) {
              const newCreditBalance = newDebitBalance - paidAmount;
              await new Promise((resolveLedger, rejectLedger) => {
                db.run(
                  `INSERT INTO customer_ledger (customer_id, invoice_id, type, amount, balance, date, reference)
                 VALUES (?, ?, 'credit', ?, ?, ?, ?)`,
                  [
                    customerId,
                    invoiceId,
                    paidAmount,
                    newCreditBalance,
                    date,
                    `Partial payment for Invoice ${invoiceNumber}`,
                  ],
                  (err) => (err ? rejectLedger(err) : resolveLedger(true))
                );
              });
            }
          }

          // =======================================
          //  INSERT META (if needed, optional)
          // =======================================
          if (cashierName || notes || footerMessage) {
            await new Promise<void>((res, rej) => {
              db.run(
                `INSERT INTO invoice_meta (id, invoiceId, cashierName, notes, footerMessage) VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?)`,
                [
                  invoiceId,
                  cashierName || null,
                  notes || null,
                  footerMessage || null,
                ],
                (err) => (err ? rej(err) : res())
              );
            });
          }

          // CLEAR CART
          await new Promise<void>((res, rej) => {
            db.run(`DELETE FROM cart`, (err) => (err ? rej(err) : res()));
          });

          db.run("COMMIT");

          resolve({ success: true, invoiceId, invoiceNumber });
        } catch (err: any) {
          db.run("ROLLBACK");
          resolve({ success: false, error: err?.message || String(err) });
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
            `SELECT * FROM invoice_items WHERE invoiceId = ?`,
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
                    `SELECT * FROM customer_ledger WHERE invoice_id = ? ORDER BY date ASC`,
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
          `SELECT * FROM invoice_items WHERE invoiceId = ? ORDER BY id ASC`,
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
            `SELECT * FROM customer_ledger WHERE invoice_id = ? ORDER BY date ASC`,
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
          c.created_at,
          
          MAX(i.date) AS lastVisit,
          
          COALESCE((
            SELECT balance 
            FROM customer_ledger cl 
            WHERE cl.customer_id = c.id 
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
          --   SELECT balance FROM customer_ledger cl 
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
            FROM customer_ledger cl 
            WHERE cl.customer_id = c.id 
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
                    lineDiscount,
                    gstRate,
                    gstAmount,
                    lineTotal
                  FROM invoice_items 
                  WHERE invoiceId = ?
                  ORDER BY id
                  `,
                    [inv.id],
                    (err, rows) => (err ? rej(err) : res(rows || []))
                  );
                });

                return {
                  ...inv,
                  items, // ← YEH ADD HO GAYA!
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
        FROM customer_ledger cl
        LEFT JOIN invoices i ON cl.invoice_id = i.id
        WHERE cl.customer_id = ?
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
        ${inv.billingAddress || ""}
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
