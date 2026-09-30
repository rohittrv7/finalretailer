import React, { useState, useEffect } from 'react'
import { Sidebar, NavTabId } from './Sidebar'
import { TopHeader } from './TopHeader'
import { DashboardOverview } from './DashboardOverview'
import { BillingView } from './BillingView'
import { InventoryView } from './InventoryView'
import { CustomersView } from './CustomersView'
import { ReportsView } from './ReportsView'
import { SettingsView } from './SettingsView'
import { ChangePinModal } from './ChangePinModal'
import { AddEditProductModal, ProductFormData } from './AddEditProductModal'

interface DashboardProps {
  onLock: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({ onLock }) => {
  const [activeTab, setActiveTab] = useState<NavTabId>('inventory')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  })

  // Global modals & state
  const [isChangePinOpen, setIsChangePinOpen] = useState<boolean>(false)
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [dbPath, setDbPath] = useState<string>('')
  const [products, setProducts] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [storeName, setStoreName] = useState<string>('')
  const [counterId, setCounterId] = useState<string>('')

  // Responsiveness: auto-collapse sidebar below 1024px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Global Keyboard shortcuts (F1 = Billing, F2 = Inventory, Esc = close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault()
        setActiveTab('billing')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const loadData = async () => {
    if (window.electronAPI?.db) {
      try {
        const [info, pList, cList, savedStoreName, savedCounterId] = await Promise.all([
          window.electronAPI.db.getInfo(),
          window.electronAPI.db.products.getAll(),
          window.electronAPI.db.customers.getAll(),
          window.electronAPI.db.settings?.get('store_name') || Promise.resolve(null),
          window.electronAPI.db.settings?.get('counter_id') || Promise.resolve(null),
        ])
        setDbPath(info.dbPath)
        setProducts(pList)
        setCustomers(cList)
        setStoreName(savedStoreName || '')
        setCounterId(savedCounterId || '')
      } catch (err) {
        console.error('Failed to load DB stats', err)
      }
    }
  }

  // Reload live data immediately whenever the active tab changes (prevents stale/cached counts)
  useEffect(() => {
    loadData()
  }, [activeTab])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleCopyDbPath = () => {
    if (dbPath) {
      navigator.clipboard.writeText(dbPath)
      showToast('Database file path copied to clipboard!')
    }
  }

  const handleAddProductSave = async (data: ProductFormData) => {
    if (!window.electronAPI?.db) return
    await window.electronAPI.db.products.create(data)
    showToast(`Product "${data.name}" added to inventory!`)
    await loadData()
  }

  return (
    <div className="h-screen w-full bg-[#0C0E12] text-[#F3F4F6] flex overflow-hidden select-none">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab)
          setSearchQuery('')
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        productCount={products.length}
        customerCount={customers.length}
        onLock={onLock}
        onChangePin={() => setIsChangePinOpen(true)}
        storeName={storeName}
        counterId={counterId}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <TopHeader
          activeTab={activeTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          storeName={storeName}
          counterId={counterId}
        />

        {/* View Switcher Container */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {activeTab === 'overview' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <DashboardOverview
                products={products}
                customers={customers}
                dbPath={dbPath}
                counterId={counterId}
                onNavigate={(tab) => setActiveTab(tab)}
                onAddProduct={() => setIsAddProductOpen(true)}
                onAddCustomer={() => setActiveTab('customers')}
                onCopyDbPath={handleCopyDbPath}
              />
            </div>
          )}

          {activeTab === 'billing' && (
            <BillingView onNavigateToInventory={() => setActiveTab('inventory')} />
          )}

          {activeTab === 'inventory' && (
            <InventoryView initialSearchQuery={searchQuery} />
          )}

          {activeTab === 'customers' && (
            <CustomersView initialSearchQuery={searchQuery} />
          )}

          {activeTab === 'reports' && (
            <ReportsView products={products} customers={customers} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              dbPath={dbPath}
              onCopyDbPath={handleCopyDbPath}
              onChangePin={() => setIsChangePinOpen(true)}
              onLock={onLock}
              onSettingsUpdated={(newName, newCounter) => {
                setStoreName(newName)
                setCounterId(newCounter)
                showToast('Settings saved to database!')
              }}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
        onSuccess={() => showToast('Terminal PIN changed successfully!')}
      />

      <AddEditProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSave={handleAddProductSave}
        initialData={null}
      />

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#1C2028] border border-amber-500/40 text-amber-400 text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-2.5 backdrop-blur-md animate-fade-in">
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
