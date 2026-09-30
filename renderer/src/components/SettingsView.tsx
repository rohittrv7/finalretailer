import React, { useState, useEffect } from 'react'

interface SettingsViewProps {
  dbPath: string
  onCopyDbPath: () => void
  onChangePin: () => void
  onLock: () => void
  onSettingsUpdated?: (storeName: string, counterId: string) => void
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  dbPath,
  onCopyDbPath,
  onChangePin,
  onLock,
  onSettingsUpdated,
}) => {
  const [storeName, setStoreName] = useState<string>('')
  const [counterId, setCounterId] = useState<string>('')
  const [storeAddress, setStoreAddress] = useState<string>('')
  const [storePhone, setStorePhone] = useState<string>('')
  const [storeGstin, setStoreGstin] = useState<string>('')
  const [taxPricingMode, setTaxPricingMode] = useState<'INCLUSIVE' | 'EXCLUSIVE'>('INCLUSIVE')
  const [allowNegativeStock, setAllowNegativeStock] = useState<boolean>(false)
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false)

  // Backup & Disaster Recovery states
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [isRestoring, setIsRestoring] = useState<boolean>(false)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<boolean>(false)
  const [backupMessage, setBackupMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showBackupFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setBackupMessage({ text, type })
    setTimeout(() => setBackupMessage(null), 5000)
  }

  // Load store_name, counter_id, address, phone, GSTIN, tax mode, and allow_negative_stock from SQLite settings table
  const loadSettings = async () => {
    if (window.electronAPI?.db?.settings) {
      try {
        const [savedStoreName, savedCounterId, savedAddr, savedPhone, savedGstin, negStock, savedTaxMode] = await Promise.all([
          window.electronAPI.db.settings.get('store_name'),
          window.electronAPI.db.settings.get('counter_id'),
          window.electronAPI.db.settings.get('store_address'),
          window.electronAPI.db.settings.get('store_phone'),
          window.electronAPI.db.settings.get('store_gstin'),
          window.electronAPI.db.settings.get('allow_negative_stock'),
          window.electronAPI.db.settings.get('tax_pricing_mode'),
        ])
        setStoreName(savedStoreName || '')
        setCounterId(savedCounterId || '')
        setStoreAddress(savedAddr || '')
        setStorePhone(savedPhone || '')
        setStoreGstin(savedGstin || '')
        setAllowNegativeStock(negStock === '1')
        setTaxPricingMode(savedTaxMode === 'EXCLUSIVE' ? 'EXCLUSIVE' : 'INCLUSIVE')
      } catch (err) {
        console.error('Failed to load settings', err)
      }
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleExportBackup = async () => {
    if (!window.electronAPI?.db?.backup) {
      showBackupFeedback('Backup API not available', 'error')
      return
    }
    setIsExporting(true)
    try {
      const res = await window.electronAPI.db.backup.export()
      if (res.success && res.filePath) {
        showBackupFeedback(`Database backup exported successfully to: ${res.filePath}`, 'success')
      } else if (res.error) {
        showBackupFeedback(`Backup failed: ${res.error}`, 'error')
      }
    } catch (err: any) {
      showBackupFeedback(err?.message || 'Failed to export database backup', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  const handleRestoreBackup = async () => {
    if (!window.electronAPI?.db?.backup) {
      showBackupFeedback('Backup API not available', 'error')
      return
    }
    setShowRestoreConfirm(false)
    setIsRestoring(true)
    try {
      const res = await window.electronAPI.db.backup.restore()
      if (res.success) {
        showBackupFeedback('Database restored successfully from backup! Settings reloaded.', 'success')
        await loadSettings()
        if (onSettingsUpdated) {
          const freshName = await window.electronAPI.db.settings.get('store_name')
          const freshCounter = await window.electronAPI.db.settings.get('counter_id')
          onSettingsUpdated(freshName || '', freshCounter || '')
        }
      } else if (res.error) {
        showBackupFeedback(`Restore failed: ${res.error}`, 'error')
      }
    } catch (err: any) {
      showBackupFeedback(err?.message || 'Failed to restore database from backup file', 'error')
    } finally {
      setIsRestoring(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedStoreName = storeName.trim()
    const trimmedCounterId = counterId.trim()
    const trimmedAddress = storeAddress.trim()
    const trimmedPhone = storePhone.trim()
    const trimmedGstin = storeGstin.trim().toUpperCase()

    if (window.electronAPI?.db?.settings) {
      try {
        await Promise.all([
          window.electronAPI.db.settings.set('store_name', trimmedStoreName),
          window.electronAPI.db.settings.set('counter_id', trimmedCounterId),
          window.electronAPI.db.settings.set('store_address', trimmedAddress),
          window.electronAPI.db.settings.set('store_phone', trimmedPhone),
          window.electronAPI.db.settings.set('store_gstin', trimmedGstin),
          window.electronAPI.db.settings.set('tax_pricing_mode', taxPricingMode),
          window.electronAPI.db.settings.set(
            'allow_negative_stock',
            allowNegativeStock ? '1' : '0'
          ),
        ])
        onSettingsUpdated?.(trimmedStoreName, trimmedCounterId)
      } catch (err) {
        console.error('Failed to save settings to SQLite', err)
      }
    }

    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 select-none bg-[#0C0E12]">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
            System & Preferences
          </span>
        </div>
        <h2 className="text-2xl font-black text-[#F3F4F6] tracking-tight">Terminal Settings</h2>
        <p className="text-xs text-[#9CA3AF]">
          Configure terminal identification, stock billing rules, security credentials, and SQLite
          storage.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Store & Terminal Identity */}
        <div className="bg-[#15181E] border border-[#262B36] rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black text-[#F3F4F6] uppercase tracking-wider">
            Terminal Profile & Store Header
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[#9CA3AF] block mb-1">
                Store / Outlet Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Enter store name (e.g. Apex Retail)"
                className="w-full h-10 px-3 rounded-xl bg-[#0C0E12] border border-[#262B36] text-xs text-[#F3F4F6] placeholder:text-[#64748B] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#9CA3AF] block mb-1">
                POS Counter ID
              </label>
              <input
                type="text"
                value={counterId}
                onChange={(e) => setCounterId(e.target.value)}
                placeholder="Enter counter ID (e.g. Counter 01)"
                className="w-full h-10 px-3 rounded-xl bg-[#0C0E12] border border-[#262B36] text-xs text-[#F3F4F6] placeholder:text-[#64748B] focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[#9CA3AF] block mb-1">
                Store Address (Printed on Receipts)
              </label>
              <input
                type="text"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="e.g. 123 Main Market Road"
                className="w-full h-10 px-3 rounded-xl bg-[#0C0E12] border border-[#262B36] text-xs text-[#F3F4F6] placeholder:text-[#64748B] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#9CA3AF] block mb-1">
                Support Phone Number
              </label>
              <input
                type="text"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full h-10 px-3 rounded-xl bg-[#0C0E12] border border-[#262B36] text-xs text-[#F3F4F6] placeholder:text-[#64748B] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#9CA3AF] block mb-1">
                GSTIN Number (Optional)
              </label>
              <input
                type="text"
                value={storeGstin}
                onChange={(e) => setStoreGstin(e.target.value.toUpperCase())}
                placeholder="e.g. 27AAAAA0000A1Z5"
                className="w-full h-10 px-3 rounded-xl bg-[#0C0E12] border border-[#262B36] text-xs text-[#F3F4F6] placeholder:text-[#64748B] focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Real Stock Management Rules */}
        <div className="bg-[#15181E] border border-[#262B36] rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black text-[#F3F4F6] uppercase tracking-wider">
            Stock & Billing Rules
          </h3>

          <div className="space-y-4">
            {/* Allow Negative Stock Toggle */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#0C0E12] border border-[#262B36]">
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#F3F4F6] flex items-center gap-2">
                  <span>Allow Negative Stock During Billing</span>
                  {allowNegativeStock && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Override Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#9CA3AF] max-w-xl leading-relaxed">
                  When enabled, cashiers can bill items even if reported stock is zero or insufficient
                  (common when incoming physical deliveries arrive at the counter before purchase orders
                  are entered). When disabled, billing blocks sales when stock runs out.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={allowNegativeStock}
                  onChange={(e) => setAllowNegativeStock(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#1C2028] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 border border-[#262B36]" />
              </label>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#1C2028] border border-[#262B36] text-xs text-[#9CA3AF]">
              💡 <strong>Note on Reorder Thresholds:</strong> Low-stock alert thresholds are now
              configured individually per product in the Inventory screen to account for differences
              between fast-moving and slow-moving items.
            </div>
          </div>
        </div>

        {/* GST & Tax Calculation Rules */}
        <div className="bg-[#15181E] border border-[#262B36] rounded-3xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-black text-[#F3F4F6] uppercase tracking-wider">
              GST & Tax Calculation Rules
            </h3>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Select whether your shop's selling prices are GST-inclusive or GST-exclusive. This affects tax extraction and billing across the entire application.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Inclusive Mode Card */}
            <div
              onClick={() => setTaxPricingMode('INCLUSIVE')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                taxPricingMode === 'INCLUSIVE'
                  ? 'bg-amber-500/10 border-amber-500 text-[#F3F4F6]'
                  : 'bg-[#0C0E12] border-[#262B36] text-[#9CA3AF] hover:border-[#374151]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  GST-Inclusive (Default & Recommended)
                </span>
                <input
                  type="radio"
                  name="taxPricingMode"
                  checked={taxPricingMode === 'INCLUSIVE'}
                  onChange={() => setTaxPricingMode('INCLUSIVE')}
                  className="accent-amber-500 cursor-pointer"
                />
              </div>
              <p className="text-xs leading-relaxed">
                Selling prices entered on products <strong>already include tax</strong> (MRP / shelf price).
              </p>
              <div className="mt-3 pt-3 border-t border-[#262B36]/60 text-[11px] text-[#9CA3AF]">
                💡 <em>Example:</em> An item with shelf price ₹118 @ 18% GST bills at ₹118.00 total (Taxable Value: ₹100.00 + CGST: ₹9.00 + SGST: ₹9.00).
              </div>
            </div>

            {/* Exclusive Mode Card */}
            <div
              onClick={() => setTaxPricingMode('EXCLUSIVE')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                taxPricingMode === 'EXCLUSIVE'
                  ? 'bg-amber-500/10 border-amber-500 text-[#F3F4F6]'
                  : 'bg-[#0C0E12] border-[#262B36] text-[#9CA3AF] hover:border-[#374151]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                  GST-Exclusive Pricing
                </span>
                <input
                  type="radio"
                  name="taxPricingMode"
                  checked={taxPricingMode === 'EXCLUSIVE'}
                  onChange={() => setTaxPricingMode('EXCLUSIVE')}
                  className="accent-amber-500 cursor-pointer"
                />
              </div>
              <p className="text-xs leading-relaxed">
                Selling prices entered are <strong>pre-tax base prices</strong>. GST is calculated and added on top at checkout.
              </p>
              <div className="mt-3 pt-3 border-t border-[#262B36]/60 text-[11px] text-[#9CA3AF]">
                💡 <em>Example:</em> An item with base price ₹100 @ 18% GST bills at ₹118.00 total (Base: ₹100.00 + CGST: ₹9.00 + SGST: ₹9.00).
              </div>
            </div>
          </div>
        </div>

        {/* Security & Access Controls */}
        <div className="bg-[#15181E] border border-[#262B36] rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black text-[#F3F4F6] uppercase tracking-wider">
            Terminal Access & Security
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onChangePin}
              className="h-10 px-4 rounded-xl bg-[#1C2028] hover:bg-[#262B36] text-xs font-bold text-[#F3F4F6] border border-[#262B36] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>🔑</span>
              <span>Change Terminal PIN</span>
            </button>

            <button
              type="button"
              onClick={onLock}
              className="h-10 px-4 rounded-xl bg-[#7F1D1D]/20 hover:bg-[#7F1D1D]/40 text-xs font-bold text-red-400 border border-red-500/20 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>🔒</span>
              <span>Lock Terminal Immediately</span>
            </button>
          </div>
        </div>

        {/* SQLite Database Engine Specs */}
        <div className="bg-[#15181E] border border-[#262B36] rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#F3F4F6] uppercase tracking-wider">
              Local Database Storage
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-[#1C2028] border border-[#262B36] text-[#9CA3AF] text-[10px] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              SQLite WAL Active
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0C0E12] border border-[#262B36] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                Physical File Path
              </div>
              <div className="font-mono text-[11px] text-[#9CA3AF] truncate mt-0.5">
                {dbPath || 'Resolving path...'}
              </div>
            </div>
            <button
              type="button"
              onClick={onCopyDbPath}
              className="px-3 py-1.5 rounded-xl bg-[#1C2028] hover:bg-[#262B36] text-xs font-semibold text-[#F3F4F6] border border-[#262B36] transition-colors cursor-pointer shrink-0"
            >
              📋 Copy Path
            </button>
          </div>
        </div>

        {/* Database Backup & Disaster Recovery Section */}
        <div className="bg-[#15181E] border border-[#262B36] rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#F3F4F6] uppercase tracking-wider">
              Database Backup & Disaster Recovery
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-[#1C2028] border border-[#262B36] text-[#9CA3AF] text-[10px] font-mono flex items-center gap-1.5">
              <span>🛡️</span>
              Offline Safe Snapshot
            </span>
          </div>

          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            Create an atomic, offline backup of your complete database (products, customer khata, invoices, and settings)
            or restore from a previous backup file. Backups can be copied to a USB flash drive for disaster recovery.
          </p>

          {backupMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
                backupMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              <span>{backupMessage.type === 'success' ? '✓' : '⚠️'}</span>
              <span>{backupMessage.text}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              disabled={isExporting || isRestoring}
              onClick={handleExportBackup}
              className="h-10 px-4 rounded-xl bg-[#1C2028] hover:bg-[#262B36] disabled:opacity-50 text-xs font-bold text-[#F3F4F6] border border-[#262B36] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>📤</span>
              <span>{isExporting ? 'Exporting...' : 'Export Backup (.db)'}</span>
            </button>

            <button
              type="button"
              disabled={isExporting || isRestoring}
              onClick={() => setShowRestoreConfirm(true)}
              className="h-10 px-4 rounded-xl bg-[#1C2028] hover:bg-[#262B36] disabled:opacity-50 text-xs font-bold text-amber-400 border border-amber-500/30 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>📥</span>
              <span>{isRestoring ? 'Restoring...' : 'Restore from Backup'}</span>
            </button>
          </div>
        </div>

        {/* Restore Confirmation Warning Modal */}
        {showRestoreConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#15181E] border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl mx-auto">
                ⚠️
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-base font-black text-[#F3F4F6]">
                  Confirm Database Restore
                </h3>
                <p className="text-xs text-[#9CA3AF] leading-relaxed">
                  Restoring a backup will <strong>completely overwrite</strong> your current products, invoices,
                  and customer ledger balances with the selected file. This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRestoreConfirm(false)}
                  className="flex-1 h-10 rounded-xl bg-[#1C2028] hover:bg-[#262B36] text-xs font-semibold text-[#9CA3AF] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRestoreBackup}
                  className="flex-1 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-black shadow-lg shadow-amber-950/40 transition-colors cursor-pointer"
                >
                  Proceed with Restore
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Bar */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="h-11 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-black shadow-md shadow-amber-950/40 transition-all cursor-pointer"
          >
            Save Preferences
          </button>
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-semibold animate-fade-in">
              ✓ Preferences saved successfully
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
