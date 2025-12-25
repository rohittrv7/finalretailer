import { InventoryItem } from "./inventry";

export interface IElectronAPI {
  auth: {
    isFirstTime: () => Promise<boolean>;
    isSetupComplete: () => Promise<boolean>;

    // Setup business (only once)
    setupBusiness: (data: {
      businessName: string;
      ownerName: string;
      phone: string;
      email: string;
      password: string;
      businessCategory: string;
    }) => Promise<{
      success: boolean;
      user?: UserProfile;
      error?: string;
    }>;

    // Get current logged-in user
    getUser: () => Promise<UserProfile | null>;

    // activateLicense: (licenseKey: string) => Promise<{
    //   data: { user; entitlements };
    //   success: boolean;
    //   error?: string;
    // }>;

    simulatePurchase: (
      planName: "Starter" | "Standard" | "Pro",
      billingCycle: "monthly" | "yearly"
    ) => Promise<{
      success: boolean;
      data: { user; entitlements };
      error?: string;
    }>;
  };

  inventory: {
    add: (item: Omit<InventoryItem>) => Promise<{
      success: boolean;
      id?: string;
      error?: string;
      message?: string;
    }>;

    getAll: () => Promise<{
      success: boolean;
      data?: InventoryItem[];
      error?: string;
      message?: string;
    }>;

    getById: (id: string) => Promise<{
      success: boolean;
      data?: InventoryItem;
      error?: string;
      message?: string;
    }>;

    update: (
      id: string,
      item: Partial<InventoryItem>
    ) => Promise<{ success: boolean; error?: string; message?: string }>;

    delete: (
      id: string
    ) => Promise<{ success: boolean; error?: string; message?: string }>;

    state: () => Promise<{
      success: boolean;
      data?: {
        totalItems: number;
        lowStock: number;
        outOfStock: number;
        stockValue: number;
      };
    }>;
  };

  cart: {
    // Add item to cart (agar pehle se hai to quantity +1)
    add: (payload: { item: InventoryItem; quantity: number }) => Promise<{
      success: boolean;
      error?: string;
    }>;
    // add: (item: InventoryItem) => Promise<{ success: boolean; cartId?: string; error?: string; message?: string; }>;
    // Direct quantity update (+ / - ke liye)
    updateQuantity: (payload: {
      cartId: string;
      newQuantity: number;
    }) => Promise<{ success: boolean; error?: string; message?: string }>;
    // Remove item from cart (quantity 0 karne par ya direct delete)
    remove: (
      cartId: string
    ) => Promise<{ success: boolean; error?: string; message?: string }>;
    // Get current cart items
    getAll: () => Promise<{
      success: boolean;
      data?: CartItem[];
      totalAmount?: number;
      totalItems?: number;
      error?: string;
    }>;
    // Clear entire cart (Bill done ke baad)
    clear: () => Promise<{
      success: boolean;
      message?: string;
      error?: string;
    }>;

    printBill: (
      billData: any
    ) => Promise<{ success: boolean; error?: string; message?: string }>;
  };

  store: {
    get: () => Promise<{
      success: boolean;
      data?: StoreInfo;
      message?: string;
    }>;
    getBillingSettings: () => Promise<{
      success: boolean;
      data?: StoreInfo;
      message?: string;
    }>;
    getNotifications: () => Promise<{
      success: boolean;
      data?: StoreInfo;
      message?: string;
    }>;
    getPreference: () => Promise<{
      success: boolean;
      data?: StoreInfo;
      message?: string;
    }>;
    updateNotifications: (settings: any) => Promise<{
      success: boolean;
      error?: string;
      message?: string;
    }>;
    updatePreference: (settings: any) => Promise<{
      success: boolean;
      error?: string;
      message?: string;
    }>;
    updateBillingSettings: (settings: any) => Promise<{
      success: boolean;
      error?: string;
      message?: string;
    }>;
    getStoreSettings: () => Promise<{
      success: boolean;
      data?: StoreSettings;
      error?: string;
    }>;

    updateStoreSettings: (payload: Partial<StoreSettings>) => Promise<{
      success: boolean;
      data?: StoreSettings;
      error?: string;
    }>;
    save: (
      settings: StoreInfo
    ) => Promise<{ success: boolean; error?: string; message?: string }>;
  };

  invoice: {
    getAll: () => Promise<{
      success: boolean;
      data?: InvoiceSummary[];
      error?: string;
    }>;
    getById: (invoiceId: string) => Promise<{
      success: boolean;
      data?: InvoiceDetail;
      error?: string;
    }>;
    create: (payload: InvoicePayload) => Promise<{
      success: boolean;
      invoiceId?: string;
      invoiceNumber?: string;
      error?: string;
    }>;
    print: (
      invoiceId: string
    ) => Promise<{ success: boolean; data?: string; error?: string }>;
  };

  customer: {
    getAllCustomer: () => Promise<{
      success: boolean;
      data?: CustomerWithDue[];
      error?: string;
    }>;
    getById: (customerId: string) => Promise<{
      success: boolean;
      data?: CustomerWithDue;
      error?: string;
    }>;
  };

  // Dashboard APIs
  dashboard: {
    get: () => Promise<{
      success: boolean;
      data?: {
        todaySales: number;
        todayProfit: number;
        todayOrders: number;
        months: { month: string; sales: number; profit: number }[];
        lowStock: any[];
        expiring: any[];
      };
      message?: string;
    }>;

    getTopLists: () => Promise<{
      success: boolean;
      data?: {
        categories: {
          category: string;
          sales: number;
          profit: number;
          margin: number;
        }[];
        products: {
          product: string;
          units: number;
          revenue: number;
          profit: number;
        }[];
      };
      message?: string;
    }>;
  };
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
