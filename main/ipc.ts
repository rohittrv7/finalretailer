import { ipcMain, app, BrowserWindow, dialog } from 'electron'
import fs from 'node:fs'
import {
  productRepository,
  customerRepository,
  categoryRepository,
  stockRepository,
  invoiceRepository,
  heldBillRepository,
  settingsRepository,
  reportsRepository,
  backupRepository,
  getDbPath,
  type NewProduct,
  type NewCustomer,
  type CreateInvoicePayload,
} from '../db/index'
import { authService } from '../db/auth'

export function registerIpcHandlers() {
  // Database metadata
  ipcMain.handle('db:info', async () => {
    return {
      dbPath: getDbPath(),
    }
  })

  // Category CRUD Handlers
  ipcMain.handle('db:categories:getAll', async () => {
    return categoryRepository.getAll()
  })

  ipcMain.handle('db:categories:create', async (_event, data: { name: string; description?: string | null }) => {
    return categoryRepository.create(data)
  })

  ipcMain.handle('db:categories:update', async (_event, id: number, data: { name?: string; description?: string | null }) => {
    return categoryRepository.update(id, data)
  })

  ipcMain.handle('db:categories:delete', async (_event, id: number) => {
    return categoryRepository.delete(id)
  })

  // Product CRUD Handlers
  ipcMain.handle('db:products:getAll', async () => {
    return productRepository.getAll()
  })

  ipcMain.handle('db:products:getById', async (_event, id: number) => {
    return productRepository.getById(id)
  })

  ipcMain.handle('db:products:create', async (_event, data: NewProduct) => {
    return productRepository.create(data)
  })

  ipcMain.handle('db:products:update', async (_event, id: number, data: Partial<NewProduct>) => {
    return productRepository.update(id, data)
  })

  ipcMain.handle('db:products:delete', async (_event, id: number) => {
    return productRepository.delete(id)
  })

  // Stock History & Ledger Handlers
  ipcMain.handle(
    'db:stock:adjust',
    async (
      _event,
      params: {
        productId: number
        changeQty: number
        reason: 'sale' | 'return' | 'manual-adjustment' | 'restock'
        notes?: string | null
        referenceId?: string | null
      }
    ) => {
      return stockRepository.adjustStock(params)
    }
  )

  ipcMain.handle('db:stock:getHistory', async (_event, productId?: number, limit?: number) => {
    return stockRepository.getHistory(productId, limit)
  })

  // Customer CRUD Handlers
  ipcMain.handle(
    'db:customers:getAll',
    async (_event, options?: { includeArchived?: boolean; onlyWithDues?: boolean }) => {
      return customerRepository.getAll(options)
    }
  )

  ipcMain.handle('db:customers:getById', async (_event, id: number) => {
    return customerRepository.getById(id)
  })

  ipcMain.handle('db:customers:findByPhone', async (_event, phone: string) => {
    return customerRepository.findByPhone(phone)
  })

  ipcMain.handle('db:customers:create', async (_event, data: NewCustomer) => {
    return customerRepository.create(data)
  })

  ipcMain.handle('db:customers:update', async (_event, id: number, data: Partial<NewCustomer>) => {
    return customerRepository.update(id, data)
  })

  ipcMain.handle('db:customers:delete', async (_event, id: number) => {
    return customerRepository.delete(id)
  })

  ipcMain.handle('db:customers:getLedger', async (_event, customerId: number) => {
    return customerRepository.getLedger(customerId)
  })

  ipcMain.handle(
    'db:customers:recordPayment',
    async (
      _event,
      params: {
        customerId: number
        amount: number
        paymentMode: string
        invoiceId?: number | null
        notes?: string | null
      }
    ) => {
      return customerRepository.recordPayment(params)
    }
  )

  // Invoices & Payments Handlers
  ipcMain.handle('db:invoices:getNextNumber', async () => {
    return invoiceRepository.getNextInvoiceNo()
  })

  ipcMain.handle('db:invoices:create', async (_event, payload: CreateInvoicePayload) => {
    return invoiceRepository.createInvoice(payload)
  })

  ipcMain.handle('db:invoices:cancel', async (_event, id: number, reason?: string) => {
    return invoiceRepository.cancelInvoice(id, reason)
  })

  ipcMain.handle(
    'db:invoices:recordPayment',
    async (
      _event,
      params: {
        invoiceId: number
        amount: number
        paymentMode: string
        notes?: string | null
      }
    ) => {
      return invoiceRepository.recordInvoicePayment(params)
    }
  )

  ipcMain.handle('db:invoices:getById', async (_event, id: number) => {
    return invoiceRepository.getById(id)
  })

  ipcMain.handle(
    'db:invoices:getAll',
    async (
      _event,
      filters?: {
        status?: string
        customerId?: number
        search?: string
        limit?: number
      }
    ) => {
      return invoiceRepository.getAll(filters)
    }
  )

  // Held Bills Handlers
  ipcMain.handle('db:heldBills:getAll', async () => {
    return heldBillRepository.getAll()
  })

  ipcMain.handle(
    'db:heldBills:create',
    async (
      _event,
      data: {
        bill_label: string
        customer_id?: number | null
        customer_name?: string | null
        cart_json: string
        bill_discount_type?: 'percent' | 'flat'
        bill_discount_value?: number
        round_off_enabled?: number
        notes?: string | null
      }
    ) => {
      return heldBillRepository.create(data)
    }
  )

  ipcMain.handle('db:heldBills:delete', async (_event, id: number) => {
    return heldBillRepository.delete(id)
  })

  // Settings Handlers
  ipcMain.handle('db:settings:get', async (_event, key: string) => {
    return settingsRepository.get(key)
  })

  ipcMain.handle('db:settings:set', async (_event, key: string, value: string) => {
    return settingsRepository.set(key, value)
  })

  // Reports Handlers
  ipcMain.handle('db:reports:getStats', async (_event, period?: 'today' | 'week' | 'month') => {
    return reportsRepository.getStats(period || 'today')
  })

  // Backup & Disaster Recovery Handlers
  ipcMain.handle('db:backup:export', async () => {
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10)
    const result = await dialog.showSaveDialog(win, {
      title: 'Export Retailer POS Database Backup',
      defaultPath: `retailer-backup-${dateStr}.db`,
      filters: [
        { name: 'SQLite Database (*.db)', extensions: ['db', 'sqlite'] },
        { name: 'All Files (*.*)', extensions: ['*'] },
      ],
    })

    if (result.canceled || !result.filePath) {
      return { success: false, cancelled: true }
    }

    try {
      await backupRepository.exportBackup(result.filePath)
      return { success: true, filePath: result.filePath }
    } catch (err: any) {
      console.error('[Backup] Export error:', err)
      return { success: false, error: err?.message || 'Failed to export database backup file.' }
    }
  })

  ipcMain.handle('db:backup:restore', async () => {
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
    const result = await dialog.showOpenDialog(win, {
      title: 'Select Retailer POS Backup File to Restore',
      properties: ['openFile'],
      filters: [
        { name: 'SQLite Database (*.db, *.sqlite)', extensions: ['db', 'sqlite'] },
        { name: 'All Files (*.*)', extensions: ['*'] },
      ],
    })

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { success: false, cancelled: true }
    }

    const backupPath = result.filePaths[0]
    try {
      const userDataPath = app.getPath('userData')
      await backupRepository.restoreBackup(backupPath, userDataPath)
      return { success: true, filePath: backupPath }
    } catch (err: any) {
      console.error('[Backup] Restore error:', err)
      return { success: false, error: err?.message || 'The selected file is not a valid database backup.' }
    }
  })

  // Printing & PDF Export Handlers
  ipcMain.handle('app:saveAsPDF', async (_event, options?: { filename?: string; layout?: 'thermal' | 'a4' }) => {
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
    const defaultFilename = options?.filename ? `${options.filename}.pdf` : `invoice-${Date.now()}.pdf`

    const saveResult = await dialog.showSaveDialog(win, {
      title: 'Save Invoice as PDF',
      defaultPath: defaultFilename,
      filters: [{ name: 'PDF Document (*.pdf)', extensions: ['pdf'] }],
    })

    if (saveResult.canceled || !saveResult.filePath) {
      return { success: false, cancelled: true }
    }

    try {
      // Configure printToPDF options based on thermal (80mm) vs A4 layout
      const printOptions: Electron.PrintToPDFOptions =
        options?.layout === 'thermal'
          ? {
              pageSize: { width: 80000, height: 220000 }, // 80mm roll width representation
              margins: { marginType: 'none' },
              printBackground: true,
            }
          : {
              pageSize: 'A4',
              margins: { marginType: 'custom', top: 0.3, bottom: 0.3, left: 0.3, right: 0.3 },
              printBackground: true,
            }

      const pdfData = await win.webContents.printToPDF(printOptions)
      fs.writeFileSync(saveResult.filePath, pdfData)
      return { success: true, filePath: saveResult.filePath }
    } catch (err: any) {
      console.error('[Print] PDF generation error:', err)
      return { success: false, error: err?.message || 'Failed to generate PDF invoice.' }
    }
  })

  ipcMain.handle('app:print', async (_event, options?: { silent?: boolean }) => {
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
    try {
      win.webContents.print(
        {
          silent: options?.silent ?? false,
          printBackground: true,
        },
        (success, failureReason) => {
          if (!success) {
            console.warn('[Print] Print job cancelled or failed:', failureReason)
          }
        }
      )
      return { success: true }
    } catch (err: any) {
      console.error('[Print] Print error:', err)
      return { success: false, error: err?.message || 'Printing failed.' }
    }
  })

  // Authentication Handlers
  ipcMain.handle('auth:isConfigured', async () => {
    return authService.isConfigured()
  })

  ipcMain.handle('auth:isSessionUnlocked', async () => {
    return authService.isSessionUnlocked()
  })

  ipcMain.handle('auth:lockSession', async () => {
    authService.lockSession()
    return true
  })

  ipcMain.handle('auth:setSessionUnlocked', async (_event, unlocked: boolean) => {
    authService.setSessionUnlocked(unlocked)
    return true
  })

  ipcMain.handle('auth:getLockStatus', async () => {
    return authService.getLockStatus()
  })

  ipcMain.handle('auth:setupPin', async (_event, pin: string) => {
    return authService.setupPin(pin)
  })

  ipcMain.handle('auth:verifyPin', async (_event, pin: string) => {
    return authService.verifyPin(pin)
  })

  ipcMain.handle('auth:resetWithRecovery', async (_event, recoveryCode: string, newPin: string) => {
    return authService.resetWithRecovery(recoveryCode, newPin)
  })

  ipcMain.handle('auth:changePin', async (_event, oldPin: string, newPin: string) => {
    return authService.changePin(oldPin, newPin)
  })
}
