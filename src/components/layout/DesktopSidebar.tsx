'use client'

import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Box,
  CreditCard,
  Receipt,
  Settings,
  HelpCircle,
  Cloud,
  LogOut,
  Shield,
  Users,
  Server,
  Ticket,
  Wrench,
} from 'lucide-react'

const navItems = [
  { key: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { key: 'workspaces' as const, label: 'Workspaces', icon: Box },
  { key: 'pricing' as const, label: 'Pricing', icon: CreditCard },
  { key: 'billing' as const, label: 'Billing', icon: Receipt },
  { key: 'settings' as const, label: 'Settings', icon: Settings },
  { key: 'support' as const, label: 'Support', icon: HelpCircle },
]

const adminNavItems = [
  { key: 'admin-dashboard' as const, label: 'Overview', icon: LayoutDashboard },
  { key: 'admin-users' as const, label: 'Users', icon: Users },
  { key: 'admin-workspaces' as const, label: 'Workspaces', icon: Server },
  { key: 'admin-tickets' as const, label: 'Tickets', icon: Ticket },
  { key: 'admin-settings' as const, label: 'Settings', icon: Wrench },
]

export function DesktopSidebar() {
  const { currentView, user, setView, logout } = useAppStore()
  const isAdmin = user?.isAdmin === true
  const isAdminView = currentView.startsWith('admin-')

  return (
    <aside className="fixed left-0 top-14 bottom-0 z-40 w-64 border-r border-border bg-card/50 backdrop-blur-sm">
      <div className="flex flex-col h-full">
        {/* Brand */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10">
              <Cloud className="h-5 w-5 text-sky-400" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
              CloudSpace
            </span>
          </div>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-sky-500/20 flex items-center justify-center text-lg font-bold text-sky-400">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-400">
              Plan: {user?.plan === 'free' ? 'Free' : (user?.plan?.charAt(0)?.toUpperCase() ?? '') + (user?.plan?.slice(1) ?? '')}
            </span>
            {isAdmin && (
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                Admin
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-1',
                currentView === item.key
                  ? 'bg-sky-500/10 text-sky-400'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </button>
          ))}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className="mt-4 mb-2 px-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Admin Panel</span>
              </div>
              {adminNavItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setView(item.key)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-1',
                    currentView === item.key
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </button>
              ))}
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-border">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  )
}
