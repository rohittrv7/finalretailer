import React, { useState, useEffect } from 'react'
import { Product } from '../vite-env'

interface StockAdjustModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedProduct: Product) => void
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'restock' | 'manual-adjustment'>('restock')
  const [qtyInput, setQtyInput] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setQtyInput('')
      setNotes('')
      setError(null)
      setMode('restock')
    }
  }, [isOpen])

  if (!isOpen || !product) return null

  const parsedQty = parseFloat(qtyInput) || 0
  const changeQty = mode === 'restock' ? Math.abs(parsedQty) : parsedQty
  const newBalance = product.stock_qty + changeQty

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qtyInput || parsedQty === 0) {
      setError('Please enter a non-zero quantity')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const updated = await window.electronAPI!.db.stock.adjust({
        productId: product.id,
        changeQty,
        reason: mode,
        notes: notes.trim() || (mode === 'restock' ? 'Stock restock entry' : 'Manual stock count adjustment'),
      })
      onSuccess(updated)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Stock adjustment failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#15181E] border border-[#262B36] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up select-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262B36] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-base">
              📦
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F3F4F6]">Stock Restock & Adjustment</h3>
              <p className="text-[11px] text-[#9CA3AF]">
                Log changes into the permanent stock audit ledger.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#1C2028] text-[#9CA3AF] hover:text-[#F3F4F6] flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Product Snapshot */}
        <div className="p-3.5 rounded-2xl bg-[#0C0E12] border border-[#262B36] space-y-1">
          <div className="font-bold text-xs text-[#F3F4F6]">{product.name}</div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-[#9CA3AF]">{product.sku || 'No Barcode'}</span>
            <span className="font-mono">
              Current Stock:{' '}
              <strong className="text-amber-400">
                {product.stock_qty} {product.unit}
              </strong>
            </span>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Adjustment Mode Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('restock')}
              className={`h-9 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                mode === 'restock'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                  : 'bg-[#1C2028] text-[#9CA3AF] border-[#262B36]'
              }`}
            >
              + Restock (Shipment)
            </button>
            <button
              type="button"
              onClick={() => setMode('manual-adjustment')}
              className={`h-9 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                mode === 'manual-adjustment'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                  : 'bg-[#1C2028] text-[#9CA3AF] border-[#262B36]'
              }`}
            >
              ± Manual Correction
            </button>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-[11px] font-semibold text-[#9CA3AF] mb-1">
              {mode === 'restock'
                ? 'Units to Add to Stock (+)'
                : 'Quantity Change (+ for excess, - for damage/spoilage)'}
            </label>
            <input
              type="number"
              step="1"
              required
              autoFocus
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              placeholder={mode === 'restock' ? 'e.g. 50' : 'e.g. -2 or 5'}
              className="w-full h-10 px-3 rounded-xl bg-[#0C0E12] border border-[#262B36] font-mono text-sm text-[#F3F4F6] focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* New Balance Preview Banner */}
          <div className="p-3 rounded-xl bg-[#1C2028] border border-[#262B36] flex items-center justify-between text-xs">
            <span className="text-[#9CA3AF]">Projected Balance:</span>
            <span
              className={`font-mono font-bold text-sm ${
                newBalance < 0
                  ? 'text-red-400'
                  : newBalance <= product.low_stock_threshold
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {newBalance} {product.unit}
            </span>
          </div>

          {/* Notes / Reason */}
          <div>
            <label className="block text-[11px] font-semibold text-[#9CA3AF] mb-1">
              Audit Note / Supplier Reference (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Invoice #PO-982 or Physical shelf count"
              className="w-full h-10 px-3 rounded-xl bg-[#0C0E12] border border-[#262B36] text-xs text-[#F3F4F6] focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-[#262B36]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl bg-[#1C2028] hover:bg-[#262B36] text-[#9CA3AF] font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-xs text-black transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Record Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
