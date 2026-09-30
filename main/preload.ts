import { ipcRenderer, contextBridge } from 'electron'

// Expose protected methods that allow the renderer process to safely access
// database, window, and authentication operations via IPC without exposing direct Node.js access.
contextBridge.exposeInMainWorld('electronAPI', {
  onMainProcessMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_event, value) => callback(value))
  },
  window: {
    toggleFullscreen: () => ipcRenderer.invoke('app:toggleFullscreen'),
    isFullscreen: () => ipcRenderer.invoke('app:isFullscreen'),
    print: (options?: { silent?: boolean }) => ipcRenderer.invoke('app:print', options),
    saveAsPDF: (options?: { filename?: string; layout?: 'thermal' | 'a4' }) =>
      ipcRenderer.invoke('app:saveAsPDF', options),
  },
  db: {
    getInfo: () => ipcRenderer.invoke('db:info'),
    backup: {
      export: () => ipcRenderer.invoke('db:backup:export'),
      restore: () => ipcRenderer.invoke('db:backup:restore'),
    },
    categories: {
      getAll: () => ipcRenderer.invoke('db:categories:getAll'),
      create: (data: unknown) => ipcRenderer.invoke('db:categories:create', data),
      update: (id: number, data: unknown) => ipcRenderer.invoke('db:categories:update', id, data),
      delete: (id: number) => ipcRenderer.invoke('db:categories:delete', id),
    },
    products: {
      getAll: () => ipcRenderer.invoke('db:products:getAll'),
      getById: (id: number) => ipcRenderer.invoke('db:products:getById', id),
      create: (data: unknown) => ipcRenderer.invoke('db:products:create', data),
      update: (id: number, data: unknown) => ipcRenderer.invoke('db:products:update', id, data),
      delete: (id: number) => ipcRenderer.invoke('db:products:delete', id),
    },
    stock: {
      adjust: (params: unknown) => ipcRenderer.invoke('db:stock:adjust', params),
      getHistory: (productId?: number, limit?: number) =>
        ipcRenderer.invoke('db:stock:getHistory', productId, limit),
    },
    customers: {
      getAll: (options?: unknown) => ipcRenderer.invoke('db:customers:getAll', options),
      getById: (id: number) => ipcRenderer.invoke('db:customers:getById', id),
      findByPhone: (phone: string) => ipcRenderer.invoke('db:customers:findByPhone', phone),
      create: (data: unknown) => ipcRenderer.invoke('db:customers:create', data),
      update: (id: number, data: unknown) => ipcRenderer.invoke('db:customers:update', id, data),
      delete: (id: number) => ipcRenderer.invoke('db:customers:delete', id),
      getLedger: (customerId: number) => ipcRenderer.invoke('db:customers:getLedger', customerId),
      recordPayment: (params: unknown) => ipcRenderer.invoke('db:customers:recordPayment', params),
    },
    invoices: {
      getNextNumber: () => ipcRenderer.invoke('db:invoices:getNextNumber'),
      create: (payload: unknown) => ipcRenderer.invoke('db:invoices:create', payload),
      cancel: (id: number, reason?: string) => ipcRenderer.invoke('db:invoices:cancel', id, reason),
      recordPayment: (params: unknown) => ipcRenderer.invoke('db:invoices:recordPayment', params),
      getById: (id: number) => ipcRenderer.invoke('db:invoices:getById', id),
      getAll: (filters?: unknown) => ipcRenderer.invoke('db:invoices:getAll', filters),
    },
    heldBills: {
      getAll: () => ipcRenderer.invoke('db:heldBills:getAll'),
      create: (data: unknown) => ipcRenderer.invoke('db:heldBills:create', data),
      delete: (id: number) => ipcRenderer.invoke('db:heldBills:delete', id),
    },
    settings: {
      get: (key: string) => ipcRenderer.invoke('db:settings:get', key),
      set: (key: string, value: string) => ipcRenderer.invoke('db:settings:set', key, value),
    },
    reports: {
      getStats: (period?: 'today' | 'week' | 'month') =>
        ipcRenderer.invoke('db:reports:getStats', period),
    },
  },
  auth: {
    isConfigured: () => ipcRenderer.invoke('auth:isConfigured'),
    isSessionUnlocked: () => ipcRenderer.invoke('auth:isSessionUnlocked'),
    lockSession: () => ipcRenderer.invoke('auth:lockSession'),
    setSessionUnlocked: (unlocked: boolean) => ipcRenderer.invoke('auth:setSessionUnlocked', unlocked),
    getLockStatus: () => ipcRenderer.invoke('auth:getLockStatus'),
    setupPin: (pin: string) => ipcRenderer.invoke('auth:setupPin', pin),
    verifyPin: (pin: string) => ipcRenderer.invoke('auth:verifyPin', pin),
    resetWithRecovery: (recoveryCode: string, newPin: string) =>
      ipcRenderer.invoke('auth:resetWithRecovery', recoveryCode, newPin),
    changePin: (oldPin: string, newPin: string) =>
      ipcRenderer.invoke('auth:changePin', oldPin, newPin),
  },
})
