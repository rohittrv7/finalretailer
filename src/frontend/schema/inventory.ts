import { z } from "zod";

const UNITS = ["Piece", "Box", "Kg", "Gram", "Liter", "Meter", "Pack", "Dozen", "Pair"] as const;
const GST_RATES = [0, 5, 12, 18, 28] as const;

export const inventorySchema = z.object({
  productName: z.string().min(2, "Product name required").max(100),
  category: z.string().min(1, "Category required"),
  brand: z.string().min(1, "Brand required").optional().default(""),
  sku: z.string().optional().default(""),
  barcode: z.string().optional(),
  unit: z.enum(UNITS),
  hsnCode: z.string(),
  stock: z.coerce.number().min(0).default(0),
  quantity: z.coerce.number().min(0).default(0),
  reorderLevel: z.coerce.number().min(0).default(10),
  purchasePrice: z.coerce.number().positive("Purchase price > 0"),
  sellingPrice: z.coerce.number().positive("Selling price > 0"),
  mrp: z.coerce.number().positive("MRP > 0"),
  discount: z.coerce.number().min(0).max(100).default(0),
  gstRate: z.coerce.number().refine((n) => GST_RATES.includes(n), "Invalid GST").default(18),
  supplier: z.string().min(1, "Supplier required"),
  description: z.string().optional().default(""),
  lowStockAlert: z.boolean().default(true),
  imageUrl: z.string().optional().default(""),
})
  .refine((data) => data.sellingPrice <= data.mrp, {
    message: "Selling price cannot exceed MRP",
    path: ["sellingPrice"],
  });

export type InventoryFormData = z.infer<typeof inventorySchema>;
