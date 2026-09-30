import React, { useState, useEffect } from 'react'
import { HeldBill } from '../vite-env'

interface HeldBillsModalProps {
  onClose: () => void
  onResumeBill: (heldBill: HeldBill) => void
}

export const HeldBillsModal: React.FC<HeldBillsModalProps> = ({ onClose, onResumeBill }) => {
  const [heldBills, setHeldBills] = useState<HeldBill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadHeldBills = async () => {
    setLoading(true)
    setError(null)
    try {
      if (window.electronAPI?.db?.heldBills) {
        const list = await window.electronAPI.db.heldBills.getAll()
        setHeldBills(list)
      }
    } catch (err: any) {
      console.error('Failed to load held bills', err)
      setError(err?.message || 'Could not fetch held bills')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHeldBills()
  }, [])

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.electronAPI?.db?.heldBills) return
    if (!window.confirm('Are you sure you want to discard this held bill?')) return
    try {
      await window.electronAPI.db.heldBills.delete(id)
      setHeldBills((prev) => prev.filter((b) => b.id !== id))
    } catch (err: any) {
      console.error('Delete held bill failed', err)
      setError(err?.message || 'Failed to delete held bill')
    }
  }

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
        zIndex: 9999,
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#15181E',
          border: '1px solid #262B36',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '650px',
          maxHeight: '85vh',
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #262B36',
            backgroundColor: '#1C2028',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3B82F6',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#F1F3F5', margin: 0 }}>
                Held Bills ({heldBills.length})
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#9CA3AF' }}>
                Select a held bill to resume checkout on the billing screen
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

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: '#EF4444',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>Loading held bills...</div>
          ) : heldBills.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#6B7280' }}>
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ margin: '0 auto 0.75rem auto', opacity: 0.6 }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8" />
              </svg>
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#E5E7EB', fontSize: '1rem' }}>No Held Bills</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Use <kbd style={{ backgroundColor: '#262B36', padding: '2px 6px', borderRadius: '4px' }}>Ctrl+H</kbd> to
                hold an in-progress cart anytime.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {heldBills.map((b) => {
                let itemsCount = 0
                let billAmount = 0
                try {
                  const parsed = JSON.parse(b.cart_json)
                  const items = Array.isArray(parsed) ? parsed : (parsed.items || parsed.cart || [])
                  itemsCount = items.length
                  billAmount = items.reduce(
                    (sum: number, it: any) => sum + (Number(it.unitPrice || it.price) || 0) * (Number(it.qty) || 1),
                    0
                  )
                } catch (e) {
                  // ignore
                }

                return (
                  <div
                    key={b.id}
                    onClick={() => onResumeBill(b)}
                    style={{
                      backgroundColor: '#1C2028',
                      border: '1px solid #262B36',
                      borderRadius: '10px',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#F59E0B'
                      e.currentTarget.style.backgroundColor = '#222732'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#262B36'
                      e.currentTarget.style.backgroundColor = '#1C2028'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: '#F3F4F6', fontSize: '0.95rem' }}>
                          {b.bill_label || b.customer_name || 'Walk-in Customer'}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            backgroundColor: '#262B36',
                            color: '#9CA3AF',
                            padding: '2px 8px',
                            borderRadius: '10px',
                          }}
                        >
                          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Held at {b.created_at}</span>
                      {b.notes && (
                        <span style={{ fontSize: '0.8rem', color: '#D97706', fontStyle: 'italic' }}>
                          Note: {b.notes}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F59E0B' }}>
                          ₹{billAmount.toFixed(2)}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#10B981' }}>Click to Resume</span>
                      </div>

                      <button
                        onClick={(e) => handleDelete(b.id, e)}
                        title="Discard held bill"
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: '8px',
                          color: '#EF4444',
                          width: '34px',
                          height: '34px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            borderTop: '1px solid #262B36',
            backgroundColor: '#1C2028',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '0.45rem 1rem',
              backgroundColor: '#262B36',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F3F4F6',
              fontSize: '0.85rem',
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
