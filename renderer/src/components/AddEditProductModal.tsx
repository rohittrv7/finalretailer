import React, { useState, useEffect, useRef } from 'react'
import { Product, NewProduct, Category } from '../vite-env'
import { generateBarcodeNumber, renderBarcodeToSvg } from '../utils/barcodeUtils'

export type ProductFormData = NewProduct

interface AddEditProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: NewProduct, id?: number) => Promise<void>
  initialData?: Product | null
  onOpenCategoryModal?: () => void
}

const COMMON_UNITS = ['pcs', 'kg', 'g', 'litre', 'ml', 'box', 'pack', 'dozen', 'meter']
const GST_SLABS = [0, 5, 18, 40]

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  onOpenCategoryModal,
}) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState<string>('')
  const [sku, setSku] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [purchasePrice, setPurchasePrice] = useState<string>('0')
  const [sellingPrice, setSellingPrice] = useState<string>('')
  const [mrp, setMrp] = useState<string>('')
  const [stockQty, setStockQty] = useState<string>('0')
  const [unit, setUnit] = useState<string>('pcs')
  const [hsnCode, setHsnCode] = useState<string>('')
  const [gstRate, setGstRate] = useState<number>(5)
  const [isCustomGst, setIsCustomGst] = useState<boolean>(false)
  const [customGstRate, setCustomGstRate] = useState<string>('')
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('5')
  const [expiryDate, setExpiryDate] = useState<string>('')
  const [supplierName, setSupplierName] = useState<string>('')

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const nameInputRef = useRef<HTMLInputElement>(null)
  const skuInputRef = useRef<HTMLInputElement>(null)
  const priceInputRef = useRef<HTMLInputElement>(null)
  const barcodeSvgRef = useRef<SVGSVGElement>(null)

  // Fetch categories from database
  const loadCategories = async () => {
    if (window.electronAPI?.db?.categories) {
      try {
        const list = await window.electronAPI.db.categories.getAll()
        setCategories(list)
        if (!initialData && list.length > 0 && !categoryId) {
          setCategoryId(list[0].id.toString())
        }
      } catch (err) {
        console.error('Error fetching categories in modal', err)
      }
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadCategories()

      if (initialData) {
        setName(initialData.name || '')
        setSku(initialData.sku || '')
        setCategoryId(initialData.category_id ? initialData.category_id.toString() : '')
        setPurchasePrice((initialData.purchase_price ?? 0).toString())
        setSellingPrice((initialData.selling_price ?? 0).toString())
        setMrp((initialData.mrp ?? initialData.selling_price ?? 0).toString())
        setStockQty((initialData.stock_qty ?? 0).toString())
        setUnit(initialData.unit || 'pcs')
        setHsnCode(initialData.hsn_code || '')
        const rate = initialData.gst_rate ?? 5
        setGstRate(rate)
        if (GST_SLABS.includes(rate)) {
          setIsCustomGst(false)
          setCustomGstRate('')
        } else {
          setIsCustomGst(true)
          setCustomGstRate(rate.toString())
        }
        setLowStockThreshold((initialData.low_stock_threshold ?? 5).toString())
        setExpiryDate(initialData.expiry_date || '')
        setSupplierName(initialData.supplier_name || '')
      } else {
        setName('')
        setSku('')
        setPurchasePrice('0')
        setSellingPrice('')
        setMrp('')
        setStockQty('10')
        setUnit('pcs')
        setHsnCode('')
        setGstRate(5)
        setIsCustomGst(false)
        setCustomGstRate('')
        setLowStockThreshold('5')
        setExpiryDate('')
        setSupplierName('')
      }
      setError(null)
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  // Fast SKU barcode generation if item doesn't have one
  const handleGenerateSku = async () => {
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
        height: 38,
        fontSize: 10,
        displayValue: true,
      })
    }
  }, [sku, isOpen])

  // Handle hardware barcode scanner rapid submit in SKU field
  const handleSkuKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      priceInputRef.current?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Product name is required')
      nameInputRef.current?.focus()
      return
    }

    const sPrice = parseFloat(sellingPrice)
    if (isNaN(sPrice) || sPrice < 0) {
      setError('Please enter a valid selling price')
      priceInputRef.current?.focus()
      return
    }

    const pPrice = parseFloat(purchasePrice) || 0
    const mPrice = parseFloat(mrp) || sPrice
    const qty = parseFloat(stockQty) || 0
    const threshold = parseFloat(lowStockThreshold) >= 0 ? parseFloat(lowStockThreshold) : 5

    const selectedCat = categories.find((c) => c.id.toString() === categoryId)

    setIsSubmitting(true)
    try {
      await onSave(
        {
          name: name.trim(),
          sku: sku.trim() || null,
          category_id: selectedCat ? selectedCat.id : null,
          category: selectedCat ? selectedCat.name : 'General',
          purchase_price: pPrice,
          selling_price: sPrice,
          mrp: mPrice,
          stock_qty: qty,
          unit: unit || 'pcs',
          hsn_code: hsnCode.trim() || null,
          gst_rate: gstRate,
          low_stock_threshold: threshold,
          expiry_date: expiryDate.trim() || null,
          supplier_name: supplierName.trim() || null,
        },
        initialData?.id
      )
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#15181E] border border-[#262B36] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-scale-up select-none max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262B36] pb-3 sticky top-0 bg-[#15181E] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg border border-amber-500/20">
              {initialData ? '✏️' : '➕'}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F3F4F6] tracking-tight">
                {initialData ? 'Edit Product in Catalog' : 'Add New Retail Product'}
              </h2>
              <p className="text-xs text-[#9CA3AF]">
                {initialData
                  ? 'Update product specifications, prices, and inventory thresholds'
                  : 'Fast retail item registration (Enter to save)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#1C2028] hover:bg-[#262B36] text-[#9CA3AF] hover:text-[#F3F4F6] flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Product Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">
                Product Name <span className="text-red-400">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tata Salt 1kg or Dairy Milk 50g"
                className="w-full h-10 px-3 rounded-xl bg-[#0C0E12] border border-[#262B36] text-xs text-[#F3F4F6] placeholder:text-[#64748B] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                  Category <span className="text-red-400">*</span>
                </label>
                {onOpenCategoryModal && (
                  <button
                    type="button"
                    onClick={onOpenCategoryModal}
                    className="text-[11px] font-semibold text-amber-500 hover:underline cursor-pointer"
                  >
                    + Manage
                  </button>
                )}
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#0C0E12] border border-[#262B36] text-xs text-[#F3F4F6] focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Barcode / SKU + HSN Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                  Barcode / SKU
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="text-[11px] font-semibold text-amber-500 hover:underline cursor-pointer"
                >
                  Auto Generate
                </button>
              </div>
              <div className="relative">
                <input
                  ref={skuInputRef}
                  type="text"
                  value={sku}
                  onKeyDown={handleSkuKeyDown}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Scan barcode or enter SKU"
                  className="w-full h-10 pl-3 pr-8 rounded-xl bg-[#0C0E12] border border-[#262B36] font-mono text-xs text-amber-400 placeholder:text-[#64748B] focus:outline-none focus:border-amber-500"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#64748B] pointer-events-none">
                  |||
                </span>
              </div>
              {sku.trim() && (
                <div className="mt-1.5 p-1 bg-white rounded-lg flex items-center justify-center border border-[#262B36] min-h-[42px]">
                  <svg ref={barcodeSvgRef} className="w-full h-10" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">
                HSN Code (GST Invoicing)
              </label>
              <input
                type="text"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                placeholder="e.g. 1905 or 0401"
                className="w-full h-10 px-3 rounded-xl bg-[#0C0E12] border border-[#262B36] font-mono text-xs text-[#F3F4F6] placeholder:text-[#64748B] focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 3: Pricing Trio (Purchase Price, Selling Price, MRP) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0C0E12] p-3 rounded-2xl border border-[#262B36]">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">
                Buy / Cost Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                className="w-full h-9 px-3 rounded-lg bg-[#15181E] border border-[#262B36] font-mono text-xs text-[#F3F4F6] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-500 mb-1">
                Selling Price (₹) *
              </label>
              <input
                ref={priceInputRef}
                type="number"
                step="0.01"
                min="0.01"
                required
                value={sellingPrice}
                onChange={(e) => {
                  setSellingPrice(e.target.value)
                  if (!mrp) setMrp(e.target.value)
                }}
                placeholder="0.00"
                className="w-full h-9 px-3 rounded-lg bg-[#15181E] border border-amber-500 font-mono text-xs text-amber-400 font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">
                Printed MRP (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                placeholder="0.00"
                className="w-full h-9 px-3 rounded-lg bg-[#15181E] border border-[#262B36] font-mono text-xs text-[#F3F4F6] focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 4: Stock Quantity, Unit, GST %, and Low Stock Threshold */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">
                Stock Qty
              </label>
              <input
                type="number"
                step="1"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#0C0E12] border border-[#262B36] font-mono text-xs text-[#F3F4F6] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-10 px-2.5 rounded-xl bg-[#0C0E12] border border-[#262B36] text-xs text-[#F3F4F6] focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">
                GST Rate
              </label>
              <div className="flex gap-2">
                <select
                  value={isCustomGst ? 'custom' : gstRate}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomGst(true)
                      setCustomGstRate(gstRate.toString())
                    } else {
                      setIsCustomGst(false)
                      setGstRate(Number(e.target.value))
                    }
                  }}
                  className="w-full h-10 px-2.5 rounded-xl bg-[#0C0E12] border border-[#262B36] text-xs text-[#F3F4F6] focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5% (Essentials)</option>
                  <option value={18}>18% (Standard)</option>
                  <option value={40}>40% (Luxury/Demerit)</option>
                  <option value="custom">Other / Custom</option>
                </select>
                {isCustomGst && (
                  <div className="relative w-24 shrink-0">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="%"
                      value={customGstRate}
                      onChange={(e) => {
                        setCustomGstRate(e.target.value)
                        setGstRate(parseFloat(e.target.value) || 0)
                      }}
                      className="w-full h-10 px-2.5 pr-6 rounded-xl bg-[#0C0E12] border border-amber-500/60 font-mono text-xs text-amber-400 focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF] pointer-events-none">%</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-500 mb-1">
                Alert Threshold
              </label>
              <input
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                title="When stock drops to this or below, warning badge appears"
                className="w-full h-10 px-3 rounded-xl bg-[#0C0E12] border border-[#262B36] font-mono text-xs text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 5: Optional Expiry Date & Supplier/Vendor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#0C0E12] border border-[#262B36] text-xs text-[#F3F4F6] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">
                Supplier / Vendor (Optional)
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Apex Wholesalers Ltd"
                className="w-full h-10 px-3 rounded-xl bg-[#0C0E12] border border-[#262B36] text-xs text-[#F3F4F6] placeholder:text-[#64748B] focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262B36]">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-xl bg-[#1C2028] hover:bg-[#262B36] text-xs font-semibold text-[#9CA3AF] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-40 text-xs font-bold text-black shadow-lg shadow-amber-950/40 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isSubmitting ? 'Saving...' : initialData ? 'Update Product' : 'Add to Catalog'}</span>
              <span>↵</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
