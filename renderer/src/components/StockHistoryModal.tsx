import React, { useState, useEffect } from 'react'
import { StockHistoryEntry, Product } from '../vite-env'

interface StockHistoryModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export const StockHistoryModal: React.FC<StockHistoryModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const [history, setHistory] = useState<StockHistoryEntry[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const loadHistory = async () => {
    if (!window.electronAPI?.db?.stock) return
    try {
      setLoading(true)
      const data = await window.electronAPI.db.stock.getHistory(product?.id, 100)
      setHistory(data)
    } catch (err) {
      console.error('Failed to load stock history', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen, product])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#15181E] border border-[#262B36] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-scale-up select-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262B36] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-base">
              📜
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F3F4F6]">
                {product ? `Stock Ledger: ${product.name}` : 'Store Stock Movement Ledger'}
              </h3>
              <p className="text-[11px] text-[#9CA3AF]">
                Complete audit trail of sales, returns, shipments, and manual corrections.
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

        {/* Ledger Table */}
        <div className="bg-[#0C0E12] border border-[#262B36] rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1C2028] text-[#9CA3AF] uppercase tracking-wider font-bold border-b border-[#262B36] sticky top-0">
              <tr>
                <th className="p-3">Date / Time</th>
                {!product && <th className="p-3">Product</th>}
                <th className="p-3">Reason</th>
                <th className="p-3 text-right">Change</th>
                <th className="p-3 text-right">Balance</th>
                <th className="p-3">Reference / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262B36]">
              {loading ? (
                <tr>
                  <td colSpan={product ? 5 : 6} className="p-8 text-center text-[#9CA3AF]">
                    Loading stock ledger...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={product ? 5 : 6} className="p-8 text-center text-[#9CA3AF]">
                    No stock movements recorded yet
                  </td>
                </tr>
              ) : (
                history.map((entry) => {
                  const isPositive = entry.change_qty > 0

                  let badgeColor = 'bg-[#1C2028] text-[#9CA3AF] border-[#262B36]'
                  if (entry.reason === 'sale') {
                    badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20'
                  } else if (entry.reason === 'return') {
                    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  } else if (entry.reason === 'restock') {
                    badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }

                  return (
                    <tr key={entry.id} className="hover:bg-[#15181E] transition-colors">
                      <td className="p-3 font-mono text-[11px] text-[#9CA3AF]">
                        {entry.created_at}
                      </td>
                      {!product && (
                        <td className="p-3 font-semibold text-[#F3F4F6] truncate max-w-[140px]">
                          {entry.product_name}
                        </td>
                      )}
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}>
                          {entry.reason}
                        </span>
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? `+${entry.change_qty}` : entry.change_qty}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#F3F4F6]">
                        {entry.balance_qty}
                      </td>
                      <td className="p-3 text-[11px] text-[#9CA3AF] truncate max-w-[180px]">
                        {entry.notes || entry.reference_id || '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#262B36]">
          <span className="text-[11px] text-[#64748B]">Showing up to last 100 stock events</span>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
