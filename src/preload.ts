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
    save: (settings: StoreInfo) => ipcRenderer.invoke("store:save", settings),
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
