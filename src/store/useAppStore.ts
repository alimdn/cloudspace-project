import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ViewType =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'workspaces'
  | 'workspace-detail'
  | 'pricing'
  | 'billing'
  | 'settings'
  | 'support'

export interface UserData {
  id: string
  name: string
  email: string
  plan: string
  createdAt: string
}

interface AppState {
  currentView: ViewType
  isAuthenticated: boolean
  user: UserData | null
  sidebarOpen: boolean
  selectedWorkspaceId: string | null
  authChecked: boolean

  setView: (view: ViewType) => void
  setAuthenticated: (auth: boolean, user?: UserData) => void
  setUser: (user: UserData | null) => void
  logout: () => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSelectedWorkspaceId: (id: string | null) => void
  checkSession: () => Promise<boolean>
  setAuthChecked: (checked: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentView: 'landing',
      isAuthenticated: false,
      user: null,
      sidebarOpen: false,
      selectedWorkspaceId: null,
      authChecked: false,

      setView: (view) => set({ currentView: view }),
      setAuthenticated: (auth, user) =>
        set({
          isAuthenticated: auth,
          user: user || null,
          authChecked: true,
          currentView: auth ? 'dashboard' : 'landing',
        }),
      setUser: (user) => set({ user }),
      logout: async () => {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          })
        } catch {
          // Ignore logout API errors
        }
        set({
          isAuthenticated: false,
          user: null,
          currentView: 'landing',
          selectedWorkspaceId: null,
          authChecked: true,
        })
      },
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSelectedWorkspaceId: (id) =>
        set({ selectedWorkspaceId: id, currentView: 'workspace-detail' }),
      checkSession: async () => {
        try {
          const res = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include',
          })
          if (res.ok) {
            const json = await res.json()
            if (json.success && json.data) {
              const userData = json.data.user || json.data
              set({
                isAuthenticated: true,
                user: {
                  id: userData.id,
                  name: userData.name,
                  email: userData.email,
                  plan: userData.plan,
                  createdAt: userData.createdAt,
                },
                authChecked: true,
                currentView: 'dashboard',
              })
              return true
            }
          }
          set({
            isAuthenticated: false,
            user: null,
            authChecked: true,
          })
          return false
        } catch {
          set({
            isAuthenticated: false,
            user: null,
            authChecked: true,
          })
          return false
        }
      },
      setAuthChecked: (checked) => set({ authChecked: checked }),
    }),
    {
      name: 'cloudspace-storage',
      // Only persist UI preferences, NOT auth state
      partialize: (state) => ({
        currentView: state.currentView,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
