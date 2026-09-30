import React, { useState, useEffect, useRef } from 'react'
import { Product, Category } from '../vite-env'
import { generateBarcodeNumber, renderBarcodeToSvg } from '../utils/barcodeUtils'

interface QuickAddProductModalProps {
  initialSearchQuery?: string
  onClose: () => void
  onProductCreated: (product: Product) => void
}

export const QuickAddProductModal: React.FC<QuickAddProductModalProps> = ({
  initialSearchQuery = '',
  onClose,
  onProductCreated,
}) => {
  const isSkuLike = /^[A-Za-z0-9_-]{4,20}$/.test(initialSearchQuery.trim())
  const [name, setName] = useState(isSkuLike ? '' : initialSearchQuery)
  const [sku, setSku] = useState(isSkuLike ? initialSearchQuery : '')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [stockQty, setStockQty] = useState('10')
  const [unit, setUnit] = useState('pcs')
  const [gstRate, setGstRate] = useState<number>(5)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const barcodeSvgRef = useRef<SVGSVGElement>(null)

  const handleGenerateBarcode = async () => {
    let existingSkus: string[] = []
    if (window.electronAPI?.db?.products) {
      try {
        const all = await window.electronAPI.db.products.getAll()
        existingSkus = all.map((p) => p.sku).filter(Boolean) as string[]
      } catch {}
    }
    const newBarcode = generateBarcodeNumber(existingSkus)
    setSku(newBarcode)
  }

  // Render live scannable barcode SVG whenever sku changes
  useEffect(() => {
    if (barcodeSvgRef.current && sku.trim()) {
      renderBarcodeToSvg(barcodeSvgRef.current, sku.trim(), {
        height: 34,
        fontSize: 10,
        displayValue: true,
      })
    }
  }, [sku])

  // Fetch real categories from database
  useEffect(() => {
    const loadCategories = async () => {
      if (window.electronAPI?.db?.categories) {
        try {
          const list = await window.electronAPI.db.categories.getAll()
          setCategories(list)
          if (list.length > 0) {
            setSelectedCategoryId(list[0].id.toString())
          }
        } catch (err) {
          console.error('Failed to load categories in QuickAddProductModal', err)
        }
      }
    }
    loadCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Product name is required')
      return
    }
    const priceNum = parseFloat(sellingPrice)
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Enter a valid selling price')
      return
    }
    const stockNum = parseFloat(stockQty)
    if (isNaN(stockNum) || stockNum < 0) {
      setError('Enter a valid initial stock quantity')
      return
    }

    if (!window.electronAPI?.db?.products) return
    setIsSubmitting(true)
    setError(null)

    const selectedCat = categories.find((c) => c.id.toString() === selectedCategoryId)

    try {
      const created = await window.electronAPI.db.products.create({
        name: name.trim(),
        sku: sku.trim() || undefined,
        category: selectedCat ? selectedCat.name : (categories[0]?.name || 'General'),
        category_id: selectedCat ? selectedCat.id : undefined,
        selling_price: priceNum,
        mrp: priceNum,
        stock_qty: stockNum,
        unit: unit.trim() || 'pcs',
        gst_rate: gstRate,
      })
      onProductCreated(created)
      onClose()
    } catch (err: any) {
      console.error('Failed to create product', err)
      setError(err?.message || 'Error creating product')
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
          maxWidth: '520px',
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
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F1F3F5', margin: 0 }}>
                Quick Add Product
              </h3>
              <p style={{ margin: '1px 0 0 0', fontSize: '0.75rem', color: '#9CA3AF' }}>
                Item will be immediately added to the current bill
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
              padding: '0.3rem',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                color: '#EF4444',
                fontSize: '0.82rem',
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#D1D5DB', marginBottom: '0.3rem' }}>
              Product Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Parle-G Biscuit 250g"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                backgroundColor: '#0C0E12',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB',
                fontSize: '0.875rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#D1D5DB', marginBottom: '0.3rem' }}>
              Category
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                backgroundColor: '#0C0E12',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              {categories.length === 0 ? (
                <option value="">General</option>
              ) : (
                categories.map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#D1D5DB' }}>
                  Barcode / SKU
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#F59E0B',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  ⚡ Generate
                </button>
              </div>
              <input
                type="text"
                placeholder="Scan or type barcode"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#0C0E12',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB',
                  fontSize: '0.875rem',
                }}
              />
              {sku.trim() && (
                <div
                  style={{
                    marginTop: '0.35rem',
                    backgroundColor: '#FFFFFF',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '38px',
                  }}
                >
                  <svg ref={barcodeSvgRef} style={{ width: '100%', height: '36px' }} />
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#D1D5DB', marginBottom: '0.3rem' }}>
                Selling Price (₹) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#0C0E12',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#D1D5DB', marginBottom: '0.3rem' }}>
                Initial Stock Qty
              </label>
              <input
                type="number"
                step="1"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#0C0E12',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#D1D5DB', marginBottom: '0.3rem' }}>
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.5rem',
                  backgroundColor: '#0C0E12',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB',
                  fontSize: '0.875rem',
                }}
              >
                <option value="pcs">pcs</option>
                <option value="kg">kg</option>
                <option value="gm">gm</option>
                <option value="litre">litre</option>
                <option value="ml">ml</option>
                <option value="box">box</option>
                <option value="packet">packet</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#D1D5DB', marginBottom: '0.3rem' }}>
                GST Rate
              </label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.5rem',
                  backgroundColor: '#0C0E12',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB',
                  fontSize: '0.875rem',
                }}
              >
                <option value={0}>0%</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>
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
                backgroundColor: '#10B981',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {isSubmitting ? 'Saving...' : 'Add & Bill Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
