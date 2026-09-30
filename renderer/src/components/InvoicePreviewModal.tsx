import React, { useState, useEffect, useMemo } from 'react'
import { Invoice, InvoiceItem } from '../vite-env'

interface InvoicePreviewModalProps {
  invoice: Invoice & { items?: InvoiceItem[] }
  onClose: () => void
  onInvoiceCancelled?: () => void
  onPaymentRecorded?: () => void
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  invoice,
  onClose,
  onInvoiceCancelled,
  onPaymentRecorded,
}) => {
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Statutory HSN-wise tax breakdown computation
  const hsnBreakdown = useMemo(() => {
    if (invoice.tax_breakup_json) {
      try {
        const parsed = JSON.parse(invoice.tax_breakup_json)
        if (parsed.hsnSummary && Array.isArray(parsed.hsnSummary) && parsed.hsnSummary.length > 0) {
          return parsed.hsnSummary as Array<{
            hsnCode: string
            taxableValue: number
            gstRate: number
            cgstRate: number
            cgstAmount: number
            sgstRate: number
            sgstAmount: number
            totalTax: number
          }>
        }
      } catch {}
    }

    // Dynamic fallback grouping by HSN code
    const map = new Map<string, {
      hsnCode: string
      taxableValue: number
      gstRate: number
      cgstRate: number
      cgstAmount: number
      sgstRate: number
      sgstAmount: number
      totalTax: number
    }>()

    for (const item of invoice.items || []) {
      const hsn = (item.hsn_code && item.hsn_code.trim()) ? item.hsn_code.trim() : 'N/A'
      const rate = item.gst_rate || 0
      const cgstR = Number((rate / 2).toFixed(2))
      const sgstR = Number((rate / 2).toFixed(2))

      const taxAmt = Number(item.tax_amount) || 0
      const cgstAmt = Number(item.cgst_amount) || Number((taxAmt / 2).toFixed(2))
      const sgstAmt = Number(item.sgst_amount) || Number((taxAmt - cgstAmt).toFixed(2))
      const lineTot = Number(item.line_total) || 0
      const taxable = Math.max(0, Number((lineTot - taxAmt).toFixed(2)))

      const key = `${hsn}_${rate}`
      const existing = map.get(key)
      if (existing) {
        existing.taxableValue = Number((existing.taxableValue + taxable).toFixed(2))
        existing.cgstAmount = Number((existing.cgstAmount + cgstAmt).toFixed(2))
        existing.sgstAmount = Number((existing.sgstAmount + sgstAmt).toFixed(2))
        existing.totalTax = Number((existing.totalTax + taxAmt).toFixed(2))
      } else {
        map.set(key, {
          hsnCode: hsn,
          taxableValue: taxable,
          gstRate: rate,
          cgstRate: cgstR,
          cgstAmount: cgstAmt,
          sgstRate: sgstR,
          sgstAmount: sgstAmt,
          totalTax: taxAmt,
        })
      }
    }

    return Array.from(map.values())
  }, [invoice])

  // Layout format selection: 'thermal' (80mm POS roll) vs 'a4' (standard full-page GST invoice)
  const [previewLayout, setPreviewLayout] = useState<'thermal' | 'a4'>('thermal')
  const [isSavingPDF, setIsSavingPDF] = useState(false)
  const [pdfFeedback, setPdfFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Store information loaded dynamically from SQLite settings table
  const [storeInfo, setStoreInfo] = useState({
    storeName: 'RETAILER POS STORE',
    counterId: 'Counter 01',
    storeAddress: '123 Market Street',
    storePhone: '+91 98765 43210',
    storeGstin: '27AAAAA0000A1Z5',
  })

  useEffect(() => {
    const loadStoreSettings = async () => {
      if (window.electronAPI?.db?.settings) {
        try {
          const [name, counter, addr, phone, gstin] = await Promise.all([
            window.electronAPI.db.settings.get('store_name'),
            window.electronAPI.db.settings.get('counter_id'),
            window.electronAPI.db.settings.get('store_address'),
            window.electronAPI.db.settings.get('store_phone'),
            window.electronAPI.db.settings.get('store_gstin'),
          ])
          setStoreInfo({
            storeName: name?.trim() || 'RETAILER POS STORE',
            counterId: counter?.trim() || 'Counter 01',
            storeAddress: addr?.trim() || '123 Market Street',
            storePhone: phone?.trim() || '+91 98765 43210',
            storeGstin: gstin?.trim() || '27AAAAA0000A1Z5',
          })
        } catch (err) {
          console.error('Failed to load store settings for invoice', err)
        }
      }
    }
    loadStoreSettings()
  }, [])

  // Partial payment collection state
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [collectAmount, setCollectAmount] = useState(
    invoice.amount_due ? invoice.amount_due.toString() : ''
  )
  const [collectMode, setCollectMode] = useState<'CASH' | 'UPI' | 'CARD'>('CASH')
  const [paymentNote, setPaymentNote] = useState('')
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  const handlePrint = async () => {
    try {
      if (window.electronAPI?.window?.print) {
        await window.electronAPI.window.print({ silent: false })
      } else {
        window.print()
      }
    } catch (err: any) {
      console.error('Print trigger failed:', err)
      window.print()
    }
  }

  const handleSavePDF = async () => {
    setIsSavingPDF(true)
    setPdfFeedback(null)
    try {
      if (window.electronAPI?.window?.saveAsPDF) {
        const res = await window.electronAPI.window.saveAsPDF({
          filename: invoice.invoice_no,
          layout: previewLayout,
        })
        if (res.success && res.filePath) {
          setPdfFeedback({ text: `PDF saved successfully to: ${res.filePath}`, type: 'success' })
        } else if (res.error) {
          setPdfFeedback({ text: `Failed to save PDF: ${res.error}`, type: 'error' })
        }
      } else {
        window.print()
      }
    } catch (err: any) {
      console.error('PDF export error:', err)
      setPdfFeedback({ text: err?.message || 'Error generating PDF invoice', type: 'error' })
    } finally {
      setIsSavingPDF(false)
    }
  }

  const handleCancelInvoice = async () => {
    if (!window.electronAPI?.db?.invoices) return
    setIsCancelling(true)
    setCancelError('')
    try {
      await window.electronAPI.db.invoices.cancel(
        invoice.id,
        cancelReason.trim() || 'Cashier voided invoice'
      )
      setShowCancelConfirm(false)
      if (onInvoiceCancelled) onInvoiceCancelled()
      onClose()
    } catch (err: any) {
      console.error('Cancel failed', err)
      setCancelError(err?.message || 'Failed to cancel invoice')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!window.electronAPI?.db?.invoices) return
    const amt = parseFloat(collectAmount)
    if (isNaN(amt) || amt <= 0) {
      setPaymentError('Enter a valid amount greater than 0')
      return
    }
    if (amt > invoice.amount_due) {
      setPaymentError(`Amount cannot exceed pending due of ₹${invoice.amount_due.toFixed(2)}`)
      return
    }

    setIsSubmittingPayment(true)
    setPaymentError('')
    try {
      await window.electronAPI.db.invoices.recordPayment({
        invoiceId: invoice.id,
        amount: amt,
        paymentMode: collectMode,
        notes: paymentNote.trim() || undefined,
      })
      setShowPaymentForm(false)
      if (onPaymentRecorded) onPaymentRecorded()
      onClose()
    } catch (err: any) {
      console.error('Record payment failed', err)
      setPaymentError(err?.message || 'Failed to record payment')
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  const isCancelled = invoice.status === 'CANCELLED'

  return (
    <div
      className="invoice-preview-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(12, 14, 18, 0.92)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
    >
      {/* Print CSS Rules dynamically tuned for Thermal vs A4 */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .invoice-preview-backdrop {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            background: none !important;
            padding: 0 !important;
            display: block !important;
            width: 100% !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${previewLayout === 'thermal' ? '320px' : '100%'} !important;
            margin: 0 ${previewLayout === 'thermal' ? 'auto' : '0'} !important;
            padding: ${previewLayout === 'thermal' ? '10px' : '1.5rem'} !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        style={{
          backgroundColor: '#15181E',
          border: '1px solid #262B36',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(245, 158, 11, 0.1)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Modal Top Bar */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #262B36',
            backgroundColor: '#1C2028',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F59E0B',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F1F3F5', margin: 0 }}>
                  Tax Invoice {invoice.invoice_no}
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor:
                      isCancelled
                        ? 'rgba(239, 68, 68, 0.2)'
                        : invoice.status === 'PAID'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(245, 158, 11, 0.2)',
                    color:
                      isCancelled
                        ? '#EF4444'
                        : invoice.status === 'PAID'
                        ? '#10B981'
                        : '#F59E0B',
                    border: `1px solid ${
                      isCancelled
                        ? 'rgba(239, 68, 68, 0.3)'
                        : invoice.status === 'PAID'
                        ? 'rgba(16, 185, 129, 0.3)'
                        : 'rgba(245, 158, 11, 0.3)'
                    }`,
                  }}
                >
                  {isCancelled ? 'VOIDED / CANCELLED' : invoice.status === 'PARTIALLY_PAID' ? 'BAKI PENDING' : invoice.status}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#9CA3AF' }}>
                Date: {invoice.created_at || invoice.date} &bull; Store: {storeInfo.storeName} ({storeInfo.counterId})
              </p>
            </div>
          </div>

          {/* Format Switcher Tabs & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Format toggle: Thermal Roll vs A4 */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#0C0E12',
                border: '1px solid #262B36',
                borderRadius: '8px',
                padding: '2px',
              }}
            >
              <button
                type="button"
                onClick={() => setPreviewLayout('thermal')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: previewLayout === 'thermal' ? '#F59E0B' : 'transparent',
                  color: previewLayout === 'thermal' ? '#000000' : '#9CA3AF',
                }}
              >
                <span>🧾</span> 80mm Thermal
              </button>
              <button
                type="button"
                onClick={() => setPreviewLayout('a4')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: previewLayout === 'a4' ? '#F59E0B' : 'transparent',
                  color: previewLayout === 'a4' ? '#000000' : '#9CA3AF',
                }}
              >
                <span>📄</span> Standard A4
              </button>
            </div>

            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#262B36',
                color: '#F9FAFB',
                border: '1px solid #374151',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print {previewLayout === 'thermal' ? 'Receipt' : 'A4'}
            </button>

            <button
              onClick={handleSavePDF}
              disabled={isSavingPDF}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#F59E0B',
                color: '#000000',
                border: 'none',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {isSavingPDF ? 'Exporting PDF...' : 'Save as PDF'}
            </button>

            {!isCancelled && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                Void
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#9CA3AF',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {/* Cancel Confirmation Prompt */}
          {showCancelConfirm && (
            <div
              className="no-print"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#EF4444', fontSize: '0.95rem' }}>
                Cancel Invoice #{invoice.invoice_no}?
              </h4>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#E5E7EB' }}>
                This will void the invoice, restore all sold quantities back into stock (logged as 'return' in
                stock history), and reverse any customer credit/baki. This cannot be undone.
              </p>
              <input
                type="text"
                placeholder="Reason for cancellation (e.g. Billing error, Customer return)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#0C0E12',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#F3F4F6',
                  fontSize: '0.85rem',
                  marginBottom: '0.75rem',
                }}
              />
              {cancelError && (
                <p style={{ color: '#EF4444', fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>{cancelError}</p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={isCancelling}
                  style={{
                    padding: '0.4rem 0.8rem',
                    backgroundColor: '#262B36',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#E5E7EB',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Keep Invoice
                </button>
                <button
                  onClick={handleCancelInvoice}
                  disabled={isCancelling}
                  style={{
                    padding: '0.4rem 0.8rem',
                    backgroundColor: '#EF4444',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isCancelling ? 'Voiding...' : 'Yes, Void Invoice'}
                </button>
              </div>
            </div>
          )}

          {/* Pending Due / Record Payment Section */}
          {!isCancelled && invoice.amount_due > 0 && (
            <div
              className="no-print"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#F59E0B', fontWeight: 700 }}>
                  Pending Baki / Due Balance
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FCD34D' }}>
                  ₹{invoice.amount_due.toFixed(2)}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                  Paid so far: ₹{(invoice.amount_paid || 0).toFixed(2)} of ₹{invoice.total.toFixed(2)}
                </span>
              </div>

              {!showPaymentForm ? (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  style={{
                    backgroundColor: '#F59E0B',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Collect Due Payment
                </button>
              ) : (
                <form
                  onSubmit={handleCollectPayment}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    width: '100%',
                    marginTop: '0.5rem',
                    borderTop: '1px solid rgba(245, 158, 11, 0.2)',
                    paddingTop: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 120px' }}>
                      <label style={{ fontSize: '0.75rem', color: '#9CA3AF', display: 'block' }}>Amount to Pay (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        max={invoice.amount_due}
                        value={collectAmount}
                        onChange={(e) => setCollectAmount(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.4rem 0.6rem',
                          backgroundColor: '#0C0E12',
                          border: '1px solid #374151',
                          borderRadius: '6px',
                          color: '#F9FAFB',
                          fontSize: '0.85rem',
                        }}
                      />
                    </div>
                    <div style={{ flex: '1 1 120px' }}>
                      <label style={{ fontSize: '0.75rem', color: '#9CA3AF', display: 'block' }}>Mode</label>
                      <select
                        value={collectMode}
                        onChange={(e) => setCollectMode(e.target.value as any)}
                        style={{
                          width: '100%',
                          padding: '0.4rem 0.6rem',
                          backgroundColor: '#0C0E12',
                          border: '1px solid #374151',
                          borderRadius: '6px',
                          color: '#F9FAFB',
                          fontSize: '0.85rem',
                        }}
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                      </select>
                    </div>
                    <div style={{ flex: '2 1 180px' }}>
                      <label style={{ fontSize: '0.75rem', color: '#9CA3AF', display: 'block' }}>Note (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. GPay ref #1234"
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.4rem 0.6rem',
                          backgroundColor: '#0C0E12',
                          border: '1px solid #374151',
                          borderRadius: '6px',
                          color: '#F9FAFB',
                          fontSize: '0.85rem',
                        }}
                      />
                    </div>
                  </div>
                  {paymentError && (
                    <div style={{ color: '#EF4444', fontSize: '0.8rem' }}>{paymentError}</div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        backgroundColor: '#262B36',
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        color: '#D1D5DB',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingPayment}
                      style={{
                        padding: '0.4rem 0.85rem',
                        backgroundColor: '#10B981',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      {isSubmittingPayment ? 'Saving...' : 'Record Payment'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* PDF Generation Feedback Banner */}
          {pdfFeedback && (
            <div
              className="no-print"
              style={{
                backgroundColor: pdfFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${pdfFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: pdfFeedback.type === 'success' ? '#10B981' : '#EF4444',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{pdfFeedback.type === 'success' ? '✅' : '⚠️'}</span>
                <span>{pdfFeedback.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setPdfFeedback(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Formatted Printable Content: Switches dynamically between Thermal (80mm) vs Standard A4 */}
          {previewLayout === 'thermal' ? (
            /* =================== 80mm POS Thermal Receipt Layout =================== */
            <div
              id="printable-receipt"
              style={{
                backgroundColor: '#FFFFFF',
                color: '#000000',
                borderRadius: '8px',
                padding: '1.5rem 1.25rem',
                maxWidth: '360px',
                margin: '0 auto',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                fontFamily: '"Courier New", Courier, monospace, monospace',
                fontSize: '0.8rem',
                lineHeight: 1.35,
              }}
            >
              {/* Thermal Store Header */}
              <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {storeInfo.storeName}
                </div>
                {storeInfo.storeAddress && (
                  <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>{storeInfo.storeAddress}</div>
                )}
                {storeInfo.storePhone && (
                  <div style={{ fontSize: '0.75rem' }}>Tel: {storeInfo.storePhone}</div>
                )}
                {storeInfo.storeGstin && (
                  <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>GSTIN: {storeInfo.storeGstin}</div>
                )}
                <div style={{ fontWeight: 800, fontSize: '0.85rem', marginTop: '4px', letterSpacing: '1px' }}>
                  *** {isCancelled ? 'VOIDED BILL' : 'CASH / TAX RECEIPT'} ***
                </div>
              </div>

              {/* Dashed separator */}
              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

              {/* Receipt Metadata */}
              <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Bill No: <strong>{invoice.invoice_no}</strong></span>
                  <span>Terminal: {storeInfo.counterId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Date: {invoice.created_at || invoice.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Customer: <strong>{invoice.customer_name || 'Walk-in'}</strong></span>
                  <span>Pay: {invoice.payment_mode}</span>
                </div>
              </div>

              {/* Dashed separator */}
              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

              {/* Line Items Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <span>Item [Qty x Price]</span>
                <span>Total (₹)</span>
              </div>
              <div style={{ borderTop: '1px solid #000', margin: '4px 0 6px 0' }} />

              {/* Line Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(invoice.items || []).map((item, idx) => (
                  <div key={idx}>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {idx + 1}. {item.product_name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#111' }}>
                      <span>
                        &nbsp;&nbsp;{item.qty} {item.unit || ''} x ₹{item.unit_price.toFixed(2)}
                        {(item.gst_rate ?? 0) > 0 ? ` [${item.gst_rate}% GST]` : ''}
                      </span>
                      <span style={{ fontWeight: 700 }}>₹{item.line_total.toFixed(2)}</span>
                    </div>
                    {(item.discount_amount ?? 0) > 0 && (
                      <div style={{ fontSize: '0.7rem', color: '#333', textAlign: 'right' }}>
                        (Disc: -₹{(item.discount_amount ?? 0).toFixed(2)})
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Dashed separator */}
              <div style={{ borderTop: '1px dashed #000', margin: '8px 0 6px 0' }} />

              {/* Totals Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span>₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Discount:</span>
                    <span>-₹{invoice.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                {invoice.cgst_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>CGST:</span>
                    <span>₹{invoice.cgst_amount.toFixed(2)}</span>
                  </div>
                )}
                {invoice.sgst_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>SGST:</span>
                    <span>₹{invoice.sgst_amount.toFixed(2)}</span>
                  </div>
                )}
                {invoice.round_off !== 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Round-off:</span>
                    <span>{invoice.round_off > 0 ? `+₹${invoice.round_off.toFixed(2)}` : `-₹${Math.abs(invoice.round_off).toFixed(2)}`}</span>
                  </div>
                )}

                {/* Double / Thick line separator for grand total */}
                <div style={{ borderTop: '2px solid #000', margin: '4px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 900 }}>
                  <span>GRAND TOTAL:</span>
                  <span>₹{invoice.total.toFixed(2)}</span>
                </div>

                <div style={{ borderTop: '1px solid #000', margin: '4px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Paid [{invoice.payment_mode}]:</span>
                  <span>₹{(invoice.amount_paid || 0).toFixed(2)}</span>
                </div>

                {invoice.amount_due > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: '#DC2626' }}>
                    <span>BAKI / DUE:</span>
                    <span>₹{invoice.amount_due.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Dashed separator */}
              <div style={{ borderTop: '1px dashed #000', margin: '10px 0 6px 0' }} />

              {/* Footer */}
              <div style={{ textAlign: 'center', fontSize: '0.72rem', marginTop: '6px' }}>
                <div style={{ fontWeight: 800 }}>*** THANK YOU! VISIT AGAIN ***</div>
                <div>Goods once sold will not be returned.</div>
                <div style={{ marginTop: '4px', letterSpacing: '2px', fontSize: '0.7rem' }}>
                  ||||| | ||||| ||| ||||||| |||
                </div>
              </div>
            </div>
          ) : (
            /* =================== Full Standard A4 GST Invoice Layout =================== */
            <div
              id="printable-receipt"
              style={{
                backgroundColor: '#FFFFFF',
                color: '#111827',
                borderRadius: '10px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              {/* Store Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111827', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
                    {storeInfo.storeName}
                  </h1>
                  <div style={{ fontSize: '0.85rem', color: '#4B5563' }}>
                    {storeInfo.storeAddress} &bull; Terminal {storeInfo.counterId} {storeInfo.storePhone ? `• Tel: ${storeInfo.storePhone}` : ''}
                  </div>
                  {storeInfo.storeGstin && (
                    <div style={{ fontSize: '0.85rem', color: '#4B5563' }}>
                      <strong>GSTIN:</strong> {storeInfo.storeGstin}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#111827',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      padding: '3px 10px',
                      borderRadius: '4px',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    TAX INVOICE
                  </span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827' }}>
                    {invoice.invoice_no}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#4B5563' }}>
                    {invoice.created_at || invoice.date}
                  </div>
                </div>
              </div>

              {/* Bill Meta & Customer Info */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                  backgroundColor: '#F9FAFB',
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: '#6B7280', marginBottom: '2px' }}>
                    Customer Details
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
                    {invoice.customer_name || 'Walk-in Customer'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: '#6B7280', marginBottom: '2px' }}>
                    Payment Details
                  </div>
                  <div><strong>Payment Mode:</strong> {invoice.payment_mode}</div>
                  <div>
                    <strong>Status:</strong>{' '}
                    <span style={{ fontWeight: 700, color: isCancelled ? '#EF4444' : invoice.status === 'PAID' ? '#059669' : '#D97706' }}>
                      {isCancelled ? 'VOIDED' : invoice.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized Table With Prominent SKU Column */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #111827', backgroundColor: '#F3F4F6', textAlign: 'left' }}>
                    <th style={{ padding: '8px 6px', width: '30px', textAlign: 'center' }}>#</th>
                    <th style={{ padding: '8px 6px' }}>Product Description</th>
                    <th style={{ padding: '8px 6px', width: '120px' }}>SKU / Barcode</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center', width: '70px' }}>Qty</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right', width: '80px' }}>Rate (₹)</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right', width: '75px' }}>Disc (₹)</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right', width: '65px' }}>GST%</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right', width: '90px' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '8px 6px', textAlign: 'center', color: '#6B7280' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '8px 6px' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{item.product_name}</div>
                      </td>
                      <td style={{ padding: '8px 6px' }}>
                        {item.sku ? (
                          <span
                            style={{
                              fontFamily: 'monospace',
                              backgroundColor: '#E5E7EB',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: '#1F2937',
                            }}
                          >
                            {item.sku}
                          </span>
                        ) : (
                          <span style={{ color: '#9CA3AF' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 600 }}>
                        {item.qty} {item.unit || ''}
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'right' }}>₹{item.unit_price.toFixed(2)}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', color: (item.discount_amount ?? 0) > 0 ? '#059669' : '#6B7280' }}>
                        {(item.discount_amount ?? 0) > 0 ? `₹${(item.discount_amount ?? 0).toFixed(2)}` : '-'}
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'right' }}>{item.gst_rate}%</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700 }}>
                        ₹{item.line_total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Statutory GST HSN/SAC-wise Breakdown Table */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#1F2937', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  HSN / SAC Wise Tax Breakup (CGST + SGST)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', border: '1px solid #E5E7EB' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '1px solid #D1D5DB', textAlign: 'left' }}>
                      <th style={{ padding: '6px 8px' }}>HSN / SAC</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Taxable Value (₹)</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>CGST Rate</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>CGST Amt (₹)</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>SGST Rate</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>SGST Amt (₹)</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Total Tax (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hsnBreakdown.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 600, color: '#111827' }}>
                          {row.hsnCode}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>₹{row.taxableValue.toFixed(2)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{row.cgstRate}%</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>₹{row.cgstAmount.toFixed(2)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{row.sgstRate}%</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>₹{row.sgstAmount.toFixed(2)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#111827' }}>
                          ₹{row.totalTax.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {/* HSN Summary Totals */}
                    <tr style={{ backgroundColor: '#F9FAFB', fontWeight: 700, borderTop: '1px solid #D1D5DB' }}>
                      <td style={{ padding: '6px 8px' }}>Total</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                        ₹{hsnBreakdown.reduce((sum, r) => sum + r.taxableValue, 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>-</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                        ₹{hsnBreakdown.reduce((sum, r) => sum + r.cgstAmount, 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>-</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                        ₹{hsnBreakdown.reduce((sum, r) => sum + r.sgstAmount, 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                        ₹{hsnBreakdown.reduce((sum, r) => sum + r.totalTax, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bill Summary Calculations */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E5E7EB', paddingTop: '0.75rem' }}>
                <div style={{ width: '280px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span style={{ color: '#4B5563' }}>Subtotal:</span>
                    <span>₹{invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.discount_amount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#059669', fontWeight: 600 }}>
                      <span>Overall Discount:</span>
                      <span>-₹{invoice.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.cgst_amount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#4B5563' }}>
                      <span>CGST:</span>
                      <span>₹{invoice.cgst_amount.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.sgst_amount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#4B5563' }}>
                      <span>SGST:</span>
                      <span>₹{invoice.sgst_amount.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.round_off !== 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#4B5563' }}>
                      <span>Round-off:</span>
                      <span>{invoice.round_off > 0 ? `+₹${invoice.round_off.toFixed(2)}` : `-₹${Math.abs(invoice.round_off).toFixed(2)}`}</span>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0 4px 0',
                      borderTop: '2px solid #111827',
                      marginTop: '6px',
                      fontSize: '1.15rem',
                      fontWeight: 800,
                    }}
                  >
                    <span>Grand Total:</span>
                    <span>₹{invoice.total.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', marginTop: '6px', borderTop: '1px dashed #D1D5DB' }}>
                    <span>Amount Paid:</span>
                    <span style={{ fontWeight: 700 }}>₹{(invoice.amount_paid || 0).toFixed(2)}</span>
                  </div>
                  {invoice.amount_due > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#DC2626', fontWeight: 800 }}>
                      <span>Baki / Pending Due:</span>
                      <span>₹{invoice.amount_due.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Receipt Footer */}
              <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #D1D5DB', fontSize: '0.75rem', color: '#6B7280' }}>
                <div style={{ fontWeight: 600, color: '#374151' }}>Thank you for shopping with us!</div>
                <div>This is a computer-generated invoice and does not require physical signature.</div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div
          className="no-print"
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #262B36',
            backgroundColor: '#1C2028',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handlePrint}
              style={{
                padding: '0.5rem 1.1rem',
                backgroundColor: '#262B36',
                color: '#F9FAFB',
                border: '1px solid #374151',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print ({previewLayout === 'thermal' ? 'Thermal 80mm' : 'A4'})
            </button>

            <button
              onClick={handleSavePDF}
              disabled={isSavingPDF}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: '#F59E0B',
                color: '#000000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {isSavingPDF ? 'Generating...' : `Save as PDF (${previewLayout === 'thermal' ? 'Thermal' : 'A4'})`}
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: '#262B36',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F3F4F6',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  )
}

