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

  setView: (view: ViewType) => void
  setAuthenticated: (auth: boolean, user?: UserData) => void
  setUser: (user: UserData | null) => void
  logout: () => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSelectedWorkspaceId: (id: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentView: 'landing',
      isAuthenticated: false,
      user: null,
      sidebarOpen: false,
      selectedWorkspaceId: null,

      setView: (view) => set({ currentView: view }),
      setAuthenticated: (auth, user) =>
        set({
          isAuthenticated: auth,
          user: user || null,
          currentView: auth ? 'dashboard' : 'landing',
        }),
      setUser: (user) => set({ user }),
      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
          currentView: 'landing',
          selectedWorkspaceId: null,
        }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSelectedWorkspaceId: (id) =>
        set({ selectedWorkspaceId: id, currentView: 'workspace-detail' }),
    }),
    {
      name: 'cloudspace-storage',
      partialize: (state) => ({
        currentView: state.currentView,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        selectedWorkspaceId: state.selectedWorkspaceId,
      }),
    }
  )
)
