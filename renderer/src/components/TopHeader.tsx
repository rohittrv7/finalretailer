import React, { useState, useEffect } from 'react'
import { NavTabId } from './Sidebar'

interface TopHeaderProps {
  activeTab: NavTabId
  searchQuery: string
  onSearchChange: (q: string) => void
  onSearchEnter?: () => void
  storeName?: string
  counterId?: string
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  searchQuery,
  onSearchChange,
  onSearchEnter,
  storeName,
  counterId,
}) => {
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString())
  const [currentDate] = useState<string>(
    new Date().toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  )

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(timer)
  }, [])


  // Context-aware placeholder per screen
  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'inventory':
        return 'Search inventory by name, SKU or scan barcode (Press \'/\')...'
      case 'billing':
        return 'Scan barcode or enter SKU to add directly to ticket...'
      case 'customers':
        return 'Search customer by name, phone or GSTIN...'
      case 'reports':
        return 'Search reports, invoices or payment dates...'
      case 'settings':
        return 'Search terminal settings...'
      default:
        return 'Search products, bills, or customers...'
    }
  }

  return (
    <header className="h-16 px-4 sm:px-6 bg-[#15181E] border-b border-[#262B36] flex items-center justify-between gap-4 z-20 shrink-0">
      {/* Context-aware Search Box */}
      <div className="flex-1 max-w-xl relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] text-sm pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearchEnter?.()}
          placeholder={getSearchPlaceholder()}
          className="w-full h-10 pl-9 pr-8 rounded-xl bg-[#0C0E12] border border-[#262B36] text-xs text-[#F3F4F6] placeholder:text-[#64748B] focus:outline-none focus:border-amber-500 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] p-1 cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Right Area: Counter Info, Date/Time & Fullscreen */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Terminal Counter Name */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1C2028] border border-[#262B36] text-[11px] text-[#9CA3AF]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span className="font-semibold text-[#F3F4F6]">
            {counterId ? counterId : 'Register Terminal'}
          </span>
          {storeName && <span className="text-[#64748B]">• {storeName}</span>}
        </div>

        {/* Live Clock & Date */}
        <div className="text-right hidden sm:block">
          <div className="text-xs font-mono font-bold text-[#F3F4F6] tracking-wider leading-none">
            {currentTime}
          </div>
          <div className="text-[10px] text-[#9CA3AF] mt-0.5">{currentDate}</div>
        </div>
      </div>
    </header>
  )
}
