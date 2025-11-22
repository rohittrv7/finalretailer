// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';
import { InventoryItem } from './frontend/types/inventry';
import { StoreSettings } from './frontend/types/storeSetting';

const electronAPI = {
  inventory: {
    add: (item: InventoryItem) =>
      ipcRenderer.invoke('inventory:add', item),

    getAll: () =>
      ipcRenderer.invoke('inventory:getAll'),

    getById: (id: string) =>
      ipcRenderer.invoke('inventory:getById', id),

    update: (id: string, item: Partial<InventoryItem>) =>
      ipcRenderer.invoke('inventory:update', id, item),

    delete: (id: string) =>
      ipcRenderer.invoke('inventory:delete', id),
  },

  cart: {
    add: (payload: { item: InventoryItem; quantity: number }) =>
      ipcRenderer.invoke('cart:add', payload),

    remove: (cartId: number) =>
      ipcRenderer.invoke('cart:remove', cartId),

    getAll: () =>
      ipcRenderer.invoke('cart:getAll'),

    clear: () =>
      ipcRenderer.invoke('cart:clear'),

    updateQuantity: ({ cartId, newQuantity }: { cartId: string; newQuantity: number }) =>
      ipcRenderer.invoke('cart:updateQuantity', { cartId, newQuantity }),

    printBill: (data: any) => ipcRenderer.invoke('print:bill', data)
  },

  store: {
    get: () => ipcRenderer.invoke('store:get'),
    save: (settings: StoreSettings) => ipcRenderer.invoke('store:save', settings)
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);