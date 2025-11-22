// electron/db/queries.ts
import { v4 as uuidv4 } from 'uuid';
import db from './db';
import { InventoryItem } from '@/frontend/types/inventry';

export const createProduct = (data: Partial<InventoryItem>, supplierIds: string[] = []): Promise<InventoryItem> => {
    return new Promise((resolve, reject) => {
        const id = uuidv4();
        const now = Math.floor(Date.now() / 1000);

        const stmt = db.prepare(`
      INSERT INTO products (
        id, product_name, category, brand, sku, barcode, purchase_price,
        selling_price, mrp, discount_percent, tax_rate, unit, quantity,
        reorder_level, status, low_stock_alert, purchase_date, expiry_date,
        image_url, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            data.productName,
            data.category,
            data.brand || null,
            data.sku,
            data.barcode || null,
            data.purchasePrice || null,
            data.sellingPrice || null,
            data.mrp || null,
            data.discount || 0,
            data.gstRate || 18,
            data.unit || 'pcs',
            data.stock || 0,
            data.reorderLevel || null,
            data.lowStockAlert || 'In Stock',
            data.lowStockAlert || 0,
            data.purchasePrice || null,
            data.expiryDate || null,
            data.imageUrl || null,
            data.description || null,
            now,
            now,
            (err: any) => {
                if (err) return reject(err);
                if (supplierIds.length > 0) {
                    const supStmt = db.prepare(`INSERT INTO product_suppliers (product_id, supplier_id) VALUES (?, ?)`);
                    supplierIds.forEach(sid => supStmt.run(id, sid));
                    supStmt.finalize();
                }
                resolve({ ...data, id, created_at: now, updated_at: now } as InventoryItem);
            }
        );
        stmt.finalize();
    });
};

// === GET ALL PRODUCTS ===
export const getAllProducts = (): Promise<InventoryItem[]> => {
    return new Promise((resolve, reject) => {
        db.all(`
      SELECT p.*, GROUP_CONCAT(ps.supplier_id) as supplier_ids
      FROM products p
      LEFT JOIN product_suppliers ps ON p.id = ps.product_id
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `, (err, rows: any[]) => {
            if (err) return reject(err);

            const products: InventoryItem[] = rows.map(row => ({
                ...row,
                supplier_ids: row.supplier_ids ? row.supplier_ids.split(',') : [],
                purchase_price: row.purchase_price || undefined,
                selling_price: row.selling_price || undefined,
                mrp: row.mrp || undefined,
                discount_percent: row.discount_percent || 0,
                tax_rate: row.tax_rate || 18,
                quantity: row.quantity || 0,
                reorder_level: row.reorder_level || undefined,
                low_stock_alert: row.low_stock_alert || 0,
            }));
            resolve(products);
        });
    });
};

// === GET SINGLE PRODUCT BY ID ===
export const getProductById = (id: string): Promise<InventoryItem | null> => {
    return new Promise((resolve, reject) => {
        db.get(`
      SELECT p.*, GROUP_CONCAT(ps.supplier_id) as supplier_ids
      FROM products p
      LEFT JOIN product_suppliers ps ON p.id = ps.product_id
      WHERE p.id = ?
      GROUP BY p.id
    `, [id], (err, row: any) => {
            if (err) return reject(err);
            if (!row) return resolve(null);

            const product: InventoryItem = {
                ...row,
                supplier_ids: row.supplier_ids ? row.supplier_ids.split(',') : [],
                purchase_price: row.purchase_price || undefined,
                selling_price: row.selling_price || undefined,
                mrp: row.mrp || undefined,
                discount_percent: row.discount_percent || 0,
                tax_rate: row.tax_rate || 18,
                quantity: row.quantity || 0,
                reorder_level: row.reorder_level || undefined,
                low_stock_alert: row.low_stock_alert || 0,
            };
            resolve(product);
        });
    });
};