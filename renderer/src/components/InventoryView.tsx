import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Product, NewProduct, Category } from '../vite-env'
import { AddEditProductModal } from './AddEditProductModal'
import { DeleteProductModal } from './DeleteProductModal'
import { CategoryModal } from './CategoryModal'
import { StockAdjustModal } from './StockAdjustModal'
import { StockHistoryModal } from './StockHistoryModal'
import { BarcodeLabelModal } from './BarcodeLabelModal'

interface InventoryViewProps {
  initialSearchQuery?: string
}

type SortField =
  | 'name'
  | 'sku'
  | 'category'
  | 'selling_price'
  | 'mrp'
  | 'stock_qty'
  | 'purchase_price'
  | 'gst_rate'

type SortOrder = 'asc' | 'desc'
type StockFilter = 'all' | 'low' | 'out'

export const InventoryView: React.FC<InventoryViewProps> = ({ initialSearchQuery = '' }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')

  // Sorting
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState<boolean>(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false)

  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null)

  const [historyProduct, setHistoryProduct] = useState<Product | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false)

  const [barcodeLabelProduct, setBarcodeLabelProduct] = useState<Product | null>(null)

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Load products and categories from SQLite
  const loadData = async () => {
    if (!window.electronAPI?.db) return
    try {
      setLoading(true)
      const [pData, cData] = await Promise.all([
        window.electronAPI.db.products.getAll(),
        window.electronAPI.db.categories.getAll(),
      ])
      setProducts(pData)
      setCategories(cData)
    } catch (err) {
      console.error('Failed to load inventory data', err)
      showToast('Error loading products from database')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery)
    }
  }, [initialSearchQuery])

  // Keyboard shortcuts: F2 for Add Product, / for Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        setEditingProduct(null)
        setIsAddEditOpen(true)
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Barcode scanner integration in search box:
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = searchQuery.trim().toLowerCase()
      if (!trimmed) return

      const exactMatch = products.find(
        (p) => p.sku && p.sku.toLowerCase() === trimmed
      )
      if (exactMatch) {
        showToast(`Barcode matched: ${exactMatch.name} (Stock: ${exactMatch.stock_qty} ${exactMatch.unit})`)
      }
    }
  }

  // Save Product (Create or Update)
  const handleSaveProduct = async (data: NewProduct, id?: number) => {
    if (!window.electronAPI?.db) return

    if (id) {
      await window.electronAPI.db.products.update(id, data)
      showToast(`Product "${data.name}" updated successfully!`)
    } else {
      await window.electronAPI.db.products.create(data)
      showToast(`Product "${data.name}" added to inventory!`)
    }
    await loadData()
  }

  // Delete product handler
  const handleConfirmDelete = async () => {
    if (!deleteProduct || !window.electronAPI?.db) return
    setIsDeleting(true)
    try {
      await window.electronAPI.db.products.delete(deleteProduct.id)
      showToast(`"${deleteProduct.name}" removed from inventory`)
      setDeleteProduct(null)
      await loadData()
    } catch (err) {
      console.error('Delete failed', err)
      showToast('Failed to delete product')
    } finally {
      setIsDeleting(false)
    }
  }

  // Fast inline stock adjustment (+1 or -1 with transactional ledger log)
  // const handleInlineStock = async (product: Product, delta: number) => {
  //   if (!window.electronAPI?.db?.stock) return
  //   try {
  //     const updated = await window.electronAPI.db.stock.adjust({
  //       productId: product.id,
  //       changeQty: delta,
  //       reason: 'manual-adjustment',
  //       notes: `Quick inline ${delta > 0 ? '+1' : '-1'} adjustment`,
  //     })
  //     setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)))
  //     showToast(`${product.name}: stock is now ${updated.stock_qty} ${product.unit}`)
  //   } catch (err: unknown) {
  //     showToast(err instanceof Error ? err.message : 'Stock adjustment failed')
  //   }
  // }

  // Filtered and Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search filter (Name or SKU or HSN or Supplier)
        const q = searchQuery.toLowerCase().trim()
        const matchesQuery =
          !q ||
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.hsn_code && p.hsn_code.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.supplier_name && p.supplier_name.toLowerCase().includes(q))

        // Category filter
        const matchesCategory =
          categoryFilter === 'all' ||
          (p.category_id && p.category_id.toString() === categoryFilter) ||
          p.category === categoryFilter

        // Stock status filter based on per-product low_stock_threshold!
        let matchesStock = true
        if (stockFilter === 'low') {
          matchesStock = p.stock_qty > 0 && p.stock_qty <= (p.low_stock_threshold ?? 5)
        } else if (stockFilter === 'out') {
          matchesStock = p.stock_qty <= 0
        }

        return matchesQuery && matchesCategory && matchesStock
      })
      .sort((a, b) => {
        let valA: any = a[sortField] ?? ''
        let valB: any = b[sortField] ?? ''

        if (typeof valA === 'string') {
          valA = valA.toLowerCase()
          valB = (valB as string).toLowerCase()
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
  }, [products, searchQuery, categoryFilter, stockFilter, sortField, sortOrder])

  // Aggregate metrics
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock_qty > 0 && p.stock_qty <= (p.low_stock_threshold ?? 5)).length
  }, [products])

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => p.stock_qty <= 0).length
  }, [products])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5 select-none bg-[#0C0E12] animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#1C2028] border border-amber-500/40 text-amber-400 text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-2.5 backdrop-blur-md">
          <span>✓</span> {toastMessage}
        </div>
      )}

      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Merchandise & Stock Ledger
            </span>
          </div>
          <h2 className="text-2xl font-black text-[#F3F4F6] tracking-tight">
            Inventory Management
          </h2>
          <p className="text-xs text-[#9CA3AF]">
            Search, sort, restock and monitor stock with per-product reorder thresholds and HSN/GST
            rates.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="h-10 px-3.5 rounded-xl bg-[#1C2028] hover:bg-[#262B36] text-xs font-semibold text-[#F3F4F6] border border-[#262B36] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>🏷️</span>
            <span>Categories</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setHistoryProduct(null)
              setIsHistoryOpen(true)
            }}
            className="h-10 px-3.5 rounded-xl bg-[#1C2028] hover:bg-[#262B36] text-xs font-semibold text-[#F3F4F6] border border-[#262B36] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>📜</span>
            <span>Stock Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingProduct(null)
              setIsAddEditOpen(true)
            }}
            className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-xs font-bold text-black shadow-md shadow-amber-950/40 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>+</span>
            <span>Add Product (F2)</span>
          </button>
        </div>
      </div>

      {/* Search, Status and Category Filtering Bar */}
      <div className="bg-[#15181E] border border-[#262B36] rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box with Barcode scanner support */}
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] text-sm pointer-events-none">
              🔍
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onKeyDown={handleSearchKeyDown}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product name, SKU, HSN or scan barcode (Press '/' to focus)..."
              className="w-full h-10 pl-10 pr-20 rounded-xl bg-[#0C0E12] border border-[#262B36] text-xs text-[#F3F4F6] placeholder:text-[#64748B] focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] p-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Pills */}
            <div className="flex items-center bg-[#0C0E12] border border-[#262B36] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setStockFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  stockFilter === 'all'
                    ? 'bg-[#1C2028] text-[#F3F4F6] border border-[#262B36]'
                    : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                }`}
              >
                All ({products.length})
              </button>

              <button
                type="button"
                onClick={() => setStockFilter('low')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  stockFilter === 'low'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-[#9CA3AF] hover:text-amber-400'
                }`}
              >
                <span>Low</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono">
                  {lowStockCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStockFilter('out')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  stockFilter === 'out'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'text-[#9CA3AF] hover:text-red-400'
                }`}
              >
                <span>Out</span>
                <span className="px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 text-[10px] font-mono">
                  {outOfStockCount}
                </span>
              </button>
            </div>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 rounded-xl bg-[#0C0E12] border border-[#262B36] text-xs text-[#F3F4F6] focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#15181E] border border-[#262B36] rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1C2028] text-[#9CA3AF] uppercase tracking-wider font-bold border-b border-[#262B36]">
              <tr>
                <th
                  onClick={() => handleSort('sku')}
                  className="p-3.5 cursor-pointer hover:text-[#F3F4F6] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Barcode / SKU</span>
                    {sortField === 'sku' && (
                      <span className="text-amber-500">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="p-3.5 cursor-pointer hover:text-[#F3F4F6] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Product Details</span>
                    {sortField === 'name' && (
                      <span className="text-amber-500">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('category')}
                  className="p-3.5 cursor-pointer hover:text-[#F3F4F6] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Category</span>
                    {sortField === 'category' && (
                      <span className="text-amber-500">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('purchase_price')}
                  className="p-3.5 cursor-pointer hover:text-[#F3F4F6] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Cost</span>
                    {sortField === 'purchase_price' && (
                      <span className="text-amber-500">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('selling_price')}
                  className="p-3.5 cursor-pointer hover:text-[#F3F4F6] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Sell / MRP</span>
                    {sortField === 'selling_price' && (
                      <span className="text-amber-500">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('stock_qty')}
                  className="p-3.5 cursor-pointer hover:text-[#F3F4F6] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Stock Status</span>
                    {sortField === 'stock_qty' && (
                      <span className="text-amber-500">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#262B36]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#9CA3AF] font-medium">
                    Loading inventory catalog...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#9CA3AF] font-medium">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="text-3xl">📦</div>
                      <p className="text-sm text-[#F3F4F6] font-semibold">No products found</p>
                      <p className="text-xs text-[#9CA3AF]">
                        {searchQuery
                          ? `No matches for "${searchQuery}". Try another keyword or barcode.`
                          : 'Your catalog is empty. Click "+ Add Product" to get started.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(null)
                          setIsAddEditOpen(true)
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-black transition-colors cursor-pointer"
                      >
                        + Add First Product
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const threshold = p.low_stock_threshold ?? 5
                  const isOutOfStock = p.stock_qty <= 0
                  const isLowStock = !isOutOfStock && p.stock_qty <= threshold

                  const margin =
                    p.selling_price > 0 && p.purchase_price > 0
                      ? (
                          ((p.selling_price - p.purchase_price) / p.selling_price) *
                          100
                        ).toFixed(0)
                      : null

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-[#1C2028]/60 transition-colors group select-none"
                    >
                      {/* SKU / Barcode */}
                      <td className="p-3.5">
                        <span className="font-mono text-amber-500 font-bold bg-[#0C0E12] px-2 py-1 rounded-lg border border-[#262B36] text-[11px] select-text">
                          {p.sku || 'No Barcode'}
                        </span>
                        {p.hsn_code && (
                          <div className="text-[10px] font-mono text-[#64748B] mt-1">
                            HSN: {p.hsn_code}
                          </div>
                        )}
                      </td>

                      {/* Product Details (Name, Expiry, Supplier) */}
                      <td className="p-3.5">
                        <div className="font-semibold text-[#F3F4F6] text-xs sm:text-sm">
                          {p.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF] mt-0.5">
                          <span>Unit: {p.unit}</span>
                          {p.gst_rate !== undefined && (
                            <span className="px-1.5 py-0.2 rounded bg-[#0C0E12] text-[#9CA3AF] border border-[#262B36]">
                              {p.gst_rate}% GST
                            </span>
                          )}
                          {p.expiry_date && (
                            <span className="text-amber-400/80">Exp: {p.expiry_date}</span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-lg bg-[#0C0E12] text-[#9CA3AF] text-[10px] font-medium border border-[#262B36]">
                          {p.category || 'General'}
                        </span>
                      </td>

                      {/* Buy / Cost Price */}
                      <td className="p-3.5 font-mono text-[#9CA3AF] font-medium text-xs">
                        ₹{p.purchase_price.toFixed(2)}
                      </td>

                      {/* Sell Price & MRP */}
                      <td className="p-3.5">
                        <div className="font-mono text-[#F3F4F6] font-bold text-xs sm:text-sm">
                          ₹{p.selling_price.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#64748B]">
                          {p.mrp && p.mrp !== p.selling_price && (
                            <span className="line-through">₹{p.mrp}</span>
                          )}
                          {margin && (
                            <span className="text-emerald-400 font-semibold">{margin}% margin</span>
                          )}
                        </div>
                      </td>

                      {/* Stock Status with Per-Product Threshold Badges */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Low ({p.stock_qty} {p.unit})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {p.stock_qty} {p.unit}
                            </span>
                          )}

                          {/* Quick inline adjustments */}
                          {/* <div className="hidden group-hover:flex items-center gap-1 ml-1">
                            <button
                              type="button"
                              onClick={() => handleInlineStock(p, -1)}
                              title="Deduct 1"
                              className="w-5 h-5 rounded bg-[#1C2028] hover:bg-[#262B36] border border-[#262B36] text-[#9CA3AF] font-bold flex items-center justify-center cursor-pointer text-xs"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInlineStock(p, 1)}
                              title="Add 1"
                              className="w-5 h-5 rounded bg-[#1C2028] hover:bg-[#262B36] border border-[#262B36] text-amber-400 font-bold flex items-center justify-center cursor-pointer text-xs"
                            >
                              +
                            </button>
                          </div> */}
                        </div>
                        <div className="text-[9px] text-[#64748B] mt-0.5">
                          Threshold: ≤ {threshold}
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print Barcode Label */}
                          <button
                            type="button"
                            onClick={() => setBarcodeLabelProduct(p)}
                            title="Print Barcode Label / Sticker"
                            className="px-2 py-1 rounded-lg bg-[#1C2028] hover:bg-amber-500/10 hover:border-amber-500/30 text-amber-400 text-[11px] font-semibold border border-[#262B36] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span>🏷️</span>
                            <span>Label</span>
                          </button>

                          {/* Restock action */}
                          <button
                            type="button"
                            onClick={() => setAdjustingProduct(p)}
                            title="Restock or Adjust Stock"
                            className="px-2.5 py-1 rounded-lg bg-[#1C2028] hover:bg-amber-500/10 hover:border-amber-500/30 text-amber-400 text-[11px] font-semibold border border-[#262B36] transition-colors cursor-pointer"
                          >
                            Restock
                          </button>

                          {/* History */}
                          <button
                            type="button"
                            onClick={() => {
                              setHistoryProduct(p)
                              setIsHistoryOpen(true)
                            }}
                            title="View Stock Movement Audit History"
                            className="w-7 h-7 rounded-lg bg-[#1C2028] hover:bg-[#262B36] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#262B36] flex items-center justify-center text-xs transition-colors cursor-pointer"
                          >
                            📜
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(p)
                              setIsAddEditOpen(true)
                            }}
                            className="px-2 py-1 rounded-lg bg-[#1C2028] hover:bg-[#262B36] text-[#F3F4F6] text-[11px] font-semibold border border-[#262B36] transition-colors cursor-pointer"
                          >
                            ✎
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteProduct(p)}
                            className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 flex items-center justify-center text-xs transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-4 bg-[#11141A] border-t border-[#262B36] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#9CA3AF]">
          <div>
            Showing <strong className="text-[#F3F4F6]">{filteredProducts.length}</strong> of{' '}
            <strong className="text-[#F3F4F6]">{products.length}</strong> products
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[#64748B]">
            <span>Low Stock: {lowStockCount} items</span>
            <span>Out of Stock: {outOfStockCount} items</span>
            <span>SQLite WAL Engine Active</span>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <AddEditProductModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        onSave={handleSaveProduct}
        initialData={editingProduct}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteProductModal
        isOpen={Boolean(deleteProduct)}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleConfirmDelete}
        productName={deleteProduct?.name || ''}
        isDeleting={isDeleting}
      />

      {/* Category Management Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoriesChanged={loadData}
      />

      {/* Restock & Manual Adjustment Modal */}
      <StockAdjustModal
        product={adjustingProduct}
        isOpen={Boolean(adjustingProduct)}
        onClose={() => setAdjustingProduct(null)}
        onSuccess={(updated) => {
          setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
          showToast(`Stock updated for ${updated.name}: ${updated.stock_qty} ${updated.unit}`)
        }}
      />

      {/* Stock History Audit Log Modal */}
      <StockHistoryModal
        product={historyProduct}
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false)
          setHistoryProduct(null)
        }}
      />

      {/* Barcode Sticker Label Printing Modal */}
      {barcodeLabelProduct && (
        <BarcodeLabelModal
          product={barcodeLabelProduct}
          onClose={() => setBarcodeLabelProduct(null)}
        />
      )}
    </div>
  )
}
