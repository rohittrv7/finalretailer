import React from 'react'

export type NavTabId = 'overview' | 'billing' | 'inventory' | 'customers' | 'reports' | 'settings'

interface NavItem {
  id: NavTabId
  label: string
  icon: string
  badge?: number | string
  shortcut?: string
}

interface SidebarProps {
  activeTab: NavTabId
  onSelectTab: (tab: NavTabId) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  productCount: number
  customerCount: number
  onLock: () => void
  onChangePin: () => void
  storeName?: string
  counterId?: string
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  productCount,
  customerCount,
  onLock,
  onChangePin,
  storeName,
  counterId,
}) => {
  const navItems: NavItem[] = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'billing', label: 'Billing (POS)', icon: '🧾', shortcut: 'F1' },
    { id: 'inventory', label: 'Inventory', icon: '📦', badge: productCount, shortcut: 'F2' },
    { id: 'customers', label: 'Customers', icon: '👥', badge: customerCount },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <aside
      className={`h-screen bg-[#15181E] border-r border-[#262B36] flex flex-col justify-between select-none transition-all duration-200 z-30 shrink-0 ${
        isCollapsed ? 'w-[70px]' : 'w-[250px]'
      }`}
    >
      {/* Top Section: App Branding & Toggle Button */}
      <div className="flex flex-col">
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#262B36]">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-lg text-black shadow-md shadow-amber-950/40 shrink-0">
                R
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold tracking-tight text-[#F3F4F6] truncate">
                  {storeName ? storeName : 'Retailer POS'}
                </span>
                <span className="text-[10px] text-[#9CA3AF] tracking-wider uppercase font-medium truncate">
                  {counterId ? counterId : 'Register Terminal'}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 mx-auto rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-lg text-black shadow-md shadow-amber-950/40">
              R
            </div>
          )}

          {/* Toggle Sidebar Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="w-7 h-7 rounded-lg bg-[#1C2028] hover:bg-[#262B36] text-[#9CA3AF] hover:text-[#F3F4F6] flex items-center justify-center text-xs font-bold border border-[#262B36] transition-colors cursor-pointer shrink-0 ml-1"
          >
            {isCollapsed ? '»' : '«'}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id

            return (
              <div key={item.id} className="relative group">
                <button
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1C2028] text-[#F3F4F6] border-l-4 border-amber-500 shadow-sm'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1A1E26]'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <span className="text-base shrink-0">{item.icon}</span>

                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1 truncate">
                      <span className="truncate">{item.label}</span>
                      <div className="flex items-center gap-1.5 ml-2">
                        {item.shortcut && (
                          <span className="px-1 py-0.5 rounded bg-[#262B36] text-[9px] font-mono text-[#9CA3AF]">
                            {item.shortcut}
                          </span>
                        )}
                        {item.badge !== undefined && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              isActive
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-[#262B36] text-[#9CA3AF]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>

                {/* Floating Tooltip in Collapsed Mode */}
                {isCollapsed && (
                  <div className="absolute left-[72px] top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1C2028] border border-[#262B36] shadow-xl text-xs font-semibold text-[#F3F4F6] whitespace-nowrap pointer-events-none">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Bottom Section: System Status & User Actions */}
      <div className="p-3 border-t border-[#262B36] space-y-2">
        {/* Neutral SQLite Info Badge (Muted blue/gray, NOT green) */}
        {!isCollapsed ? (
          <div className="px-3 py-2 rounded-xl bg-[#1C2028] border border-[#262B36] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-[#9CA3AF] font-medium truncate">SQLite Local</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#262B36] text-[#9CA3AF]">
              WAL
            </span>
          </div>
        ) : (
          <div className="relative group flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-[#1C2028] border border-[#262B36] flex items-center justify-center text-xs">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
            </div>
            <div className="absolute left-[72px] top-1/2 -translate-y-1/2 z-50 hidden group-hover:block px-2.5 py-1 rounded-lg bg-[#1C2028] border border-[#262B36] shadow-xl text-[11px] text-[#9CA3AF] whitespace-nowrap pointer-events-none">
              Local SQLite (WAL mode)
            </div>
          </div>
        )}

        {/* Change PIN Action */}
        <div className="relative group">
          <button
            type="button"
            onClick={onChangePin}
            className={`w-full h-10 px-3 rounded-xl bg-[#1C2028]/80 hover:bg-[#262B36] text-[#9CA3AF] hover:text-[#F3F4F6] text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer border border-[#262B36] ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <span className="text-sm">🔑</span>
            {!isCollapsed && <span>Change PIN</span>}
          </button>
          {isCollapsed && (
            <div className="absolute left-[72px] top-1/2 -translate-y-1/2 z-50 hidden group-hover:block px-2.5 py-1 rounded-lg bg-[#1C2028] border border-[#262B36] shadow-xl text-xs text-[#F3F4F6] whitespace-nowrap pointer-events-none">
              Change PIN
            </div>
          )}
        </div>

        {/* Lock Terminal Action (Red Accent on hover) */}
        <div className="relative group">
          <button
            type="button"
            onClick={onLock}
            className={`w-full h-10 px-3 rounded-xl bg-[#7F1D1D]/20 hover:bg-[#7F1D1D]/40 text-[#EF4444] text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer border border-[#EF4444]/30 ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <span className="text-sm">🔒</span>
            {!isCollapsed && <span>Lock Terminal</span>}
          </button>
          {isCollapsed && (
            <div className="absolute left-[72px] top-1/2 -translate-y-1/2 z-50 hidden group-hover:block px-2.5 py-1 rounded-lg bg-[#1C2028] border border-[#EF4444]/40 shadow-xl text-xs text-[#EF4444] font-bold whitespace-nowrap pointer-events-none">
              Lock Terminal
            </div>
          )}
        </div>

        {/* Discreet Engine & Build Identifier */}
        {!isCollapsed && (
          <div className="pt-1 text-center">
            <span className="text-[10px] font-mono tracking-wider text-slate-500/40 select-none hover:text-slate-400/60 transition-colors">
              Ravana Core • v1.0.0
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
