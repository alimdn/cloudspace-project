'use client'

import { useEffect } from 'react'
import { useAppStore, type ViewType } from '@/store/useAppStore'
import { useIsMobile } from '@/hooks/use-mobile'
import { Header } from './Header'
import { DesktopSidebar } from './DesktopSidebar'
import { MobileNav } from './MobileNav'
import { LandingView } from '@/components/landing/LandingView'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { DashboardView } from '@/components/dashboard/DashboardView'
import { WorkspacesView } from '@/components/dashboard/WorkspacesView'
import { WorkspaceDetailView } from '@/components/dashboard/WorkspaceDetailView'
import { PricingView } from '@/components/dashboard/PricingView'
import { BillingView } from '@/components/dashboard/BillingView'
import { SettingsView } from '@/components/dashboard/SettingsView'
import { SupportView } from '@/components/dashboard/SupportView'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const viewComponents: Record<ViewType, React.ComponentType> = {
  landing: LandingView,
  login: LoginForm,
  register: RegisterForm,
  dashboard: DashboardView,
  workspaces: WorkspacesView,
  'workspace-detail': WorkspaceDetailView,
  pricing: PricingView,
  billing: BillingView,
  settings: SettingsView,
  support: SupportView,
}

export function AppShell() {
  const { currentView, isAuthenticated, authChecked, checkSession } = useAppStore()
  const isMobile = useIsMobile()
  const showAppLayout = isAuthenticated && currentView !== 'landing'

  const ViewComponent = viewComponents[currentView]

  // Validate session on app load
  useEffect(() => {
    checkSession()
  }, [checkSession])

  // Show loading spinner while checking session
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground" dir="ltr">
      {showAppLayout && <Header />}
      {showAppLayout && !isMobile && <DesktopSidebar />}

      <main
        className={
          showAppLayout
            ? isMobile
              ? 'pt-14 pb-20'
              : 'ml-64 pt-14'
            : ''
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ViewComponent />
          </motion.div>
        </AnimatePresence>
      </main>

      {showAppLayout && isMobile && <MobileNav />}
    </div>
  )
}
