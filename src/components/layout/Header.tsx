'use client'

import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Box,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  Cloud,
} from 'lucide-react'

const navItems = [
  { key: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { key: 'workspaces' as const, label: 'Workspaces', icon: Box },
  { key: 'pricing' as const, label: 'Pricing', icon: CreditCard },
  { key: 'billing' as const, label: 'Billing', icon: CreditCard },
  { key: 'settings' as const, label: 'Settings', icon: Settings },
  { key: 'support' as const, label: 'Support', icon: HelpCircle },
]

export function Header() {
  const { user, sidebarOpen, toggleSidebar, setView, logout } = useAppStore()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="inline-flex md:hidden items-center justify-center rounded-md p-2 hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
              <Cloud className="h-5 w-5 text-sky-400" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
              CloudSpace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-muted-foreground">
            {user?.name}
          </span>
          <div className="h-8 w-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sm font-semibold text-sky-400">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>

      {/* Mobile sidebar sheet */}
      <Sheet open={sidebarOpen} onOpenChange={toggleSidebar}>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-sky-500/20 flex items-center justify-center text-lg font-bold text-sky-400">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-sm">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 p-2">
              {navItems.map((item) => (
                <Button
                  key={item.key}
                  variant="ghost"
                  className="w-full justify-start gap-3 mb-1"
                  onClick={() => {
                    setView(item.key)
                    toggleSidebar()
                  }}
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  {item.label}
                </Button>
              ))}
            </nav>
            <div className="p-2 border-t border-border">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                onClick={logout}
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
