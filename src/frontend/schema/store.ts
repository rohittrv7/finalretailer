import { z } from "zod";

export const storeSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  email: z.string().email("Invalid email").nullable().optional(),
  phone: z.string().min(10, "Valid phone number required"),
  gstin: z
    .string()
    .length(15, "GSTIN must be 15 characters")
    .nullable()
    .optional(),
  taxId: z.string().optional(),
  address: z.string().min(10, "Address is required"),
});
