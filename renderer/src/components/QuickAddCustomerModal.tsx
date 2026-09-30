import React, { useState } from 'react'
import { Customer } from '../vite-env'

interface QuickAddCustomerModalProps {
  initialPhoneOrName?: string
  onClose: () => void
  onCustomerAdded: (customer: Customer) => void
}

export const QuickAddCustomerModal: React.FC<QuickAddCustomerModalProps> = ({
  initialPhoneOrName = '',
  onClose,
  onCustomerAdded,
}) => {
  const isNumeric = /^\d+$/.test(initialPhoneOrName.trim())
  const [name, setName] = useState(isNumeric ? '' : initialPhoneOrName)
  const [phone, setPhone] = useState(isNumeric ? initialPhoneOrName : '')
  const [gstin, setGstin] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Customer name is required')
      return
    }

    if (!window.electronAPI?.db?.customers) return
    setIsSubmitting(true)
    setError(null)

    try {
      const newCustomer = await window.electronAPI.db.customers.create({
        name: name.trim(),
        phone: phone.trim() || undefined,
        gstin: gstin.trim().toUpperCase() || undefined,
        credit_balance: 0,
      })
      onCustomerAdded(newCustomer)
      onClose()
    } catch (err: any) {
      console.error('Failed to create customer', err)
      setError(err?.message || 'Error creating customer')
    } finally {
      setIsSubmitting(false)
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
          maxWidth: '460px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F59E0B',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7.5" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F1F3F5', margin: 0 }}>
              Quick Add Customer
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              padding: '0.3rem',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '0.6rem 0.8rem',
                color: '#EF4444',
                fontSize: '0.82rem',
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#D1D5DB', marginBottom: '0.35rem' }}>
              Full Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                backgroundColor: '#0C0E12',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#D1D5DB', marginBottom: '0.35rem' }}>
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                backgroundColor: '#0C0E12',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#D1D5DB', marginBottom: '0.35rem' }}>
              GSTIN (Optional)
            </label>
            <input
              type="text"
              placeholder="15-character GSTIN"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                backgroundColor: '#0C0E12',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#262B36',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#E5E7EB',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: '#F59E0B',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {isSubmitting ? 'Saving...' : 'Add & Select Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
