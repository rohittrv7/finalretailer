// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";
import { InventoryItem } from "./frontend/types/inventry";
import { StoreInfo } from "./frontend/types/storeSetting";
// import { get } from "react-hook-form/dist";

const electronAPI = {
  auth: {
    isSetupComplete: () => ipcRenderer.invoke("app-is-setup-complete"),
    isFirstTime: () => ipcRenderer.invoke("app-is-first-time"),
    setupBusiness: (data: any) =>
      ipcRenderer.invoke("app-setup-business", data),
    getUser: () => ipcRenderer.invoke("app-get-user"),
    // This is a secure way to simulate a purchase without exposing license generation to the frontend.
    simulatePurchase: (
      planName: "Starter" | "Standard" | "Pro",
      billingCycle: "monthly" | "yearly"
    ) => ipcRenderer.invoke("license:simulatePurchase", planName, billingCycle),
  },
  inventory: {
    add: (item: InventoryItem) => ipcRenderer.invoke("inventory:add", item),

    getAll: () => ipcRenderer.invoke("inventory:getAll"),

    getById: (id: string) => ipcRenderer.invoke("inventory:getById", id),

    update: (id: string, item: Partial<InventoryItem>) =>
      ipcRenderer.invoke("inventory:update", id, item),

    delete: (id: string) => ipcRenderer.invoke("inventory:delete", id),

    state: () => ipcRenderer.invoke("inventory:state"),
  },

  // Dashboard APIs
  dashboard: {
    // Full dashboard payload (today + months + lowStock + expiring)
    get: () => ipcRenderer.invoke("dashboard:get"),
    // Top categories & top products lists for dashboard cards/tables
    getTopLists: () => ipcRenderer.invoke("dashboard:topLists"),
  },

  cart: {
    add: (payload: { item: InventoryItem; quantity: number }) =>
      ipcRenderer.invoke("cart:add", payload),

    remove: (cartId: number) => ipcRenderer.invoke("cart:remove", cartId),

    getAll: () => ipcRenderer.invoke("cart:getAll"),

    clear: () => ipcRenderer.invoke("cart:clear"),

    updateQuantity: ({
      cartId,
      newQuantity,
    }: {
      cartId: string;
      newQuantity: number;
    }) => ipcRenderer.invoke("cart:updateQuantity", { cartId, newQuantity }),

    printBill: (data: any) => ipcRenderer.invoke("print:bill", data),
  },

  store: {
    get: () => ipcRenderer.invoke("store:get"),
    getBillingSettings: () => ipcRenderer.invoke("store:billingSettings"),
    getNotifications: () => ipcRenderer.invoke("store:notifications"),
    getPreference: () => ipcRenderer.invoke("store:preference"),
    save: (settings: StoreInfo) => ipcRenderer.invoke("store:save", settings),
    updateNotifications: (settings: any) =>
      ipcRenderer.invoke("store:updateNotifications", settings),
    updatePreference: (settings: any) =>
      ipcRenderer.invoke("store:updatePreference", settings),
    updateBillingSettings: (settings: any) =>
      ipcRenderer.invoke("store:updateBillingSettings", settings),

    getStoreSettings: () => ipcRenderer.invoke("store:getStoreSettings"),

    updateStoreSettings: (payload: {
      storeName?: string;
      companyName?: string;
      ownerName?: string;
      phone?: string;
      email?: string;
      address?: string;

      gstEnabled?: number;
      gstNumber?: string;
      stateCode?: string;

      currency?: string;
      financialYear?: string;
      storeImageUrl?: string;
    }) => ipcRenderer.invoke("store:updateStoreSettings", payload),
  },

  invoice: {
    getAll: () => ipcRenderer.invoke("invoice:getAll"),
    getById: (invoiceId: string) =>
      ipcRenderer.invoke("invoice:getById", invoiceId),
    create: (payload: any) => ipcRenderer.invoke("invoice:create", payload),
    print: (invoiceId: string) =>
      ipcRenderer.invoke("invoice:print", invoiceId),
  },

  customer: {
    getAllCustomer: () => ipcRenderer.invoke("customer:getListWithDue"),
    getById: (customerId: number) =>
      ipcRenderer.invoke("customer:getDetails", customerId),
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
