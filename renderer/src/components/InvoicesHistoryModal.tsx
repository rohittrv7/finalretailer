import React, { useState, useEffect } from 'react'
import { Invoice } from '../vite-env'

interface InvoicesHistoryModalProps {
  onClose: () => void
  onSelectInvoice: (invoiceId: number) => void
}

export const InvoicesHistoryModal: React.FC<InvoicesHistoryModalProps> = ({
  onClose,
  onSelectInvoice,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const loadInvoices = async () => {
    setLoading(true)
    try {
      if (window.electronAPI?.db?.invoices) {
        const list = await window.electronAPI.db.invoices.getAll({
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        })
        setInvoices(list)
      }
    } catch (err) {
      console.error('Failed to load invoices', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [search, statusFilter])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(12, 14, 18, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9990,
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#15181E',
          border: '1px solid #262B36',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #262B36',
            backgroundColor: '#1C2028',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#F9FAFB' }}>
                Invoice History & Receipts (PDF)
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#9CA3AF' }}>
                Search past bills, view itemized SKUs, and export/print PDF invoices
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '6px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search & Filters */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #262B36',
            backgroundColor: '#11141A',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ flex: '1 1 260px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by invoice number (e.g. INV-000001) or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem',
                backgroundColor: '#0C0E12',
                border: '1px solid #262B36',
                borderRadius: '8px',
                color: '#F9FAFB',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['ALL', 'PAID', 'PARTIALLY_PAID', 'UNPAID', 'CANCELLED'].map((st) => {
              const active = statusFilter === st
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    backgroundColor: active ? '#F59E0B' : '#1C2028',
                    color: active ? '#000000' : '#D1D5DB',
                    border: `1px solid ${active ? '#F59E0B' : '#262B36'}`,
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {st === 'ALL'
                    ? 'All'
                    : st === 'PARTIALLY_PAID'
                    ? 'Baki / Partial'
                    : st === 'UNPAID'
                    ? 'Credit / Unpaid'
                    : st}
                </button>
              )
            })}
          </div>
        </div>

        {/* Invoices Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#6B7280' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#E5E7EB', fontSize: '1.05rem' }}>No Invoices Found</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Completed retail sales will appear here with full SKU details and PDF print options.
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: '#11141A',
                    borderBottom: '1px solid #262B36',
                    color: '#9CA3AF',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  <th style={{ padding: '0.75rem 1rem' }}>Invoice No</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date & Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Mode</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total (₹)</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Paid / Baki</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const isCancelled = inv.status === 'CANCELLED'
                  return (
                    <tr
                      key={inv.id}
                      style={{
                        borderBottom: '1px solid #1C2028',
                        backgroundColor: isCancelled ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1C2028')}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = isCancelled
                          ? 'rgba(239, 68, 68, 0.04)'
                          : 'transparent')
                      }
                    >
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#F9FAFB' }}>
                        {inv.invoice_no}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#9CA3AF', fontSize: '0.8rem' }}>
                        {inv.date || inv.created_at}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#E5E7EB' }}>
                        {inv.customer_name || 'Walk-in'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#9CA3AF', fontSize: '0.8rem' }}>
                        {inv.payment_mode}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#F9FAFB' }}>
                        ₹{inv.total.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ color: '#10B981', fontWeight: 600 }}>
                          ₹{(inv.amount_paid || 0).toFixed(2)}
                        </div>
                        {inv.amount_due > 0 && (
                          <div style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 600 }}>
                            Due: ₹{inv.amount_due.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor:
                              isCancelled
                                ? 'rgba(239, 68, 68, 0.15)'
                                : inv.status === 'PAID'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                            color:
                              isCancelled
                                ? '#EF4444'
                                : inv.status === 'PAID'
                                ? '#10B981'
                                : '#F59E0B',
                            border: `1px solid ${
                              isCancelled
                                ? 'rgba(239, 68, 68, 0.3)'
                                : inv.status === 'PAID'
                                ? 'rgba(16, 185, 129, 0.3)'
                                : 'rgba(245, 158, 11, 0.3)'
                            }`,
                          }}
                        >
                          {isCancelled
                            ? 'VOIDED'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'BAKI'
                            : inv.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            onSelectInvoice(inv.id)
                            onClose()
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            backgroundColor: '#262B36',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            padding: '0.35rem 0.7rem',
                            color: '#F59E0B',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          View PDF
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid #262B36',
            backgroundColor: '#1C2028',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.82rem',
            color: '#9CA3AF',
          }}
        >
          <span>Showing {invoices.length} invoices</span>
          <button
            onClick={onClose}
            style={{
              padding: '0.45rem 1rem',
              backgroundColor: '#262B36',
              border: '1px solid #374151',
              borderRadius: '6px',
              color: '#F9FAFB',
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
