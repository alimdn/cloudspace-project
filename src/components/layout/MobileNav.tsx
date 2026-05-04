'use client'

import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Box,
  CreditCard,
  Settings,
  HelpCircle,
} from 'lucide-react'
import type { ViewType } from '@/store/useAppStore'

const tabs: { key: ViewType; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { key: 'workspaces', label: 'المساحات', icon: Box },
  { key: 'pricing', label: 'الأسعار', icon: CreditCard },
  { key: 'settings', label: 'الإعدادات', icon: Settings },
  { key: 'support', label: 'المساعدة', icon: HelpCircle },
]

export function MobileNav() {
  const { currentView, setView } = useAppStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/90 backdrop-blur-xl safe-area-bottom">
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-1.5 min-w-[60px] transition-colors',
              currentView === tab.key
                ? 'text-sky-400'
                : 'text-muted-foreground'
            )}
          >
            <tab.icon className={cn('h-5 w-5', currentView === tab.key && 'drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]')} />
            <span className="text-[10px] font-medium">{tab.label}</span>
            {currentView === tab.key && (
              <div className="absolute bottom-1 h-1 w-6 rounded-full bg-sky-400" />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
