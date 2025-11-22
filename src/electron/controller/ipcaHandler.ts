import { ipcMain } from "electron";
// eslint-disable-next-line import/no-unresolved
import { InventoryItem } from "@/frontend/types/inventry";
import { getDB } from "../database/db";
import { PosPrinter } from "electron-pos-printer";
import { CartItem } from "@/frontend/types/cart";

// function calculateGSTForUnit(
//     sellingPrice: number,
//     gstRate: number,
//     isGstIncluded: boolean,
//     applyGST: boolean
// ) {
//     const rate = Number(gstRate) || 0;
//     if (!applyGST || rate === 0) {
//         return {
//             taxable: parseFloat(sellingPrice.toFixed(2)),
//             gstAmount: 0,
//             cgst: 0,
//             sgst: 0,
//             igst: 0,
//             finalPrice: parseFloat(sellingPrice.toFixed(2)),
//         };
//     }

//     if (isGstIncluded) {
//         const taxable = sellingPrice / (1 + rate / 100);
//         const gstAmount = sellingPrice - taxable;
//         return {
//             taxable: parseFloat(taxable.toFixed(2)),
//             gstAmount: parseFloat(gstAmount.toFixed(2)),
//             finalPrice: parseFloat(sellingPrice.toFixed(2)),
//         };
//     }

//     const taxable = sellingPrice;
//     const gstAmount = (taxable * rate) / 100;
//     const finalPrice = taxable + gstAmount;
//     return {
//         taxable: parseFloat(taxable.toFixed(2)),
//         gstAmount: parseFloat(gstAmount.toFixed(2)),
//         finalPrice: parseFloat(finalPrice.toFixed(2)),
//     };
// }

interface GSTTotals {
  taxable: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

function calculateTotals(
  sellingPrice: string | number,
  qty: number,
  gstRate: number,
  isGstIncluded: boolean
): GSTTotals {
  const rate = Number(gstRate) || 0;

  let taxable = 0;
  let gstAmount = 0;
  const price =
    typeof sellingPrice === "string" ? parseFloat(sellingPrice) : sellingPrice;

  if (isGstIncluded) {
    taxable = price / (1 + rate / 100);
    gstAmount = price - taxable;
  } else {
    taxable = price;
    gstAmount = (price * rate) / 100;
  }

  const finalTaxable = taxable * qty;
  const finalGST = gstAmount * qty;

  return {
    taxable: parseFloat(finalTaxable.toFixed(2)),
    gstAmount: parseFloat(finalGST.toFixed(2)),
    cgst: parseFloat((finalGST / 2).toFixed(2)),
    sgst: parseFloat((finalGST / 2).toFixed(2)),
    igst: 0,
    total: parseFloat((finalTaxable + finalGST).toFixed(2)),
  };
}

export const setupIpcHandlers = () => {
  // Add inventory item
  ipcMain.handle("inventory:add", async (event, item: InventoryItem) => {
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

  // Get all inventory items
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

  // Get inventory item by ID
  ipcMain.handle("inventory:getById", async (event, id: string) => {
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

  // Update inventory item
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

  // cart:updateQuantity - + aur - ke liye
  // ipcMain.handle('cart:updateQuantity', async (event, { cartId, newQuantity }) => {
  //     const db = await getDB();
  //     return new Promise((resolve) => {
  //         db.get(`SELECT inventoryId, quantity FROM cart WHERE id = ?`, [cartId], (err, row: any) => {
  //             if (!row) return resolve({ success: false });

  //             const diff = newQuantity - row.quantity; // +1 ya -1

  //             db.run(
  //                 `UPDATE cart SET quantity = ? WHERE id = ?`,
  //                 [newQuantity, cartId],
  //                 function (err) {
  //                     if (err) return resolve({ success: false });

  //                     // Stock adjust karo
  //                     if (diff > 0) {
  //                         // quantity badhi → stock kam
  //                         db.run(`UPDATE inventory SET stock = stock - ? WHERE id = ?`, [diff, row.inventoryId]);
  //                     } else {
  //                         // quantity ghati → stock wapas
  //                         db.run(`UPDATE inventory SET stock = stock + ? WHERE id = ?`, [-diff, row.inventoryId]);
  //                     }

  //                     resolve({ success: true });
  //                 }
  //             );
  //         });
  //     });
  // });

  // Delete inventory item
  ipcMain.handle("inventory:delete", async (event, id: string) => {
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

  // ================= ADD TO CART =================
  // ipcMain.handle("cart:add", async (event, { item, quantity, discountPerItem = 0 }: { item: InventoryItem; quantity: number; discountPerItem?: number }) => {
  //     const db = getDB();
  //     const qty = Math.max(1, Math.floor(quantity));
  //     const price = Number(item.sellingPrice);

  //     const gstRate = Number(item.gstRate) || 0;
  //     const isIncluded = Boolean(item.isGstIncluded);
  //     const gstType = item.gstType || "CGST_SGST";

  //     // --- GST CALCULATION ----
  //     let taxable = 0;
  //     let gstAmount = 0;
  //     let cgst = 0;
  //     let sgst = 0;
  //     let igst = 0;

  //     if (isIncluded) {
  //         // Price already includes GST
  //         taxable = price / (1 + gstRate / 100);
  //         gstAmount = price - taxable;
  //     } else {
  //         // Price excludes GST
  //         taxable = price;
  //         gstAmount = (price * gstRate) / 100;
  //     }

  //     // Split GST
  //     if (gstType === "CGST_SGST") {
  //         cgst = gstAmount / 2;
  //         sgst = gstAmount / 2;
  //     } else {
  //         igst = gstAmount;
  //     }

  //     // Apply quantity & discount
  //     const finalTaxable = taxable * qty;
  //     const finalGST = gstAmount * qty;
  //     const finalDiscount = discountPerItem * qty;
  //     const total = finalTaxable + finalGST - finalDiscount;

  //     // Insert into DB
  //     db.run(
  //         `
  //   INSERT INTO cart (
  //     inventoryId, productName, sku, barcode, unit, sellingPrice,
  //     quantity, discount, taxableAmount, gstAmount, cgst, sgst, igst, totalPrice
  //   )
  //   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  // `,
  //         [
  //             item.id,
  //             item.productName,
  //             item.sku,
  //             item.barcode,
  //             item.unit,
  //             price,
  //             qty,
  //             discountPerItem,
  //             finalTaxable,
  //             finalGST,
  //             cgst * qty,
  //             sgst * qty,
  //             igst * qty,
  //             total,
  //         ]
  //     );

  //     return true;
  // }
  // );

  ipcMain.handle("cart:add", async (event, { item, quantity }) => {
    const db = getDB();
    const qty = Math.max(1, quantity);

    // STOCK UPDATE — reduce stock NOW
    await new Promise((resolve) =>
      db.run(
        `UPDATE inventory SET stock = stock - ? WHERE id = ?`,
        [qty, item.id],
        resolve
      )
    );

    const { taxable, gstAmount, cgst, sgst, igst, total } = calculateTotals(
      item.sellingPrice,
      qty,
      item.gstRate,
      item.isGstIncluded
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
        item.discount ?? 0, // ← discount dynamic
        taxable,
        gstAmount,
        cgst,
        sgst,
        igst,
        total,
      ]
    );

    return { success: true };
  });

  ipcMain.handle(
    "cart:updateQuantity",
    async (event, { cartId, newQuantity }) => {
      const db = getDB();

      return new Promise((resolve) => {
        db.get(
          `SELECT * FROM cart WHERE id = ?`,
          [cartId],
          (err, row: CartItem | undefined) => {
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
              !!row.isGstIncluded
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
          }
        );
      });
    }
  );

  // ================= REMOVE CART ITEM =================
  //   ipcMain.handle("cart:remove", async (event, cartId: string) => {
  //     const db = getDB();

  //     return new Promise((resolve) => {
  //       db.get(
  //         `SELECT inventoryId, quantity FROM cart WHERE id = ?`,
  //         [cartId],
  //         (err, row: any) => {
  //           if (err || !row) {
  //             return resolve({ success: false, error: "Cart item not found" });
  //           }

  //           const inventoryId = row.inventoryId as string;
  //           const qtyToReturn = Number(row.quantity) || 0;

  //           db.serialize(() => {
  //             db.run("BEGIN TRANSACTION");

  //             db.run(`DELETE FROM cart WHERE id = ?`, [cartId], function (err) {
  //               if (err || this.changes === 0) {
  //                 db.run("ROLLBACK");
  //                 return resolve({
  //                   success: false,
  //                   error: "Failed to delete cart item",
  //                 });
  //               }

  //               db.run(
  //                 `UPDATE inventory SET stock = stock + ? WHERE id = ?`,
  //                 [qtyToReturn, inventoryId],
  //                 function (err) {
  //                   if (err || this.changes === 0) {
  //                     db.run("ROLLBACK");
  //                     return resolve({
  //                       success: false,
  //                       error: "Failed to restore stock",
  //                     });
  //                   }

  //                   db.run("COMMIT");
  //                   resolve({
  //                     success: true,
  //                     message: "Item removed & stock restored",
  //                   });
  //                 }
  //               );
  //             });
  //           });
  //         }
  //       );
  //     });
  //   });

  ipcMain.handle("cart:remove", async (event, cartId) => {
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

  ipcMain.handle("print:bill", async (event, billData) => {
    try {
      PosPrinter.print(billData, {
        printerName: PRINTER_NAME,
        preview: false,
        width: "58mm",
        margin: "0px",
        copies: 1,
        timeOutPerLine: 400,
        silent: true,
      })
        .then(() => {
          console.log("Bill printed successfully!");
        })
        .catch((err) => {
          console.error("Print failed:", err);
          return { success: false, error: err.message };
        });

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
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
  ipcMain.handle("store:save", async (event, settings: any) => {
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
};
