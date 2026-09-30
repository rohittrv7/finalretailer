import React, { useState, useEffect, useCallback } from 'react'
import { ReportStats } from '../vite-env'

interface ReportsViewProps {
  products: any[]
  customers: any[]
}

export const ReportsView: React.FC<ReportsViewProps> = ({ products, customers }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const periodLabel = selectedPeriod === 'today' ? 'Today' : selectedPeriod === 'week' ? 'This Week' : 'This Month'

  const loadReportStats = useCallback(async () => {
    setLoading(true)
    try {
      if (window.electronAPI?.db?.reports?.getStats) {
        const data = await window.electronAPI.db.reports.getStats(selectedPeriod)
        setStats(data)
      } else if (window.electronAPI?.db) {
        // Safe renderer-side calculation fallback if IPC handler is refreshing
        const [allInvoices, allCategories] = await Promise.all([
          window.electronAPI.db.invoices.getAll({ limit: 1000 }),
          window.electronAPI.db.categories.getAll(),
        ])

        const now = new Date()
        const isPeriodMatch = (dateStr: string) => {
          const d = new Date(dateStr)
          if (isNaN(d.getTime())) return false
          if (selectedPeriod === 'today') {
            return (
              d.getFullYear() === now.getFullYear() &&
              d.getMonth() === now.getMonth() &&
              d.getDate() === now.getDate()
            )
          } else if (selectedPeriod === 'week') {
            const sevenDaysAgo = new Date(now)
            sevenDaysAgo.setDate(now.getDate() - 6)
            sevenDaysAgo.setHours(0, 0, 0, 0)
            return d >= sevenDaysAgo
          } else {
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
          }
        }

        const periodInvoices = allInvoices.filter(
          (inv: any) => inv.status !== 'CANCELLED' && isPeriodMatch(inv.date)
        )

        const periodSalesTotal = periodInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0)
        const periodPaidTotal = periodInvoices.reduce((acc, inv) => acc + (inv.amount_paid || 0), 0)
        const periodDueTotal = periodInvoices.reduce((acc, inv) => acc + (inv.amount_due || 0), 0)

        // Tender calculation
        let cashAmount = 0
        let cashCount = 0
        let upiAmount = 0
        let upiCount = 0

        for (const inv of periodInvoices) {
          const mode = (inv.payment_mode || '').toUpperCase()
          if (mode === 'CASH') {
            cashAmount += inv.amount_paid || 0
            cashCount += 1
          } else if (mode === 'UPI') {
            upiAmount += inv.amount_paid || 0
            upiCount += 1
          }
        }

        const totalRecorded = cashAmount + upiAmount
        const cashPercentage = totalRecorded > 0 ? Math.round((cashAmount / totalRecorded) * 100) : 0
        const upiPercentage = totalRecorded > 0 ? 100 - cashPercentage : 0

        // Stock valuation
        const stockValuationCost = products.reduce(
          (acc, p) => acc + (p.purchase_price || 0) * (p.stock_qty || 0),
          0
        )
        const stockValuationRetail = products.reduce(
          (acc, p) => acc + (p.selling_price || 0) * (p.stock_qty || 0),
          0
        )
        const projectedGrossMargin = Math.max(0, stockValuationRetail - stockValuationCost)
        const totalStockUnits = products.reduce((acc, p) => acc + (p.stock_qty || 0), 0)

        // Customer dues
        const activeDebtors = customers.filter((c) => (c.credit_balance || 0) > 0)
        const totalCreditDue = activeDebtors.reduce((acc, c) => acc + (c.credit_balance || 0), 0)

        // Category breakdown
        const totalProds = products.length
        const categoriesBreakdown = allCategories.map((c: any) => {
          const count = products.filter(
            (p) => p.category_id === c.id || (!p.category_id && p.category === c.name)
          ).length
          return {
            name: c.name,
            productCount: count,
            percentage: totalProds > 0 ? Math.round((count / totalProds) * 100) : 0,
          }
        })

        setStats({
          period: selectedPeriod,
          stockValuationCost,
          stockValuationRetail,
          projectedGrossMargin,
          totalStockUnits,
          totalProductsCount: totalProds,
          lowStockCount: products.filter(
            (p) => p.stock_qty <= (p.low_stock_threshold != null ? p.low_stock_threshold : 5)
          ).length,
          periodSalesTotal,
          periodPaidTotal,
          periodDueTotal,
          periodInvoiceCount: periodInvoices.length,
          periodCostOfGoods: 0,
          periodGrossProfit: periodSalesTotal,
          periodGrossMarginPct: 100,
          totalCreditDue,
          debtorsCount: activeDebtors.length,
          tenderDistribution: {
            cashAmount,
            cashCount,
            cashPercentage,
            upiAmount,
            upiCount,
            upiPercentage,
            totalRecorded,
            totalCount: cashCount + upiCount,
          },
          categoriesBreakdown,
        })
      }
    } catch (err) {
      console.error('Failed to load report stats', err)
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, products, customers])

  useEffect(() => {
    loadReportStats()
  }, [loadReportStats])

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 select-none bg-[#0C0E12]">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Analytics & Insights
            </span>
          </div>
          <h2 className="text-2xl font-black text-[#F3F4F6] tracking-tight">
            Sales & Valuation Reports
          </h2>
          <p className="text-xs text-[#9CA3AF]">
            Real-time catalog evaluation, customer receivables, and register metrics queried live from SQLite.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center bg-[#15181E] border border-[#262B36] p-1 rounded-xl shadow-sm">
          {loading && (
            <div className="px-2 flex items-center gap-1.5 text-[11px] text-[#9CA3AF]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-mono">Syncing...</span>
            </div>
          )}
          {(['today', 'week', 'month'] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedPeriod === period
                  ? 'bg-amber-500 text-black shadow-sm font-black'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
            >
              {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Estimated Stock Value (Cost) */}
        <div className="bg-[#15181E] border border-[#262B36] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Estimated Stock Value (Cost)
            </span>
            <span className="text-sm">💰</span>
          </div>
          <div className="text-2xl font-black text-[#F3F4F6] mt-2">
            ₹{stats ? stats.stockValuationCost.toLocaleString() : '0'}
          </div>
          <div className="text-[10px] text-[#64748B] mt-1">
            Based on purchase prices ({stats?.totalStockUnits || 0} units)
          </div>
        </div>

        {/* Card 2: Retail Sales Potential */}
        <div className="bg-[#15181E] border border-[#262B36] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Retail Sales Potential
            </span>
            <span className="text-sm">🏷️</span>
          </div>
          <div className="text-2xl font-black text-amber-500 mt-2">
            ₹{stats ? stats.stockValuationRetail.toLocaleString() : '0'}
          </div>
          <div className="text-[10px] text-[#64748B] mt-1">At active counter selling rates</div>
        </div>

        {/* Card 3: Projected Gross Margin */}
        <div className="bg-[#15181E] border border-[#262B36] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Projected Gross Margin
            </span>
            <span className="text-sm">📈</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            ₹{stats ? stats.projectedGrossMargin.toLocaleString() : '0'}
          </div>
          <div className="text-[10px] text-[#64748B] mt-1">Catalog markup potential</div>
        </div>

        {/* Card 4: Total Ledger Credit Due (matches Customers Screen) */}
        <div className="bg-[#15181E] border border-[#262B36] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Total Ledger Credit Due
            </span>
            <span className="text-sm">💳</span>
          </div>
          <div className={`text-2xl font-black mt-2 ${(stats?.totalCreditDue || 0) > 0 ? 'text-red-400' : 'text-[#F3F4F6]'}`}>
            ₹{stats ? stats.totalCreditDue.toLocaleString() : '0'}
          </div>
          <div className="text-[10px] text-[#64748B] mt-1">
            Across {stats?.debtorsCount || 0} debtor account{stats?.debtorsCount === 1 ? '' : 's'} (Khata)
          </div>
        </div>
      </div>

      {/* Period Register Sales Snapshot Strip */}
      <div className="bg-[#15181E] border border-[#262B36] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Register Sales Activity • {periodLabel}
            </span>
          </div>
          <p className="text-xs text-[#9CA3AF]">
            Actual sales transactions, inventory cost of goods, and realized gross profit for {periodLabel.toLowerCase()}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full md:w-auto">
          <div className="bg-[#0C0E12] border border-[#262B36] px-4 py-2 rounded-xl text-left">
            <div className="text-[10px] uppercase font-bold text-[#64748B]">Billed Sales</div>
            <div className="text-sm font-black font-mono text-[#F3F4F6]">
              ₹{stats ? stats.periodSalesTotal.toLocaleString() : '0'}
            </div>
            <div className="text-[10px] text-[#9CA3AF] font-medium">
              {stats?.periodInvoiceCount || 0} bill{stats?.periodInvoiceCount === 1 ? '' : 's'}
            </div>
          </div>

          <div className="bg-[#0C0E12] border border-[#262B36] px-4 py-2 rounded-xl text-left">
            <div className="text-[10px] uppercase font-bold text-[#64748B]">Cost of Goods Sold</div>
            <div className="text-sm font-black font-mono text-slate-300">
              ₹{stats ? stats.periodCostOfGoods.toLocaleString() : '0'}
            </div>
            <div className="text-[10px] text-[#9CA3AF] font-medium">Inventory purchase cost</div>
          </div>

          <div className="bg-[#0C0E12] border border-[#262B36] px-4 py-2 rounded-xl text-left">
            <div className="text-[10px] uppercase font-bold text-[#64748B]">Realized Profit</div>
            <div className="text-sm font-black font-mono text-emerald-400">
              ₹{stats ? stats.periodGrossProfit.toLocaleString() : '0'}
            </div>
            <div className="text-[10px] text-emerald-500 font-medium">
              {stats && stats.periodSalesTotal > 0 ? `${stats.periodGrossMarginPct.toFixed(1)}% margin` : '0% margin'}
            </div>
          </div>

          <div className="bg-[#0C0E12] border border-[#262B36] px-4 py-2 rounded-xl text-left">
            <div className="text-[10px] uppercase font-bold text-[#64748B]">Credit Baki Created</div>
            <div className="text-sm font-black font-mono text-amber-400">
              ₹{stats ? stats.periodDueTotal.toLocaleString() : '0'}
            </div>
            <div className="text-[10px] text-[#9CA3AF] font-medium">Uncollected on bills</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Payment Split & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tender Channel Distribution (Strictly Cash & UPI, calculated from real invoices in selected period) */}
        <div className="bg-[#15181E] border border-[#262B36] rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#F3F4F6] uppercase tracking-wider">
              Tender Channel Distribution
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#1C2028] border border-[#262B36] text-[#9CA3AF]">
              {periodLabel}
            </span>
          </div>
          <p className="text-xs text-[#9CA3AF]">
            Breakdown of collected payments across Cash and UPI tender channels for {periodLabel.toLowerCase()}.
          </p>

          <div className="pt-2">
            {!stats || stats.tenderDistribution.totalRecorded === 0 ? (
              /* Clean empty/neutral state if zero sales recorded in period */
              <div className="py-8 px-4 text-center rounded-2xl bg-[#0C0E12] border border-[#262B36] space-y-2">
                <div className="text-2xl">💳</div>
                <div className="text-xs font-bold text-[#F3F4F6]">
                  No sales recorded yet for this period
                </div>
                <p className="text-[11px] text-[#64748B] max-w-sm mx-auto">
                  When invoices are paid via Cash or UPI during {periodLabel.toLowerCase()}, their live tender percentages will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cash Channel */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#0C0E12] border border-[#262B36]">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="font-bold text-[#F3F4F6]">Cash Register</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#9CA3AF]">
                        ₹{stats.tenderDistribution.cashAmount.toLocaleString()} ({stats.tenderDistribution.cashCount} bills)
                      </span>
                      <span className="font-mono font-bold text-amber-500">
                        {stats.tenderDistribution.cashPercentage}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[#1C2028] overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${stats.tenderDistribution.cashPercentage}%` }}
                    />
                  </div>
                </div>

                {/* UPI Channel */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#0C0E12] border border-[#262B36]">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-bold text-[#F3F4F6]">UPI & Instant QR</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#9CA3AF]">
                        ₹{stats.tenderDistribution.upiAmount.toLocaleString()} ({stats.tenderDistribution.upiCount} bills)
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        {stats.tenderDistribution.upiPercentage}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[#1C2028] overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${stats.tenderDistribution.upiPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-[#64748B] flex items-center justify-between px-1">
                  <span>Total Payments Settled:</span>
                  <span className="font-mono font-bold text-[#F3F4F6]">
                    ₹{stats.tenderDistribution.totalRecorded.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="bg-[#15181E] border border-[#262B36] rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#F3F4F6] uppercase tracking-wider">
              Inventory By Category
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#1C2028] border border-[#262B36] text-[#9CA3AF]">
              {products.length} Products
            </span>
          </div>
          <p className="text-xs text-[#9CA3AF]">
            Distribution of products across current registered merchandise categories in SQLite.
          </p>

          <div className="space-y-2.5 pt-2 max-h-[280px] overflow-y-auto pr-1">
            {!stats || stats.categoriesBreakdown.length === 0 || products.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-2xl bg-[#0C0E12] border border-[#262B36] space-y-2">
                <div className="text-2xl">📦</div>
                <div className="text-xs font-bold text-[#F3F4F6]">
                  No products in catalog yet
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Add items to inventory to see category breakdown.
                </p>
              </div>
            ) : (
              stats.categoriesBreakdown.map((item) => (
                <div
                  key={item.name}
                  className="p-3 rounded-xl bg-[#1C2028] border border-[#262B36] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-bold text-[#F3F4F6]">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[#9CA3AF]">{item.productCount} item{item.productCount === 1 ? '' : 's'}</span>
                    <span className="px-2 py-0.5 rounded bg-[#0C0E12] border border-[#262B36] text-[10px] font-mono text-amber-400 font-bold">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
