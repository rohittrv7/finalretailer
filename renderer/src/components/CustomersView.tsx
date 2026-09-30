import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Customer, CustomerLedgerEntry, Invoice, InvoiceItem } from '../vite-env'
import { InvoicePreviewModal } from './InvoicePreviewModal'

interface CustomersViewProps {
  initialSearchQuery?: string
}

type TabType = 'ALL' | 'PENDING_DUES'
type SortType = 'highest_due' | 'recently_active' | 'name'
type DetailTabType = 'LEDGER' | 'INVOICES'

export const CustomersView: React.FC<CustomersViewProps> = ({ initialSearchQuery = '' }) => {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<TabType>('ALL')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery)
  const [sortBy, setSortBy] = useState<SortType>('highest_due')

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Modals & Panels
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  // Form State
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formGstin, setFormGstin] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formOpeningBalance, setFormOpeningBalance] = useState('0')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<Customer | null>(null)

  // Customer Detail Drawer / Modal
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTabType>('LEDGER')
  const [customerLedger, setCustomerLedger] = useState<CustomerLedgerEntry[]>([])
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Payment Recording Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER'>('CASH')
  const [paymentSpecificInvoiceId, setPaymentSpecificInvoiceId] = useState<number | null>(null)
  const [paymentNotes, setPaymentNotes] = useState('')
  const [isRecordingPayment, setIsRecordingPayment] = useState(false)

  // Invoice Preview Modal
  const [previewInvoice, setPreviewInvoice] = useState<(Invoice & { items?: InvoiceItem[] }) | null>(null)

  // Archive / Soft-delete Info Modal
  const [archiveNotice, setArchiveNotice] = useState<string | null>(null)

  // Fetch all active customers
  const fetchCustomers = useCallback(async () => {
    if (!window.electronAPI?.db?.customers) return
    try {
      setLoading(true)
      const data = await window.electronAPI.db.customers.getAll()
      setCustomers(data)
    } catch (err) {
      console.error('Failed to load customers', err)
      showToast('Error loading customer list')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery)
    }
  }, [initialSearchQuery])

  // Fetch customer detail data (ledger & invoices)
  const loadCustomerDetails = useCallback(async (cust: Customer) => {
    if (!window.electronAPI?.db) return
    setLoadingDetails(true)
    try {
      const [freshCust, ledgerData, invoicesData] = await Promise.all([
        window.electronAPI.db.customers.getById(cust.id),
        window.electronAPI.db.customers.getLedger(cust.id),
        window.electronAPI.db.invoices.getAll({ customerId: cust.id }),
      ])
      if (freshCust) {
        setDetailCustomer(freshCust)
      } else {
        setDetailCustomer(cust)
      }
      setCustomerLedger(ledgerData)
      setCustomerInvoices(invoicesData)
    } catch (err) {
      console.error('Failed to load customer details', err)
      showToast('Error loading customer ledger')
    } finally {
      setLoadingDetails(false)
    }
  }, [])

  const openCustomerDetail = (cust: Customer, defaultTab: DetailTabType = 'LEDGER') => {
    setDetailCustomer(cust)
    setDetailTab(defaultTab)
    loadCustomerDetails(cust)
  }

  // Filtered & Sorted Customers
  const filteredAndSortedCustomers = useMemo(() => {
    let list = [...customers]

    // Tab filter
    if (activeTab === 'PENDING_DUES') {
      list = list.filter((c) => (c.credit_balance || 0) > 0)
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.toLowerCase().includes(q)) ||
          (c.gstin && c.gstin.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q))
      )
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'highest_due') {
        const diff = (b.credit_balance || 0) - (a.credit_balance || 0)
        if (diff !== 0) return diff
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'recently_active') {
        const dateA = a.last_transaction_date ? new Date(a.last_transaction_date).getTime() : 0
        const dateB = b.last_transaction_date ? new Date(b.last_transaction_date).getTime() : 0
        return dateB - dateA
      }
      return 0
    })

    return list
  }, [customers, activeTab, searchQuery, sortBy])

  // Summary statistics
  const stats = useMemo(() => {
    const totalCount = customers.length
    const debtors = customers.filter((c) => (c.credit_balance || 0) > 0)
    const debtorsCount = debtors.length
    const totalCredit = debtors.reduce((acc, c) => acc + (c.credit_balance || 0), 0)
    const topDebtor = debtors.length > 0
      ? [...debtors].sort((a, b) => (b.credit_balance || 0) - (a.credit_balance || 0))[0]
      : null

    return { totalCount, debtorsCount, totalCredit, topDebtor }
  }, [customers])

  // Check phone duplicate
  const checkPhoneDuplicate = async (phone: string): Promise<Customer | null> => {
    if (!phone.trim() || !window.electronAPI?.db?.customers?.findByPhone) return null
    try {
      const existing = await window.electronAPI.db.customers.findByPhone(phone.trim())
      if (existing && (!editingCustomer || existing.id !== editingCustomer.id)) {
        return existing
      }
    } catch (err) {
      console.error('Phone duplicate check error', err)
    }
    return null
  }

  // Handle open Add/Edit Modal
  const handleOpenAddModal = () => {
    setEditingCustomer(null)
    setFormName('')
    setFormPhone('')
    setFormGstin('')
    setFormAddress('')
    setFormOpeningBalance('0')
    setDuplicateWarning(null)
    setIsAddEditModalOpen(true)
  }

  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust)
    setFormName(cust.name)
    setFormPhone(cust.phone || '')
    setFormGstin(cust.gstin || '')
    setFormAddress(cust.address || '')
    setFormOpeningBalance((cust.credit_balance || 0).toString())
    setDuplicateWarning(null)
    setIsAddEditModalOpen(true)
  }

  // Save Customer (Add or Edit)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      showToast('Customer name is required')
      return
    }
    if (!formPhone.trim()) {
      showToast('Customer phone number is required')
      return
    }

    try {
      setFormSubmitting(true)

      const dup = await checkPhoneDuplicate(formPhone)
      if (dup) {
        setDuplicateWarning(dup)
        setFormSubmitting(false)
        return
      }

      if (editingCustomer) {
        await window.electronAPI!.db.customers.update(editingCustomer.id, {
          name: formName.trim(),
          phone: formPhone.trim(),
          gstin: formGstin.trim() || null,
          address: formAddress.trim() || null,
        })
        showToast(`Updated customer: ${formName.trim()}`)
      } else {
        await window.electronAPI!.db.customers.create({
          name: formName.trim(),
          phone: formPhone.trim(),
          gstin: formGstin.trim() || null,
          address: formAddress.trim() || null,
          credit_balance: parseFloat(formOpeningBalance) || 0,
        })
        showToast(`Registered customer: ${formName.trim()}`)
      }

      setIsAddEditModalOpen(false)
      await fetchCustomers()

      if (detailCustomer && editingCustomer && detailCustomer.id === editingCustomer.id) {
        await loadCustomerDetails(editingCustomer)
      }
    } catch (err) {
      console.error('Failed to save customer', err)
      showToast('Error saving customer record')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Delete Customer
  const handleDeleteCustomer = async (cust: Customer) => {
    if (!window.confirm(`Delete customer "${cust.name}"?`)) return

    try {
      const res = await window.electronAPI!.db.customers.delete(cust.id)
      if (res.softDeleted) {
        setArchiveNotice(
          res.reason ||
            `Customer "${cust.name}" has invoice records and was archived to preserve billing history.`
        )
      } else {
        showToast(`Customer "${cust.name}" deleted`)
      }
      if (detailCustomer?.id === cust.id) {
        setDetailCustomer(null)
      }
      await fetchCustomers()
    } catch (err: any) {
      console.error('Failed to delete customer', err)
      showToast(err?.message || 'Error deleting customer')
    }
  }

  // Open Record Payment Modal
  const handleOpenPaymentModal = (cust: Customer, specificInvoiceId?: number) => {
    setPaymentCustomer(cust)
    const unpaidBal = cust.credit_balance || 0

    if (specificInvoiceId) {
      setPaymentSpecificInvoiceId(specificInvoiceId)
      const inv = customerInvoices.find((i) => i.id === specificInvoiceId)
      setPaymentAmount(inv?.amount_due ? inv.amount_due.toString() : unpaidBal.toString())
    } else {
      setPaymentSpecificInvoiceId(null)
      setPaymentAmount(unpaidBal > 0 ? unpaidBal.toString() : '')
    }

    setPaymentMode('CASH')
    setPaymentNotes('')
    setIsPaymentModalOpen(true)
  }

  // Submit Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentCustomer) return

    const amt = parseFloat(paymentAmount)
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter an amount greater than ₹0')
      return
    }

    try {
      setIsRecordingPayment(true)
      const res = await window.electronAPI!.db.customers.recordPayment({
        customerId: paymentCustomer.id,
        amount: amt,
        paymentMode,
        invoiceId: paymentSpecificInvoiceId,
        notes: paymentNotes.trim() || null,
      })

      showToast(`Payment of ₹${amt.toLocaleString()} recorded`)
      setIsPaymentModalOpen(false)
      await fetchCustomers()

      if (detailCustomer && detailCustomer.id === paymentCustomer.id) {
        await loadCustomerDetails(res.customer)
      }
    } catch (err: any) {
      console.error('Failed to record payment', err)
      showToast(err?.message || 'Failed to record payment')
    } finally {
      setIsRecordingPayment(false)
    }
  }

  // Preview Invoice
  const handlePreviewInvoice = async (invoiceId: number) => {
    if (!window.electronAPI?.db?.invoices?.getById) return
    try {
      const inv = await window.electronAPI.db.invoices.getById(invoiceId)
      if (inv) {
        setPreviewInvoice(inv)
      } else {
        showToast('Invoice details not found')
      }
    } catch (err) {
      console.error('Failed to fetch invoice preview', err)
      showToast('Could not load invoice preview')
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0C0E12] select-none text-[#F3F4F6] overflow-hidden">
      {/* Top Header: Clean, single primary hierarchy */}
      <header className="px-5 py-4 border-b border-[#262B36]/80 bg-[#12151B] shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Customer Management</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Customer accounts, outstanding khata balance, and payment history
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Unified compact balance summary */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181B22] border border-[#262B36] text-xs">
              <span className="text-gray-400">Total Due:</span>
              <span className="font-mono font-bold text-amber-400">
                ₹{stats.totalCredit.toLocaleString('en-IN')}
              </span>
              {stats.topDebtor && (stats.topDebtor.credit_balance || 0) > 0 && (
                <>
                  <span className="text-gray-600">|</span>
                  <span className="text-gray-400">
                    Highest:{' '}
                    <strong className="text-gray-200 font-medium">{stats.topDebtor.name}</strong>{' '}
                    <span className="text-amber-400 font-mono">
                      (₹{(stats.topDebtor.credit_balance || 0).toLocaleString('en-IN')})
                    </span>
                  </span>
                </>
              )}
            </div>

            {/* Neutral Register Button (Amber reserved only for dues) */}
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="h-9 px-3.5 rounded-lg bg-[#222732] hover:bg-[#2C3342] text-white border border-[#343B4A] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <span className="text-base leading-none text-gray-300">+</span>
              <span>Register Customer</span>
            </button>
          </div>
        </div>

        {/* Clean Underline Tabs */}
        <div className="flex items-center gap-6 mt-4 border-b border-[#262B36]/50">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`pb-2.5 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 -mb-px ${
              activeTab === 'ALL'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>All Customers</span>
            <span className="text-[11px] text-gray-500">({stats.totalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PENDING_DUES')}
            className={`pb-2.5 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 -mb-px ${
              activeTab === 'PENDING_DUES'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-amber-300'
            }`}
          >
            <span>Pending Dues Report</span>
            {stats.debtorsCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                {stats.debtorsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
        {/* Left Section: Customer List */}
        <div className="flex-1 flex flex-col min-h-0 p-4 space-y-3 overflow-hidden">
          {/* Flat, Clean Search & Sort */}
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer name or phone..."
                className="w-full h-9 pl-8 pr-7 rounded-lg bg-[#14171E] border border-[#262B36] text-xs text-[#F3F4F6] placeholder:text-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-gray-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="h-9 px-2.5 rounded-lg bg-[#14171E] border border-[#262B36] text-xs text-gray-300 focus:outline-none focus:border-gray-400 cursor-pointer"
              >
                <option value="highest_due">Highest Due</option>
                <option value="recently_active">Recently Active</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Customer Table: 3 Clean, well-spaced columns that fit properly */}
          <div className="flex-1 bg-[#14171E] border border-[#222733] rounded-xl overflow-hidden flex flex-col min-h-0 shadow-sm">
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#181C24] text-gray-400 uppercase text-[10px] tracking-wider font-semibold border-b border-[#262B36] sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Customer</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Khata Balance</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222733] font-normal">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-500">
                        Loading customers...
                      </td>
                    </tr>
                  ) : filteredAndSortedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-10 text-center text-gray-500 space-y-1">
                        <p className="font-medium text-gray-300">No customers found</p>
                        <p className="text-[11px]">
                          {searchQuery
                            ? 'No matches for your search query.'
                            : activeTab === 'PENDING_DUES'
                            ? 'All customer accounts are clear!'
                            : 'Click "+ Register Customer" to add one.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedCustomers.map((cust) => {
                      const balance = cust.credit_balance || 0
                      const hasDue = balance > 0
                      const isSelected = detailCustomer?.id === cust.id

                      return (
                        <tr
                          key={cust.id}
                          onClick={() => openCustomerDetail(cust)}
                          className={`hover:bg-[#1C202A] transition-colors cursor-pointer ${
                            isSelected ? 'bg-[#1D222D] font-medium' : ''
                          }`}
                        >
                          {/* Column 1: Customer Name + Phone */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white text-sm">
                              {cust.name}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                              <span>{cust.phone || 'No phone'}</span>
                              {cust.gstin && (
                                <span className="text-gray-500 text-[10px]">GST: {cust.gstin}</span>
                              )}
                            </div>
                          </td>

                          {/* Column 2: Only ONE highlight badge for due */}
                          <td className="py-3 px-4 text-right font-mono">
                            {hasDue ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs">
                                ₹{balance.toLocaleString('en-IN')} Due
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs">₹0</span>
                            )}
                          </td>

                          {/* Column 3: Actions */}
                          <td className="py-3 px-4 text-right">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {hasDue && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPaymentModal(cust)}
                                  className="h-6 px-2 rounded bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-[11px] font-semibold transition-all cursor-pointer"
                                  title="Record payment"
                                >
                                  Pay
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(cust)}
                                className="h-6 w-6 rounded bg-[#202530] hover:bg-[#2B3242] text-gray-400 hover:text-white text-xs transition-colors flex items-center justify-center cursor-pointer"
                                title="Edit"
                              >
                                ✏️
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteCustomer(cust)}
                                className="h-6 w-6 rounded bg-red-950/20 hover:bg-red-900/40 text-red-400 text-xs transition-colors flex items-center justify-center cursor-pointer"
                                title="Delete"
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

            <div className="px-4 py-2 bg-[#181C24] border-t border-[#262B36] text-[11px] text-gray-500 flex items-center justify-between">
              <span>{filteredAndSortedCustomers.length} customers listed</span>
              <span className="text-gray-600">Click any row to open khata ledger</span>
            </div>
          </div>
        </div>

        {/* Right Section: Customer Detail & Khata Passbook Panel */}
        {detailCustomer && (
          <div className="w-full md:w-[460px] lg:w-[500px] border-t md:border-t-0 md:border-l border-[#262B36] bg-[#11141A] flex flex-col shrink-0 min-h-0 animate-fade-in">
            {/* Header: Clean name + phone, no duplicate tags */}
            <div className="p-4 border-b border-[#262B36]/60 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">{detailCustomer.name}</h2>
                <div className="text-xs text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                  <span>{detailCustomer.phone || 'No phone'}</span>
                  {detailCustomer.gstin && (
                    <span className="text-gray-500">GST: {detailCustomer.gstin}</span>
                  )}
                </div>
                {detailCustomer.address && (
                  <div className="text-[11px] text-gray-500 mt-1">📍 {detailCustomer.address}</div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(detailCustomer)}
                  className="px-2.5 py-1 rounded bg-[#202530] hover:bg-[#2C3342] text-gray-300 text-xs transition-colors cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDetailCustomer(null)}
                  className="w-7 h-7 rounded bg-[#202530] hover:bg-[#2C3342] text-gray-400 hover:text-white text-xs transition-colors flex items-center justify-center cursor-pointer"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Outstanding Due Summary: Prominent yet unboxed */}
            <div className="px-4 py-3 bg-[#151922] border-b border-[#262B36]/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                  Outstanding Due
                </span>
                <div className="text-2xl font-bold font-mono text-amber-400">
                  ₹{(detailCustomer.credit_balance || 0).toLocaleString('en-IN')}
                </div>
              </div>

              {(detailCustomer.credit_balance || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => handleOpenPaymentModal(detailCustomer)}
                  className="h-8 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow transition-all cursor-pointer active:scale-95"
                >
                  Record Payment
                </button>
              )}
            </div>

            {/* Sub-tabs: Running Ledger vs Invoices */}
            <div className="flex border-b border-[#262B36]/60 px-4 pt-2 gap-4">
              <button
                type="button"
                onClick={() => setDetailTab('LEDGER')}
                className={`pb-2 text-xs font-semibold transition-all border-b-2 cursor-pointer ${
                  detailTab === 'LEDGER'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                Khata Passbook
              </button>

              <button
                type="button"
                onClick={() => setDetailTab('INVOICES')}
                className={`pb-2 text-xs font-semibold transition-all border-b-2 cursor-pointer ${
                  detailTab === 'INVOICES'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                Invoices ({customerInvoices.length})
              </button>
            </div>

            {/* Sub-tab Content */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {loadingDetails ? (
                <div className="p-8 text-center text-gray-500">
                  Loading ledger...
                </div>
              ) : detailTab === 'LEDGER' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pb-1">
                    <span>Transaction History</span>
                    <span className="text-[10px] text-gray-500">Amber = Due Added, Green = Paid</span>
                  </div>

                  {customerLedger.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 bg-[#14171E] rounded-xl border border-[#222733]">
                      <p className="font-medium text-gray-300">No transactions recorded</p>
                      <p className="text-[11px] mt-0.5">Bills with dues and recorded payments will appear here.</p>
                    </div>
                  ) : (
                    <div className="bg-[#14171E] border border-[#222733] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse font-mono">
                        <thead className="bg-[#181C24] text-gray-400 text-[10px] uppercase border-b border-[#262B36]">
                          <tr>
                            <th className="py-2 px-2.5">Date</th>
                            <th className="py-2 px-2.5">Particulars</th>
                            <th className="py-2 px-2.5 text-right text-amber-400">Due (+)</th>
                            <th className="py-2 px-2.5 text-right text-emerald-400">Paid (-)</th>
                            <th className="py-2 px-2.5 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222733] text-[11px]">
                          {customerLedger.map((entry) => (
                            <tr key={entry.id} className="hover:bg-[#1A1E27] transition-colors">
                              <td className="py-2 px-2.5 text-gray-400 whitespace-nowrap">
                                {new Date(entry.date).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                })}
                              </td>
                              <td className="py-2 px-2.5 font-sans">
                                <div className="text-gray-200 text-xs">{entry.description}</div>
                                {entry.refNo && (
                                  <div className="text-[10px] text-gray-500 font-mono">
                                    Ref: {entry.refNo}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-2.5 text-right text-amber-400 font-semibold">
                                {entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN')}` : '—'}
                              </td>
                              <td className="py-2 px-2.5 text-right text-emerald-400 font-semibold">
                                {entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN')}` : '—'}
                              </td>
                              <td className="py-2 px-2.5 text-right font-bold text-white">
                                ₹{entry.balance.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {customerInvoices.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 bg-[#14171E] rounded-xl border border-[#222733]">
                      <p className="font-medium text-gray-300">No invoices found</p>
                    </div>
                  ) : (
                    customerInvoices.map((inv) => {
                      const isCancelled = inv.status === 'CANCELLED'
                      const isFullyPaid = inv.status === 'PAID' || (inv.amount_due || 0) <= 0

                      return (
                        <div
                          key={inv.id}
                          className="bg-[#14171E] border border-[#222733] rounded-lg p-3 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white">{inv.invoice_no}</span>
                              {isCancelled ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-900/40 font-semibold">
                                  Voided
                                </span>
                              ) : isFullyPaid ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 font-semibold">
                                  Paid
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-900/40 font-semibold">
                                  Due: ₹{(inv.amount_due || 0).toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-500">
                              {new Date(inv.date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-[#222733]">
                            <span className="text-gray-400 font-mono">
                              Total: <strong className="text-white">₹{inv.total.toLocaleString('en-IN')}</strong>
                            </span>
                            <div className="flex items-center gap-2">
                              {!isCancelled && (inv.amount_due || 0) > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPaymentModal(detailCustomer, inv.id)}
                                  className="text-[11px] text-emerald-400 hover:underline font-semibold"
                                >
                                  Pay Bill
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handlePreviewInvoice(inv.id)}
                                className="text-[11px] text-gray-400 hover:text-white underline cursor-pointer"
                              >
                                View PDF
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14171E] border border-[#262B36] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-[#262B36] pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingCustomer ? 'Edit Customer Details' : 'Register New Customer'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-[#1F232D] text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {duplicateWarning && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>Phone number already registered</span>
                </div>
                <p className="text-[11px] text-gray-300">
                  Customer <strong>{duplicateWarning.name}</strong> has this phone number (Balance: ₹{(duplicateWarning.credit_balance || 0).toLocaleString('en-IN')}).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddEditModalOpen(false)
                    openCustomerDetail(duplicateWarning)
                  }}
                  className="px-2.5 py-1 rounded bg-amber-500 text-black font-bold text-xs cursor-pointer"
                >
                  Open Existing Customer
                </button>
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-gray-400 block mb-1">
                  Customer / Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Ramesh Traders"
                  className="w-full h-9 px-3 rounded-lg bg-[#0C0E12] border border-[#262B36] text-xs text-white focus:outline-none focus:border-gray-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-400 block mb-1">
                  Mobile / Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => {
                    setFormPhone(e.target.value)
                    setDuplicateWarning(null)
                  }}
                  onBlur={async () => {
                    if (formPhone.trim() && !editingCustomer) {
                      const dup = await checkPhoneDuplicate(formPhone)
                      if (dup) setDuplicateWarning(dup)
                    }
                  }}
                  placeholder="e.g. 9876543210"
                  className="w-full h-9 px-3 rounded-lg bg-[#0C0E12] border border-[#262B36] text-xs font-mono text-white focus:outline-none focus:border-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-gray-400 block mb-1">
                    GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value.toUpperCase())}
                    placeholder="29AAAAA0000A1Z5"
                    className="w-full h-9 px-3 rounded-lg bg-[#0C0E12] border border-[#262B36] text-xs font-mono text-white focus:outline-none focus:border-gray-400 uppercase"
                  />
                </div>

                {!editingCustomer && (
                  <div>
                    <label className="text-[11px] font-medium text-gray-400 block mb-1">
                      Opening Due (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formOpeningBalance}
                      onChange={(e) => setFormOpeningBalance(e.target.value)}
                      placeholder="0"
                      className="w-full h-9 px-3 rounded-lg bg-[#0C0E12] border border-[#262B36] text-xs font-mono text-white focus:outline-none focus:border-gray-400"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-400 block mb-1">
                  Address (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Shop or street address..."
                  className="w-full p-2.5 rounded-lg bg-[#0C0E12] border border-[#262B36] text-xs text-white focus:outline-none focus:border-gray-400 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#262B36]">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="flex-1 h-9 rounded-lg bg-[#1F232D] text-gray-300 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 h-9 rounded-lg bg-white hover:bg-gray-100 text-black font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editingCustomer ? 'Update' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && paymentCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14171E] border border-[#262B36] rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-[#262B36] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Record Payment</h3>
                <p className="text-[11px] text-gray-400">{paymentCustomer.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-[#1F232D] text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#262B36]/60 text-xs">
              <span className="text-gray-400">Total Outstanding:</span>
              <span className="font-mono font-bold text-amber-400">
                ₹{(paymentCustomer.credit_balance || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-medium text-gray-400 block mb-1">
                  Amount Received (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full h-10 pl-7 pr-3 rounded-lg bg-[#0C0E12] border border-[#262B36] text-sm font-mono font-bold text-white focus:outline-none focus:border-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-400 block mb-1">
                  Payment Mode *
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`h-8 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                        paymentMode === mode
                          ? 'bg-white text-black font-bold'
                          : 'bg-[#1F232D] text-gray-400 hover:text-white'
                      }`}
                    >
                      {mode === 'BANK_TRANSFER' ? 'BANK' : mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-400 block mb-1">
                  Allocation
                </label>
                <select
                  value={paymentSpecificInvoiceId ? paymentSpecificInvoiceId.toString() : 'oldest'}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === 'oldest') {
                      setPaymentSpecificInvoiceId(null)
                    } else {
                      const invId = parseInt(val, 10)
                      setPaymentSpecificInvoiceId(invId)
                      const inv = customerInvoices.find((i) => i.id === invId)
                      if (inv?.amount_due) {
                        setPaymentAmount(inv.amount_due.toString())
                      }
                    }
                  }}
                  className="w-full h-9 px-2.5 rounded-lg bg-[#0C0E12] border border-[#262B36] text-xs text-white focus:outline-none"
                >
                  <option value="oldest">General Payment (Oldest Bills First)</option>
                  {customerInvoices
                    .filter((inv) => inv.status !== 'CANCELLED' && (inv.amount_due || 0) > 0)
                    .map((inv) => (
                      <option key={inv.id} value={inv.id.toString()}>
                        Bill #{inv.invoice_no} (Due: ₹{(inv.amount_due || 0).toLocaleString('en-IN')})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-400 block mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. GPay ref / cheque no"
                  className="w-full h-9 px-3 rounded-lg bg-[#0C0E12] border border-[#262B36] text-xs text-white focus:outline-none focus:border-gray-400"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#262B36]">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 h-9 rounded-lg bg-[#1F232D] text-gray-300 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecordingPayment}
                  className="flex-1 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isRecordingPayment ? 'Recording...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Notice Modal */}
      {archiveNotice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14171E] border border-[#262B36] rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-2xl text-xs">
            <h3 className="text-sm font-bold text-white">Notice</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{archiveNotice}</p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setArchiveNotice(null)}
                className="h-8 px-4 rounded-lg bg-white text-black font-bold cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <InvoicePreviewModal
          invoice={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          onInvoiceCancelled={async () => {
            await fetchCustomers()
            if (detailCustomer) await loadCustomerDetails(detailCustomer)
          }}
          onPaymentRecorded={async () => {
            await fetchCustomers()
            if (detailCustomer) await loadCustomerDetails(detailCustomer)
          }}
        />
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C202A] border border-[#2E3646] text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
