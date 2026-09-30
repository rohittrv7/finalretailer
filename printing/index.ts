/**
 * Printing & Invoice Layer
 *
 * This module will handle receipt/invoice generation, thermal printer logic,
 * PDF generation, and silent/dialog printing via Electron.
 */

export interface PrintJobOptions {
  silent?: boolean
  deviceName?: string
  copies?: number
}

export interface InvoiceData {
  invoiceNumber: string
  date: string
  customerName?: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  subtotal: number
  tax: number
  total: number
}

export const printing = {
  async printInvoice(invoice: InvoiceData, _options?: PrintJobOptions): Promise<boolean> {
    console.log(`[Printing] Queuing invoice print job: ${invoice.invoiceNumber}`)
    // Thermal printing or Electron webContents.print() logic will go here
    return true
  },
}

export default printing
