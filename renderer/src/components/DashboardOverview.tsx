import React from 'react'

interface DashboardOverviewProps {
  products: any[]
  customers: any[]
  dbPath: string
  onNavigate: (tab: any) => void
  onAddProduct: () => void
  onAddCustomer: () => void
  onCopyDbPath: () => void
  counterId?: string
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  products,
  customers,
  dbPath,
  onNavigate,
  onAddProduct,
  onAddCustomer,
  onCopyDbPath,
  counterId,
}) => {
  // Low stock products count using individual product threshold (default 5)
  const lowStockCount = products.filter(
    (p) => p.stock_qty <= (p.low_stock_threshold != null ? p.low_stock_threshold : 5)
  ).length
  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock_qty || 0), 0)

  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* Welcome & Register Status Banner */}
      <div className="bg-[#15181E] border border-[#262B36] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Terminal Active
            </span>
            <span className="text-[#64748B]">•</span>
            <span className="text-xs text-[#9CA3AF]">
              {counterId ? `Register Counter ${counterId}` : 'Register Terminal Active'}
            </span>
          </div>
          <h2 className="text-2xl font-black text-[#F3F4F6] tracking-tight">
            Store Command Dashboard
          </h2>
          <p className="text-xs text-[#9CA3AF] max-w-xl leading-relaxed">
            Local SQLite database engine running in WAL mode with low-latency I/O. Ready for retail
            checkout and catalog management.
          </p>
        </div>

        {/* Quick Launchpad Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => onNavigate('billing')}
            className="flex-1 md:flex-none h-11 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-xs font-bold text-black shadow-md shadow-amber-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🧾</span>
            <span>New Sale (F1)</span>
          </button>

          <button
            type="button"
            onClick={onAddProduct}
            className="flex-1 md:flex-none h-11 px-4 rounded-xl bg-[#1C2028] hover:bg-[#262B36] active:scale-95 text-xs font-semibold text-[#F3F4F6] border border-[#262B36] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>+ Add Product</span>
          </button>

          <button
            type="button"
            onClick={onAddCustomer}
            className="flex-1 md:flex-none h-11 px-4 rounded-xl bg-[#1C2028] hover:bg-[#262B36] active:scale-95 text-xs font-semibold text-[#F3F4F6] border border-[#262B36] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>+ Add Customer</span>
          </button>
        </div>
      </div>

      {/* 4 Metrics Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Products in Catalog */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-[#15181E] border border-[#262B36] hover:border-amber-500/40 rounded-2xl p-5 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Catalog Items
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#1C2028] text-amber-400 flex items-center justify-center text-sm border border-[#262B36]">
              📦
            </div>
          </div>
          <div className="text-3xl font-black text-[#F3F4F6] tracking-tight mt-3">
            {products.length}
          </div>
          <div className="text-[11px] text-amber-500 mt-1 font-semibold group-hover:underline flex items-center gap-1">
            <span>Manage Inventory</span>
            <span>→</span>
          </div>
        </div>

        {/* Total Stock Volume */}
        <div className="bg-[#15181E] border border-[#262B36] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Total Stock Units
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#1C2028] text-slate-300 flex items-center justify-center text-sm border border-[#262B36]">
              🏷️
            </div>
          </div>
          <div className="text-3xl font-black text-[#F3F4F6] tracking-tight mt-3">
            {totalStockUnits}
          </div>
          <div className="text-[11px] text-[#9CA3AF] mt-1">Across all categories</div>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => onNavigate('inventory')}
          className={`border rounded-2xl p-5 shadow-sm transition-all cursor-pointer ${
            lowStockCount > 0
              ? 'bg-[#78350F]/15 border-amber-500/40'
              : 'bg-[#15181E] border-[#262B36]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Low Stock Alerts
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold border ${
                lowStockCount > 0
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-[#1C2028] text-[#9CA3AF] border-[#262B36]'
              }`}
            >
              ⚠️
            </div>
          </div>
          <div
            className={`text-3xl font-black tracking-tight mt-3 ${
              lowStockCount > 0 ? 'text-amber-400' : 'text-[#F3F4F6]'
            }`}
          >
            {lowStockCount}
          </div>
          <div
            className={`text-[11px] font-semibold mt-1 ${
              lowStockCount > 0 ? 'text-amber-400' : 'text-[#9CA3AF]'
            }`}
          >
            {lowStockCount > 0 ? 'Items below threshold' : 'All stock levels healthy'}
          </div>
        </div>

        {/* Registered Customers */}
        <div
          onClick={() => onNavigate('customers')}
          className="bg-[#15181E] border border-[#262B36] hover:border-slate-600 rounded-2xl p-5 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Customers
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#1C2028] text-slate-300 flex items-center justify-center text-sm border border-[#262B36]">
              👥
            </div>
          </div>
          <div className="text-3xl font-black text-[#F3F4F6] tracking-tight mt-3">
            {customers.length}
          </div>
          <div className="text-[11px] text-[#9CA3AF] mt-1 group-hover:text-[#F3F4F6] flex items-center gap-1">
            <span>Customer ledger</span>
            <span>→</span>
          </div>
        </div>
      </section>

      {/* Snapshot Tables & Database Diagnostics */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Catalog Snapshot */}
        <div className="lg:col-span-2 bg-[#15181E] border border-[#262B36] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#F3F4F6]">Catalog Overview</h3>
              <p className="text-[11px] text-[#9CA3AF]">Recently updated items in SQLite</p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="text-xs font-semibold text-amber-500 hover:text-amber-400 cursor-pointer"
            >
              View Full Inventory →
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#262B36] bg-[#0C0E12]">
            {products.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#9CA3AF] space-y-2">
                <p>No products added yet.</p>
                <button
                  type="button"
                  onClick={onAddProduct}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs"
                >
                  + Add Product
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1C2028] text-[#9CA3AF] font-bold border-b border-[#262B36]">
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Sell Price</th>
                    <th className="p-3">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262B36]">
                  {products.slice(0, 6).map((p) => {
                    const threshold = p.low_stock_threshold != null ? p.low_stock_threshold : 5
                    const isOutOfStock = p.stock_qty <= 0
                    const isLowStock = p.stock_qty <= threshold

                    return (
                      <tr key={p.id} className="hover:bg-[#1C2028]/50 transition-colors">
                        <td className="p-3 font-mono text-amber-400 font-semibold">{p.sku || '-'}</td>
                        <td className="p-3 font-semibold text-[#F3F4F6]">{p.name}</td>
                        <td className="p-3 text-[#9CA3AF]">{p.category || 'General'}</td>
                        <td className="p-3 font-mono font-bold text-[#F3F4F6]">
                          ₹{p.selling_price.toFixed(2)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                              isOutOfStock
                                ? 'bg-[#7F1D1D]/30 text-[#EF4444] border border-[#EF4444]/40'
                                : isLowStock
                                ? 'bg-[#78350F]/30 text-amber-400 border border-amber-500/40'
                                : 'bg-[#1C2028] text-[#F3F4F6]'
                            }`}
                          >
                            {p.stock_qty} {p.unit}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Col: Database & Counter Specifications */}
        <div className="bg-[#15181E] border border-[#262B36] rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#F3F4F6]">Database Specifications</h3>
            <p className="text-[11px] text-[#9CA3AF]">Local embedded SQLite instance</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              <span>Active File Path</span>
              <button
                type="button"
                onClick={onCopyDbPath}
                className="text-amber-500 hover:underline cursor-pointer"
              >
                Copy Path
              </button>
            </div>
            <div className="bg-[#0C0E12] border border-[#262B36] rounded-xl p-3 text-xs font-mono text-slate-300 break-all select-text">
              {dbPath || 'Detecting...'}
            </div>
          </div>

          <div className="space-y-2 text-xs pt-1">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C2028] border border-[#262B36]">
              <span className="text-[#9CA3AF]">Engine</span>
              <span className="font-semibold text-[#F3F4F6]">better-sqlite3 v11</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C2028] border border-[#262B36]">
              <span className="text-[#9CA3AF]">Journal Mode</span>
              <span className="font-semibold text-slate-300">WAL (Fast Concurrent)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C2028] border border-[#262B36]">
              <span className="text-[#9CA3AF]">Security</span>
              <span className="font-semibold text-amber-500">bcrypt Hashed PIN</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C2028] border border-[#262B36]">
              <span className="text-[#9CA3AF]">IPC Isolation</span>
              <span className="font-semibold text-slate-300">contextBridge Enabled</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
