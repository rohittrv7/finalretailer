import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Product, Customer, HeldBill, Invoice, InvoiceItem, CreateInvoicePayload } from '../vite-env'
import {
  calculateBill,
  BillLineItem,
  CalculatedLineItem,
  DiscountType,
} from '../utils/billingCalculator'
import { InvoicePreviewModal } from './InvoicePreviewModal'
import { HeldBillsModal } from './HeldBillsModal'
import { InvoicesHistoryModal } from './InvoicesHistoryModal'
import { QuickAddCustomerModal } from './QuickAddCustomerModal'
import { QuickAddProductModal } from './QuickAddProductModal'

interface BillingViewProps {
  onNavigateToInventory?: () => void
}

export const BillingView: React.FC<BillingViewProps> = () => {
  // DB entities
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [allowNegativeStock, setAllowNegativeStock] = useState<boolean>(false)
  const [heldBillsCount, setHeldBillsCount] = useState<number>(0)

  // Current Bill State
  const [cart, setCart] = useState<BillLineItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)

  // Bill-level discounts & round-off
  const [billDiscountType, setBillDiscountType] = useState<DiscountType>('percent')
  const [billDiscountValue, setBillDiscountValue] = useState<number>(0)
  const [roundOffEnabled, setRoundOffEnabled] = useState<boolean>(true)
  const [taxPricingMode, setTaxPricingMode] = useState<'INCLUSIVE' | 'EXCLUSIVE'>('INCLUSIVE')

  // Payment State (Simplified to Cash and UPI)
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('CASH')
  const [cashTendered, setCashTendered] = useState<string>('')
  const [amountPaidNow, setAmountPaidNow] = useState<string>('')
  const [isCustomAmountPaid, setIsCustomAmountPaid] = useState<boolean>(false)

  // Search & Barcode
  const [productSearchInput, setProductSearchInput] = useState('')
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)
  const [highlightedProductIndex, setHighlightedProductIndex] = useState(0)

  // Modals & Drawers
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [currentSavedInvoice, setCurrentSavedInvoice] = useState<(Invoice & { items?: InvoiceItem[] }) | null>(null)
  const [showHeldBillsModal, setShowHeldBillsModal] = useState(false)
  const [showInvoicesHistoryModal, setShowInvoicesHistoryModal] = useState(false)
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false)
  const [showQuickProductModal, setShowQuickProductModal] = useState(false)
  const [notFoundQuery, setNotFoundQuery] = useState('')

  // Feedback & Processing
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warn' | 'error' } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  const customerSearchRef = useRef<HTMLInputElement>(null)
  const productDropdownRef = useRef<HTMLDivElement>(null)

  const showToast = (text: string, type: 'success' | 'warn' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Load all initial data from SQLite
  const loadInitialData = async () => {
    if (!window.electronAPI?.db) return
    try {
      const [pList, cList, negSetting, heldList, taxSetting] = await Promise.all([
        window.electronAPI.db.products.getAll(),
        window.electronAPI.db.customers.getAll(),
        window.electronAPI.db.settings.get('allow_negative_stock'),
        window.electronAPI.db.heldBills?.getAll() || Promise.resolve([]),
        window.electronAPI.db.settings.get('tax_pricing_mode'),
      ])
      setProducts(pList)
      setCustomers(cList)
      setAllowNegativeStock(negSetting === '1')
      setHeldBillsCount(heldList.length)
      if (taxSetting === 'EXCLUSIVE' || taxSetting === 'INCLUSIVE') {
        setTaxPricingMode(taxSetting)
      }
    } catch (err) {
      console.error('Failed to load billing data', err)
      showToast('Error loading billing records from database', 'error')
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Auto-focus product search bar on mount
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  // Calculate bill totals using shared billing calculation engine
  const totals = useMemo(() => {
    let customPaid: number | undefined = undefined
    if (isCustomAmountPaid) {
      const parsed = parseFloat(amountPaidNow)
      customPaid = isNaN(parsed) ? 0 : parsed
    }

    return calculateBill({
      items: cart,
      pricingMode: taxPricingMode,
      billDiscountType,
      billDiscountValue,
      roundOffEnabled,
      paymentMode,
      amountPaidInput: customPaid,
      cashTenderedInput: parseFloat(cashTendered) || 0,
    })
  }, [cart, taxPricingMode, billDiscountType, billDiscountValue, roundOffEnabled, paymentMode, isCustomAmountPaid, amountPaidNow, cashTendered])

  // Automatically keep amountPaidNow in sync with grand total for non-custom payments
  useEffect(() => {
    if (!isCustomAmountPaid) {
      setAmountPaidNow(totals.grandTotal.toString())
    }
  }, [totals.grandTotal, isCustomAmountPaid])

  // Change calculation for Cash mode
  const tenderNumber = parseFloat(cashTendered) || 0
  const changeDue = Math.max(0, tenderNumber - totals.grandTotal)

  // Product Autocomplete Filtering
  const filteredProducts = useMemo(() => {
    const q = productSearchInput.trim().toLowerCase()
    if (!q) return []
    return products
      .filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q)
        const skuMatch = p.sku ? p.sku.toLowerCase().includes(q) : false
        return nameMatch || skuMatch
      })
      .slice(0, 10)
  }, [products, productSearchInput])

  // Customer Autocomplete Filtering
  const filteredCustomers = useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase()
    if (!q) return customers.slice(0, 8)
    return customers
      .filter((c) => {
        const nameMatch = c.name.toLowerCase().includes(q)
        const phoneMatch = c.phone ? c.phone.includes(q) : false
        return nameMatch || phoneMatch
      })
      .slice(0, 10)
  }, [customers, customerSearchQuery])

  // Add Product to Cart
  const addProductToCart = useCallback(
    (product: Product) => {
      setCart((prev) => {
        const existingIdx = prev.findIndex((item) => item.productId === product.id)
        if (existingIdx >= 0) {
          const existing = prev[existingIdx]
          const nextQty = existing.qty + 1
          if (nextQty > product.stock_qty && !allowNegativeStock) {
            showToast(
              `Stock warning: "${product.name}" only has ${product.stock_qty} ${product.unit || 'pcs'} in stock!`,
              'warn'
            )
          }
          const updated = [...prev]
          updated[existingIdx] = {
            ...existing,
            qty: nextQty,
          }
          return updated
        }

        // New line item
        if (product.stock_qty <= 0 && !allowNegativeStock) {
          showToast(
            `Stock warning: "${product.name}" is out of stock (available: ${product.stock_qty}). Override enabled? Check settings.`,
            'warn'
          )
        }

        const newItem: BillLineItem = {
          id: Date.now() + Math.random(),
          productId: product.id,
          name: product.name,
          sku: product.sku || '',
          unit: product.unit || 'pcs',
          unitPrice: product.selling_price || 0,
          mrp: product.mrp || product.selling_price || 0,
          qty: 1,
          discountType: 'percent',
          discountValue: 0,
          gstRate: product.gst_rate ?? 5,
          stockQty: product.stock_qty ?? 0,
        }
        return [newItem, ...prev]
      })

      setProductSearchInput('')
      setIsProductDropdownOpen(false)
      searchInputRef.current?.focus()
    },
    [allowNegativeStock]
  )

  // Handle barcode scanner input or Enter key in search box
  const handleProductSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const query = productSearchInput.trim()
    if (!query) return

    // 1. Exact match on SKU or Barcode
    const exactSkuMatch = products.find(
      (p) => p.sku && p.sku.toLowerCase() === query.toLowerCase()
    )
    if (exactSkuMatch) {
      addProductToCart(exactSkuMatch)
      return
    }

    // 2. Exact match on product name
    const exactNameMatch = products.find(
      (p) => p.name.toLowerCase() === query.toLowerCase()
    )
    if (exactNameMatch) {
      addProductToCart(exactNameMatch)
      return
    }

    // 3. Highlighted or first autocomplete match
    if (filteredProducts.length > 0) {
      const match = filteredProducts[highlightedProductIndex] || filteredProducts[0]
      addProductToCart(match)
      return
    }

    // 4. Product Not Found: Offer quick add inline modal
    setNotFoundQuery(query)
    setShowQuickProductModal(true)
  }

  // Update item quantity
  const handleUpdateQty = (itemId: string | number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(itemId)
      return
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          if (newQty > item.stockQty && !allowNegativeStock) {
            showToast(
              `Stock warning: "${item.name}" only has ${item.stockQty} ${item.unit} available!`,
              'warn'
            )
          }
          return { ...item, qty: newQty }
        }
        return item
      })
    )
  }

  // Update unit price (price override)
  const handleUpdatePrice = (itemId: string | number, price: number) => {
    if (isNaN(price) || price < 0) return
    setCart((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, unitPrice: price } : item))
    )
  }

  // Update item discount
  const handleUpdateItemDiscount = (
    itemId: string | number,
    discountType: DiscountType,
    discountValue: number
  ) => {
    if (isNaN(discountValue) || discountValue < 0) return
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, discountType, discountValue } : item
      )
    )
  }

  // Remove line item
  const handleRemoveItem = (itemId: string | number) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId))
  }

  // Clear Cart / New Bill (F2)
  const handleNewBill = useCallback(() => {
    if (cart.length > 0 && !window.confirm('Start new bill? Current cart will be discarded (use Ctrl+H to hold instead).')) {
      return
    }
    setCart([])
    setSelectedCustomer(null)
    setCustomerSearchQuery('')
    setBillDiscountType('percent')
    setBillDiscountValue(0)
    setRoundOffEnabled(true)
    setPaymentMode('CASH')
    setCashTendered('')
    setAmountPaidNow('')
    setIsCustomAmountPaid(false)
    setProductSearchInput('')
    searchInputRef.current?.focus()
    showToast('New bill started', 'success')
  }, [cart.length])

  // Hold current bill (Ctrl+H)
  const handleHoldBill = useCallback(async () => {
    if (cart.length === 0) {
      showToast('Cannot hold an empty cart', 'warn')
      return
    }
    if (!window.electronAPI?.db?.heldBills) return

    try {
      const heldData = {
        cart,
        billDiscountType,
        billDiscountValue,
        roundOffEnabled,
        paymentMode,
      }
      await window.electronAPI.db.heldBills.create({
        bill_label: `${selectedCustomer?.name || 'Walk-in'} (${cart.length} items)`,
        customer_id: selectedCustomer?.id,
        customer_name: selectedCustomer?.name || 'Walk-in Customer',
        cart_json: JSON.stringify(heldData),
        bill_discount_type: billDiscountType,
        bill_discount_value: billDiscountValue,
        round_off_enabled: roundOffEnabled ? 1 : 0,
        notes: `Held with ${cart.length} items`,
      })

      showToast(`Bill held successfully (${cart.length} items)`, 'success')
      // Reset bill for next customer
      setCart([])
      setSelectedCustomer(null)
      setBillDiscountValue(0)
      setCashTendered('')
      setIsCustomAmountPaid(false)
      // Update count
      const updated = await window.electronAPI.db.heldBills.getAll()
      setHeldBillsCount(updated.length)
      searchInputRef.current?.focus()
    } catch (err: any) {
      console.error('Failed to hold bill', err)
      showToast(err?.message || 'Failed to hold bill', 'error')
    }
  }, [cart, billDiscountType, billDiscountValue, roundOffEnabled, paymentMode, selectedCustomer])

  // Resume held bill
  const handleResumeBill = async (heldBill: HeldBill) => {
    try {
      const parsed = JSON.parse(heldBill.cart_json)
      let resumedCart: BillLineItem[] = []
      if (Array.isArray(parsed)) {
        resumedCart = parsed
      } else if (parsed && parsed.cart) {
        resumedCart = parsed.cart
        if (parsed.billDiscountType) setBillDiscountType(parsed.billDiscountType)
        if (parsed.billDiscountValue) setBillDiscountValue(parsed.billDiscountValue)
        if (parsed.roundOffEnabled !== undefined) setRoundOffEnabled(Boolean(parsed.roundOffEnabled))
        if (parsed.paymentMode) setPaymentMode(parsed.paymentMode)
      }

      setCart(resumedCart)

      // Set customer if found
      if (heldBill.customer_id) {
        const cust = customers.find((c) => c.id === heldBill.customer_id)
        if (cust) setSelectedCustomer(cust)
      } else {
        setSelectedCustomer(null)
      }

      // Delete from held bills table
      if (window.electronAPI?.db?.heldBills) {
        await window.electronAPI.db.heldBills.delete(heldBill.id)
        const updated = await window.electronAPI.db.heldBills.getAll()
        setHeldBillsCount(updated.length)
      }

      setShowHeldBillsModal(false)
      showToast(`Resumed held bill for ${heldBill.customer_name || 'Walk-in Customer'}`, 'success')
      searchInputRef.current?.focus()
    } catch (err: any) {
      console.error('Failed to parse and resume bill', err)
      showToast('Error resuming held bill', 'error')
    }
  }

  // Open past invoice in PDF viewer
  const handleViewInvoiceById = async (invoiceId: number) => {
    try {
      if (window.electronAPI?.db?.invoices) {
        const inv = await window.electronAPI.db.invoices.getById(invoiceId)
        if (inv) {
          setCurrentSavedInvoice(inv as any)
          setShowPreviewModal(true)
        }
      }
    } catch (err) {
      console.error('Failed to fetch invoice', err)
      showToast('Error opening invoice details', 'error')
    }
  }

  // Save & Generate Invoice (Ctrl+S)
  const handleSaveInvoice = useCallback(async () => {
    if (cart.length === 0) {
      showToast('Cannot save an empty bill. Add items first.', 'warn')
      searchInputRef.current?.focus()
      return
    }

    // Validation: Stock verification if negative stock disabled
    if (!allowNegativeStock) {
      const insufficientItem = cart.find((item) => item.qty > item.stockQty)
      if (insufficientItem) {
        showToast(
          `Cannot bill "${insufficientItem.name}": requested ${insufficientItem.qty} exceeds stock (${insufficientItem.stockQty}). Enable negative stock in Settings if needed.`,
          'error'
        )
        return
      }
    }

    // Validation: Ensure all cart items have valid product ID, price, and quantity
    for (const item of cart) {
      if (!item.productId) {
        showToast(`Item "${item.name || 'Unknown'}" is missing a valid product ID.`, 'error')
        return
      }
      const p = Number(item.unitPrice)
      if (item.unitPrice === undefined || item.unitPrice === null || isNaN(p) || p < 0) {
        showToast(`Item "${item.name}" has an invalid price (₹${item.unitPrice}). Please check item price.`, 'error')
        return
      }
      const q = Number(item.qty)
      if (!item.qty || isNaN(q) || q <= 0) {
        showToast(`Item "${item.name}" has an invalid quantity (${item.qty}).`, 'error')
        return
      }
    }

    // Validation: Customer selection mandatory when there is an unattached due (Baki)
    const effectivePaidAmount = totals.amountPaid
    const dueAmount = totals.amountDue

    if (dueAmount > 0 && !selectedCustomer) {
      showToast(
        `Customer selection is mandatory when there is a pending due (Baki: ₹${dueAmount.toFixed(2)})!`,
        'warn'
      )
      customerSearchRef.current?.focus()
      return
    }

    setIsSaving(true)
    try {
      if (!window.electronAPI?.db?.invoices) {
        throw new Error('Database IPC not ready')
      }

      // Payment details if cash with change
      let paymentDetails = ''
      if (paymentMode === 'CASH' && tenderNumber > 0) {
        paymentDetails = JSON.stringify({
          tendered: tenderNumber,
          changeDue: changeDue,
        })
      }

      const invoicePayload: CreateInvoicePayload = {
        customer_id: selectedCustomer?.id,
        customer_name: selectedCustomer?.name || 'Walk-in Customer',
        tax_pricing_mode: taxPricingMode,
        subtotal: totals.rawSubtotal,
        discount_amount: totals.billDiscountAmount,
        discount_type: billDiscountType,
        discount_value: billDiscountValue,
        tax_amount: totals.totalTax,
        cgst_amount: totals.totalCgst,
        sgst_amount: totals.totalSgst,
        round_off: totals.roundOff,
        total: totals.grandTotal,
        amount_paid: effectivePaidAmount,
        payment_mode: paymentMode,
        payment_details: paymentDetails || undefined,
        notes: dueAmount > 0 ? `Baki pending: ₹${dueAmount.toFixed(2)}` : undefined,
        items: totals.items.map((item: CalculatedLineItem) => {
          const priceVal = Number(item.unitPrice) || 0
          const qtyVal = Number(item.qty) || 1
          const discountVal = Number(item.discountAmount) || 0
          const gstRateVal = Number(item.gstRate) || 0
          const lineTotalVal = Number(item.lineTotal) || 0

          return {
            product_id: item.productId,
            product_name: item.name || 'Product',
            sku: item.sku ?? null,
            hsn_code: item.hsnCode ?? null,
            unit: item.unit ?? 'pcs',
            price: priceVal,
            unit_price: priceVal,
            mrp: Number(item.mrp) || priceVal,
            qty: qtyVal,
            discount: discountVal,
            discount_type: item.discountType || 'percent',
            discount_value: Number(item.discountValue) || 0,
            discount_amount: discountVal,
            gst_rate: gstRateVal,
            tax_amount: Number(item.taxAmount) || 0,
            cgst_amount: Number(item.cgstAmount) || 0,
            sgst_amount: Number(item.sgstAmount) || 0,
            line_total: lineTotalVal,
          }
        }),
      }

      console.log('[Billing] Invoice payload items before save:', JSON.stringify(invoicePayload.items, null, 2))

      const savedResult = await window.electronAPI.db.invoices.create(invoicePayload)

      // Open invoice receipt preview
      setCurrentSavedInvoice({
        ...savedResult,
        items: invoicePayload.items as any,
      })
      setShowPreviewModal(true)

      // Reset billing state for next transaction
      setCart([])
      setSelectedCustomer(null)
      setCustomerSearchQuery('')
      setBillDiscountValue(0)
      setCashTendered('')
      setAmountPaidNow('')
      setIsCustomAmountPaid(false)

      // Reload products & customers to update stock & credit balances
      loadInitialData()
      showToast(`Invoice ${savedResult.invoice_no} generated!`, 'success')
      searchInputRef.current?.focus()
    } catch (err: any) {
      console.error('Invoice save failed', err)
      showToast(err?.message || 'Failed to save invoice', 'error')
    } finally {
      setIsSaving(false)
    }
  }, [
    cart,
    allowNegativeStock,
    totals,
    paymentMode,
    selectedCustomer,
    tenderNumber,
    changeDue,
    billDiscountType,
    billDiscountValue,
  ])

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside another modal
      if (
        showQuickCustomerModal ||
        showQuickProductModal ||
        showHeldBillsModal ||
        showInvoicesHistoryModal ||
        showPreviewModal
      ) {
        return
      }

      // F2: New Bill
      if (e.key === 'F2') {
        e.preventDefault()
        handleNewBill()
        return
      }

      // F4: Focus Search Bar
      if (e.key === 'F4') {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
        return
      }

      // Ctrl+S: Save Invoice
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSaveInvoice()
        return
      }

      // Ctrl+Shift+H: View Held Bills
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault()
        setShowHeldBillsModal(true)
        return
      }

      // Ctrl+H: Hold Bill
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault()
        handleHoldBill()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    handleNewBill,
    handleSaveInvoice,
    handleHoldBill,
    showQuickCustomerModal,
    showQuickProductModal,
    showHeldBillsModal,
    showInvoicesHistoryModal,
    showPreviewModal,
  ])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#0C0E12',
        color: '#F9FAFB',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Dynamic Responsive Styles */}
      <style>{`
        .billing-responsive-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 370px;
          height: 100%;
          overflow: hidden;
        }
        @media (max-width: 1100px) {
          .billing-responsive-layout {
            grid-template-columns: minmax(0, 1fr) 330px;
          }
        }
        @media (max-width: 860px) {
          .billing-responsive-layout {
            grid-template-columns: 1fr;
            overflow-y: auto;
          }
        }
        .cart-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }
        .cart-table {
          width: 100%;
          min-width: 650px;
          border-collapse: collapse;
          text-align: left;
        }
      `}</style>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            backgroundColor:
              toastMessage.type === 'error'
                ? '#EF4444'
                : toastMessage.type === 'warn'
                  ? '#F59E0B'
                  : '#10B981',
            color: toastMessage.type === 'warn' ? '#000' : '#FFFFFF',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="billing-responsive-layout">
        {/* ========================================================= */}
        {/* LEFT COLUMN: PRODUCT SEARCH + RUNNING CART LINE-ITEMS     */}
        {/* ========================================================= */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #262B36',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: '#0C0E12',
          }}
        >
          {/* Top Bar: Product Search Bar + Barcode Scanner input */}
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#15181E',
              borderBottom: '1px solid #262B36',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              position: 'relative',
            }}
          >
            <form
              onSubmit={handleProductSearchSubmit}
              style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#9CA3AF',
                  pointerEvents: 'none',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              <input
                ref={searchInputRef}
                type="text"
                placeholder="Scan barcode / SKU or type product name (Press Enter to add)... [F4]"
                value={productSearchInput}
                onChange={(e) => {
                  setProductSearchInput(e.target.value)
                  setIsProductDropdownOpen(true)
                  setHighlightedProductIndex(0)
                }}
                onFocus={() => {
                  if (productSearchInput.trim()) setIsProductDropdownOpen(true)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setHighlightedProductIndex((prev) =>
                      prev < filteredProducts.length - 1 ? prev + 1 : prev
                    )
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setHighlightedProductIndex((prev) => (prev > 0 ? prev - 1 : 0))
                  } else if (e.key === 'Escape') {
                    setIsProductDropdownOpen(false)
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem 0.65rem 2.6rem',
                  backgroundColor: '#0C0E12',
                  border: '1px solid #262B36',
                  borderRadius: '10px',
                  color: '#F9FAFB',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />

              {/* Autocomplete Dropdown */}
              {isProductDropdownOpen && productSearchInput.trim() && (
                <div
                  ref={productDropdownRef}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    backgroundColor: '#15181E',
                    border: '1px solid #262B36',
                    borderRadius: '10px',
                    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.5)',
                    zIndex: 50,
                    maxHeight: '320px',
                    overflowY: 'auto',
                  }}
                >
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p, idx) => {
                      const isHighlighted = idx === highlightedProductIndex
                      return (
                        <div
                          key={p.id}
                          onClick={() => addProductToCart(p)}
                          style={{
                            padding: '0.65rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: isHighlighted ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                            borderBottom: '1px solid #262B36',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={() => setHighlightedProductIndex(idx)}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: '#F9FAFB', fontSize: '0.9rem' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                              SKU: {p.sku || 'N/A'} &bull; GST: {p.gst_rate}% &bull; Stock: {p.stock_qty} {p.unit}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: '#F59E0B', fontSize: '0.95rem' }}>
                              ₹{p.selling_price.toFixed(2)}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#10B981' }}>+ Add to bill</span>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        No product found matching "{productSearchInput}"
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNotFoundQuery(productSearchInput)
                          setShowQuickProductModal(true)
                          setIsProductDropdownOpen(false)
                        }}
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: '#10B981',
                          borderRadius: '6px',
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        + Quick Add as New Product
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Quick Add Product Button */}
            <button
              onClick={() => {
                setNotFoundQuery('')
                setShowQuickProductModal(true)
              }}
              title="Add a new product inline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#1C2028',
                border: '1px solid #262B36',
                color: '#E5E7EB',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Product</span>
            </button>
          </div>

          {/* Cart Table Header Controls / Info */}
          <div
            style={{
              padding: '0.55rem 1rem',
              backgroundColor: '#1C2028',
              borderBottom: '1px solid #262B36',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              color: '#9CA3AF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: '#F3F4F6' }}>
                Cart Items ({cart.length})
              </span>
              <span>&bull;</span>
              <span>Total Qty: {cart.reduce((s: number, i: BillLineItem) => s + i.qty, 0)}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  const nextMode = taxPricingMode === 'INCLUSIVE' ? 'EXCLUSIVE' : 'INCLUSIVE'
                  setTaxPricingMode(nextMode)
                  showToast(
                    `Pricing mode switched to GST-${nextMode === 'INCLUSIVE' ? 'Inclusive (Shelf Price)' : 'Exclusive (Tax on Top)'}`,
                    'success'
                  )
                }}
                title="Click to toggle pricing mode for this bill (Default set in Settings)"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: taxPricingMode === 'INCLUSIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                  border: `1px solid ${taxPricingMode === 'INCLUSIVE' ? '#059669' : '#2563EB'}`,
                  color: taxPricingMode === 'INCLUSIVE' ? '#34D399' : '#60A5FA',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🏷️</span>
                <span>{taxPricingMode === 'INCLUSIVE' ? 'GST-Inclusive' : 'GST-Exclusive (+Tax)'}</span>
              </button>

              {cart.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Clear all items from the current cart?')) {
                      setCart([])
                    }
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#EF4444',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Clear Cart
                </button>
              )}
            </div>
          </div>

          {/* Running Cart Line-Items Table */}
          <div className="cart-table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
            {cart.length === 0 ? (
              <div
                style={{
                  height: '100%',
                  minHeight: '260px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2.5rem',
                  color: '#6B7280',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '14px',
                    backgroundColor: '#15181E',
                    border: '1px dashed #262B36',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    color: '#4B5563',
                  }}
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                </div>
                <h3 style={{ margin: '0 0 0.35rem 0', color: '#D1D5DB', fontSize: '1.05rem' }}>
                  No Items in Current Bill
                </h3>
                <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', maxWidth: '380px' }}>
                  Scan a barcode with your scanner or type a product name above to immediately add it to the ticket.
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                  }}
                >
                  <span style={{ backgroundColor: '#15181E', border: '1px solid #262B36', padding: '4px 8px', borderRadius: '6px' }}>
                    <strong style={{ color: '#F59E0B' }}>F2</strong> New Bill
                  </span>
                  <span style={{ backgroundColor: '#15181E', border: '1px solid #262B36', padding: '4px 8px', borderRadius: '6px' }}>
                    <strong style={{ color: '#F59E0B' }}>F4</strong> Search Bar
                  </span>
                  <span style={{ backgroundColor: '#15181E', border: '1px solid #262B36', padding: '4px 8px', borderRadius: '6px' }}>
                    <strong style={{ color: '#F59E0B' }}>Ctrl+S</strong> Save & Print
                  </span>
                  <span style={{ backgroundColor: '#15181E', border: '1px solid #262B36', padding: '4px 8px', borderRadius: '6px' }}>
                    <strong style={{ color: '#F59E0B' }}>Ctrl+H</strong> Hold Bill
                  </span>
                </div>
              </div>
            ) : (
              <table className="cart-table">
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid #262B36',
                      backgroundColor: '#11141A',
                      fontSize: '0.75rem',
                      color: '#9CA3AF',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                    }}
                  >
                    <th style={{ padding: '0.65rem 0.85rem' }}>Product & Stock</th>
                    <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', width: '110px' }}>Qty</th>
                    <th style={{ padding: '0.65rem 0.5rem', textAlign: 'right', width: '90px' }}>Price (₹)</th>
                    <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', width: '125px' }}>Discount</th>
                    <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', width: '60px' }}>GST</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right', width: '95px' }}>Total (₹)</th>
                    <th style={{ padding: '0.65rem 0.6rem', textAlign: 'center', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {totals.items.map((item: CalculatedLineItem) => {
                    const isOverStock = item.qty > item.stockQty && !allowNegativeStock
                    return (
                      <tr
                        key={item.id}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Delete' || e.key === 'Backspace') {
                            if ((e.target as HTMLElement).tagName !== 'INPUT') {
                              e.preventDefault()
                              handleRemoveItem(item.id)
                            }
                          }
                        }}
                        style={{
                          borderBottom: '1px solid #1C2028',
                          backgroundColor: isOverStock ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                          transition: 'background-color 0.15s',
                        }}
                      >
                        {/* Product info with clean badges */}
                        <td style={{ padding: '0.65rem 0.85rem' }}>
                          <div style={{ fontWeight: 600, color: '#F9FAFB', fontSize: '0.9rem', marginBottom: '3px' }}>
                            {item.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {item.sku && (
                              <span
                                style={{
                                  backgroundColor: '#1C2028',
                                  border: '1px solid #262B36',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  color: '#9CA3AF',
                                  fontFamily: 'monospace',
                                }}
                              >
                                SKU: {item.sku}
                              </span>
                            )}
                            <span
                              style={{
                                backgroundColor: isOverStock
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : item.stockQty <= 5
                                    ? 'rgba(245, 158, 11, 0.15)'
                                    : 'rgba(16, 185, 129, 0.15)',
                                border: `1px solid ${isOverStock
                                    ? '#EF4444'
                                    : item.stockQty <= 5
                                      ? 'rgba(245, 158, 11, 0.3)'
                                      : 'rgba(16, 185, 129, 0.3)'
                                  }`,
                                color: isOverStock ? '#EF4444' : item.stockQty <= 5 ? '#F59E0B' : '#10B981',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                              }}
                            >
                              Stock: {item.stockQty} {item.unit}
                            </span>
                            {isOverStock && (
                              <span style={{ color: '#EF4444', fontSize: '0.72rem', fontWeight: 700 }}>
                                Exceeds Stock!
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Qty +/- and direct edit */}
                        <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              backgroundColor: '#15181E',
                              border: isOverStock ? '1px solid #EF4444' : '1px solid #262B36',
                              borderRadius: '8px',
                              overflow: 'hidden',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.id, item.qty - 1)}
                              style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#9CA3AF',
                                width: '24px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10)
                                handleUpdateQty(item.id, isNaN(val) ? 1 : val)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  searchInputRef.current?.focus()
                                }
                              }}
                              style={{
                                width: '38px',
                                height: '28px',
                                textAlign: 'center',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#F9FAFB',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                outline: 'none',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.id, item.qty + 1)}
                              style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#9CA3AF',
                                width: '24px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Unit Price (Price Override) */}
                        <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdatePrice(item.id, parseFloat(e.target.value) || 0)}
                            style={{
                              width: '74px',
                              padding: '0.3rem 0.35rem',
                              backgroundColor: '#15181E',
                              border: '1px solid #262B36',
                              borderRadius: '6px',
                              color: '#F9FAFB',
                              fontSize: '0.85rem',
                              textAlign: 'right',
                              outline: 'none',
                            }}
                          />
                        </td>

                        {/* Item Discount (% or flat ₹ toggle) */}
                        <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              placeholder="0"
                              value={item.discountValue || ''}
                              onChange={(e) =>
                                handleUpdateItemDiscount(
                                  item.id,
                                  item.discountType,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              style={{
                                width: '48px',
                                padding: '0.3rem 0.35rem',
                                backgroundColor: '#15181E',
                                border: '1px solid #262B36',
                                borderRadius: '6px',
                                color: item.discountValue > 0 ? '#10B981' : '#F9FAFB',
                                fontSize: '0.85rem',
                                textAlign: 'right',
                                outline: 'none',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItemDiscount(
                                  item.id,
                                  item.discountType === 'percent' ? 'flat' : 'percent',
                                  item.discountValue
                                )
                              }
                              title="Toggle discount mode"
                              style={{
                                backgroundColor: item.discountValue > 0 ? 'rgba(16, 185, 129, 0.15)' : '#262B36',
                                color: item.discountValue > 0 ? '#10B981' : '#9CA3AF',
                                border: '1px solid #374151',
                                borderRadius: '6px',
                                padding: '0.3rem 0.4rem',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {item.discountType === 'percent' ? '%' : '₹'}
                            </button>
                          </div>
                        </td>

                        {/* GST Rate Badge */}
                        <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                          <span
                            style={{
                              backgroundColor: 'rgba(245, 158, 11, 0.12)',
                              color: '#F59E0B',
                              border: '1px solid rgba(245, 158, 11, 0.25)',
                              borderRadius: '4px',
                              padding: '2px 5px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                            }}
                          >
                            {item.gstRate}%
                          </span>
                        </td>

                        {/* Line Total */}
                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, color: '#F9FAFB', fontSize: '0.92rem' }}>
                            ₹{item.lineTotal.toFixed(2)}
                          </span>
                        </td>

                        {/* Delete Row Button */}
                        <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            title="Remove item (Del)"
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: '#9CA3AF',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Bottom Bar on Left Column: Held Bills, Invoices & Shortcuts */}
          <div
            style={{
              padding: '0.65rem 1rem',
              backgroundColor: '#15181E',
              borderTop: '1px solid #262B36',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleHoldBill}
                disabled={cart.length === 0}
                style={{
                  backgroundColor: '#1C2028',
                  border: '1px solid #262B36',
                  color: cart.length === 0 ? '#4B5563' : '#D1D5DB',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Hold (Ctrl+H)
              </button>

              <button
                type="button"
                onClick={() => setShowHeldBillsModal(true)}
                style={{
                  backgroundColor: heldBillsCount > 0 ? 'rgba(59, 130, 246, 0.15)' : '#1C2028',
                  border: `1px solid ${heldBillsCount > 0 ? 'rgba(59, 130, 246, 0.3)' : '#262B36'}`,
                  color: heldBillsCount > 0 ? '#60A5FA' : '#9CA3AF',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>Held Bills</span>
                <span
                  style={{
                    backgroundColor: heldBillsCount > 0 ? '#3B82F6' : '#262B36',
                    color: '#FFFFFF',
                    padding: '1px 5px',
                    borderRadius: '10px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                  }}
                >
                  {heldBillsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowInvoicesHistoryModal(true)}
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#F59E0B',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>Past Invoices / PDF</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6B7280', fontSize: '0.75rem' }}>
              <span>F2: New</span>
              <span>&bull;</span>
              <span>F4: Search</span>
              <span>&bull;</span>
              <span>Ctrl+S: Save</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: SUMMARY PANEL (CUSTOMER, TOTALS, PAYMENT)  */}
        {/* ========================================================= */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#15181E',
            height: '100%',
            overflowY: 'auto',
            borderLeft: '1px solid #262B36',
          }}
        >
          {/* Section 1: Customer Selection */}
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #262B36' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>
                Customer (Walk-in Default)
              </label>
              <button
                type="button"
                onClick={() => setShowQuickCustomerModal(true)}
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
                + New Customer
              </button>
            </div>

            {selectedCustomer ? (
              <div
                style={{
                  backgroundColor: '#1C2028',
                  border: '1px solid #262B36',
                  borderRadius: '8px',
                  padding: '0.55rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#F9FAFB', fontSize: '0.88rem' }}>
                    {selectedCustomer.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                    {selectedCustomer.phone ? `Ph: ${selectedCustomer.phone}` : 'No Phone'}
                    {selectedCustomer.credit_balance > 0 && (
                      <span style={{ color: '#EF4444', marginLeft: '6px', fontWeight: 600 }}>
                        &bull; Bal: ₹{selectedCustomer.credit_balance.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  title="Remove customer / Revert to Walk-in"
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input
                  ref={customerSearchRef}
                  type="text"
                  placeholder="Search customer by name or phone..."
                  value={customerSearchQuery}
                  onChange={(e) => {
                    setCustomerSearchQuery(e.target.value)
                    setIsCustomerDropdownOpen(true)
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    backgroundColor: '#0C0E12',
                    border: '1px solid #262B36',
                    borderRadius: '8px',
                    color: '#F9FAFB',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                />

                {isCustomerDropdownOpen && customerSearchQuery.trim() && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      backgroundColor: '#1C2028',
                      border: '1px solid #262B36',
                      borderRadius: '8px',
                      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.4)',
                      zIndex: 40,
                      maxHeight: '180px',
                      overflowY: 'auto',
                    }}
                  >
                    {filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c)
                          setCustomerSearchQuery('')
                          setIsCustomerDropdownOpen(false)
                        }}
                        style={{
                          padding: '0.45rem 0.65rem',
                          borderBottom: '1px solid #262B36',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#262B36')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#F9FAFB' }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                          {c.phone || 'No phone'} {c.credit_balance > 0 ? `| Bal: ₹${c.credit_balance}` : ''}
                        </div>
                      </div>
                    ))}
                    <div
                      onClick={() => {
                        setShowQuickCustomerModal(true)
                        setIsCustomerDropdownOpen(false)
                      }}
                      style={{
                        padding: '0.45rem 0.65rem',
                        color: '#F59E0B',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'center',
                        backgroundColor: '#15181E',
                      }}
                    >
                      + Add "{customerSearchQuery}" as New Customer
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Bill Discounts & Round-Off */}
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #262B36' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>
                Overall Bill Discount
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <button
                  type="button"
                  onClick={() => setBillDiscountType('percent')}
                  style={{
                    backgroundColor: billDiscountType === 'percent' ? '#F59E0B' : '#1C2028',
                    color: billDiscountType === 'percent' ? '#000' : '#9CA3AF',
                    border: '1px solid #262B36',
                    borderRadius: '4px',
                    padding: '1px 6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setBillDiscountType('flat')}
                  style={{
                    backgroundColor: billDiscountType === 'flat' ? '#F59E0B' : '#1C2028',
                    color: billDiscountType === 'flat' ? '#000' : '#9CA3AF',
                    border: '1px solid #262B36',
                    borderRadius: '4px',
                    padding: '1px 6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ₹
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder={billDiscountType === 'percent' ? 'Discount % (e.g. 5)' : 'Flat Discount ₹ (e.g. 50)'}
                value={billDiscountValue || ''}
                onChange={(e) => setBillDiscountValue(parseFloat(e.target.value) || 0)}
                style={{
                  flex: 1,
                  padding: '0.4rem 0.6rem',
                  backgroundColor: '#0C0E12',
                  border: '1px solid #262B36',
                  borderRadius: '6px',
                  color: '#F9FAFB',
                  fontSize: '0.82rem',
                }}
              />
              {totals.billDiscountAmount > 0 && (
                <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  -₹{totals.billDiscountAmount.toFixed(2)}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.65rem' }}>
              <label style={{ fontSize: '0.78rem', color: '#D1D5DB', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={roundOffEnabled}
                  onChange={(e) => setRoundOffEnabled(e.target.checked)}
                  style={{ accentColor: '#F59E0B' }}
                />
                <span>Round-off Grand Total</span>
              </label>
              {roundOffEnabled && totals.roundOff !== 0 && (
                <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                  {totals.roundOff > 0 ? `+₹${totals.roundOff.toFixed(2)}` : `-₹${Math.abs(totals.roundOff).toFixed(2)}`}
                </span>
              )}
            </div>
          </div>

          {/* Section 3: Tax Slab Breakdown */}
          {totals.gstBreakdown.length > 0 && (
            <div style={{ padding: '0.65rem 1rem', borderBottom: '1px solid #262B36', backgroundColor: '#11141A' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '3px' }}>
                GST Breakdown (CGST + SGST)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.72rem' }}>
                {totals.gstBreakdown.map((s) => (
                  <div key={s.rate} style={{ display: 'flex', justifyContent: 'space-between', color: '#9CA3AF' }}>
                    <span>
                      GST {s.rate}% (Taxable: ₹{s.taxableAmount.toFixed(2)})
                    </span>
                    <span style={{ color: '#E5E7EB' }}>
                      C: ₹{s.cgst.toFixed(2)} + S: ₹{s.sgst.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Running Totals Display */}
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #262B36', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#9CA3AF' }}>
              <span>Taxable Subtotal:</span>
              <span style={{ color: '#F3F4F6' }}>₹{totals.rawSubtotal.toFixed(2)}</span>
            </div>

            {totals.billDiscountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#10B981' }}>
                <span>Bill Discount:</span>
                <span>-₹{totals.billDiscountAmount.toFixed(2)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#9CA3AF' }}>
              <span>CGST:</span>
              <span style={{ color: '#F3F4F6' }}>₹{totals.totalCgst.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#9CA3AF' }}>
              <span>SGST:</span>
              <span style={{ color: '#F3F4F6' }}>₹{totals.totalSgst.toFixed(2)}</span>
            </div>

            {roundOffEnabled && totals.roundOff !== 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#9CA3AF' }}>
                <span>Round off:</span>
                <span style={{ color: totals.roundOff > 0 ? '#10B981' : '#F59E0B' }}>
                  {totals.roundOff > 0 ? `+₹${totals.roundOff.toFixed(2)}` : `-₹${Math.abs(totals.roundOff).toFixed(2)}`}
                </span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                borderTop: '1px solid #262B36',
                paddingTop: '0.5rem',
                marginTop: '0.2rem',
              }}
            >
              <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#F9FAFB' }}>Grand Total:</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F59E0B' }}>
                ₹{totals.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Section 5: Payment Controls */}
          <div style={{ padding: '0.85rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                Payment Mode
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {(['CASH', 'UPI'] as ('CASH' | 'UPI')[]).map((mode) => {
                  const isActive = paymentMode === mode
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setPaymentMode(mode)
                        if (mode === 'UPI') {
                          setCashTendered('')
                        }
                      }}
                      style={{
                        backgroundColor: isActive ? '#F59E0B' : '#1C2028',
                        color: isActive ? '#000000' : '#D1D5DB',
                        border: `1px solid ${isActive ? '#F59E0B' : '#262B36'}`,
                        borderRadius: '8px',
                        padding: '0.55rem 0.5rem',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>{mode === 'CASH' ? '💵' : '📱'}</span>
                      <span>{mode}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Cash Tendered & Change Return (Only for Cash mode) */}
            {paymentMode === 'CASH' && (
              <div
                style={{
                  backgroundColor: '#1C2028',
                  border: '1px solid #262B36',
                  borderRadius: '8px',
                  padding: '0.65rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.7rem', color: '#9CA3AF', display: 'block', marginBottom: '2px' }}>
                    Cash Received (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder={totals.grandTotal.toString()}
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.35rem 0.5rem',
                      backgroundColor: '#0C0E12',
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      color: '#F9FAFB',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                    }}
                  />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Change Due:</span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: changeDue > 0 ? '#10B981' : '#6B7280' }}>
                    ₹{changeDue.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Amount Paid Now (Protected with Auto-Full by Default & Explicit Edit Flow for BOTH Cash and UPI) */}
            <div
              style={{
                backgroundColor: '#1C2028',
                border: totals.amountDue > 0 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid #262B36',
                borderRadius: '8px',
                padding: '0.65rem 0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '0.72rem', color: '#D1D5DB', fontWeight: 600 }}>
                    Amount Paid Now (₹)
                  </label>
                  {isCustomAmountPaid ? (
                    <span
                      style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#F59E0B',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                      }}
                    >
                      Partial Edit Mode
                    </span>
                  ) : totals.amountDue > 0 ? (
                    <span
                      style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#F59E0B',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                      }}
                    >
                      Partial Payment
                    </span>
                  ) : (
                    <span
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#10B981',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                      }}
                    >
                      Auto (Full Payment)
                    </span>
                  )}
                </div>

                {/* <div>
                  {!isCustomAmountPaid ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomAmountPaid(true)
                        setAmountPaidNow(totals.amountPaid.toString())
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#F59E0B',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                      }}
                    >
                      Edit / Record Baki-Due
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomAmountPaid(false)
                        setAmountPaidNow(totals.grandTotal.toString())
                        if (paymentMode === 'CASH') {
                          setCashTendered('')
                        }
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#60A5FA',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                      }}
                    >
                      Reset to Full
                    </button>
                  )}
                </div> */}
              </div>

              <input
                type="number"
                step="0.01"
                min="0"
                max={totals.grandTotal}
                disabled={!isCustomAmountPaid}
                readOnly={!isCustomAmountPaid}
                value={isCustomAmountPaid ? amountPaidNow : totals.amountPaid.toFixed(2)}
                onChange={(e) => {
                  if (isCustomAmountPaid) {
                    setAmountPaidNow(e.target.value)
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  backgroundColor: isCustomAmountPaid ? '#0C0E12' : '#11141A',
                  border: isCustomAmountPaid ? '1px solid #F59E0B' : '1px solid #262B36',
                  borderRadius: '6px',
                  color: '#F9FAFB',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: isCustomAmountPaid ? 'text' : 'not-allowed',
                  outline: 'none',
                }}
              />

              {totals.amountDue > 0 && (
                <div
                  style={{
                    marginTop: '0.45rem',
                    padding: '0.4rem 0.6rem',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: '#FCD34D', fontWeight: 600 }}>
                    Baki / Due Balance:
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F59E0B' }}>
                    ₹{totals.amountDue.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Validation warning only when there is ACTUAL due balance without customer */}
            {totals.amountDue > 0 && !selectedCustomer && (
              <div
                style={{
                  fontSize: '0.74rem',
                  color: '#EF4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '6px',
                  lineHeight: 1.3,
                }}
              >
                &bull; Please select or add a Customer above to track this ₹{totals.amountDue.toFixed(2)} pending balance.
              </div>
            )}
          </div>

          {/* Save & Generate Invoice Button */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderTop: '1px solid #262B36',
              backgroundColor: '#11141A',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
            }}
          >
            <button
              type="button"
              onClick={handleSaveInvoice}
              disabled={isSaving || cart.length === 0}
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                backgroundColor: cart.length === 0 ? '#262B36' : '#F59E0B',
                border: 'none',
                borderRadius: '10px',
                color: cart.length === 0 ? '#6B7280' : '#000000',
                fontSize: '0.98rem',
                fontWeight: 700,
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: cart.length > 0 ? '0 4px 14px 0 rgba(245, 158, 11, 0.39)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{isSaving ? 'Processing Invoice...' : 'Save & Generate Invoice (Ctrl+S)'}</span>
            </button>

            <button
              type="button"
              onClick={handleNewBill}
              style={{
                width: '100%',
                padding: '0.35rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#9CA3AF',
                fontSize: '0.78rem',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Reset / New Bill (F2)
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Quick Add Product Modal */}
      {showQuickProductModal && (
        <QuickAddProductModal
          initialSearchQuery={notFoundQuery}
          onClose={() => {
            setShowQuickProductModal(false)
            searchInputRef.current?.focus()
          }}
          onProductCreated={(newProduct) => {
            setProducts((prev) => [newProduct, ...prev])
            addProductToCart(newProduct)
            showToast(`Product "${newProduct.name}" created and added to ticket!`, 'success')
          }}
        />
      )}

      {/* 2. Quick Add Customer Modal */}
      {showQuickCustomerModal && (
        <QuickAddCustomerModal
          initialPhoneOrName={customerSearchQuery}
          onClose={() => {
            setShowQuickCustomerModal(false)
            searchInputRef.current?.focus()
          }}
          onCustomerAdded={(newCust) => {
            setCustomers((prev) => [newCust, ...prev])
            setSelectedCustomer(newCust)
            setCustomerSearchQuery('')
            showToast(`Customer "${newCust.name}" added and selected!`, 'success')
          }}
        />
      )}

      {/* 3. Held Bills Modal */}
      {showHeldBillsModal && (
        <HeldBillsModal
          onClose={() => {
            setShowHeldBillsModal(false)
            searchInputRef.current?.focus()
          }}
          onResumeBill={handleResumeBill}
        />
      )}

      {/* 4. Past Invoices / PDF History Modal */}
      {showInvoicesHistoryModal && (
        <InvoicesHistoryModal
          onClose={() => {
            setShowInvoicesHistoryModal(false)
            searchInputRef.current?.focus()
          }}
          onSelectInvoice={handleViewInvoiceById}
        />
      )}

      {/* 5. Invoice Receipt & PDF Print Preview Modal */}
      {showPreviewModal && currentSavedInvoice && (
        <InvoicePreviewModal
          invoice={currentSavedInvoice}
          onClose={() => {
            setShowPreviewModal(false)
            setCurrentSavedInvoice(null)
            searchInputRef.current?.focus()
          }}
          onInvoiceCancelled={() => {
            showToast('Invoice was cancelled and stock has been restored', 'warn')
            loadInitialData()
          }}
          onPaymentRecorded={() => {
            showToast('Due payment recorded successfully!', 'success')
            loadInitialData()
          }}
        />
      )}
    </div>
  )
}
