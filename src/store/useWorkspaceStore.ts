import { create } from 'zustand'

export interface WorkspaceData {
  id: string
  userId: string
  name: string
  status: 'running' | 'stopped' | 'creating' | 'error'
  cpu: string
  ram: string
  disk: string
  platform: string | null
  url: string | null
  createdAt: string
  updatedAt: string
}

export interface ResourceUsage {
  cpu: number
  ram: number
  disk: number
}

interface WorkspaceState {
  workspaces: WorkspaceData[]
  loading: boolean
  resourceUsage: Record<string, ResourceUsage>

  setWorkspaces: (workspaces: WorkspaceData[]) => void
  addWorkspace: (workspace: WorkspaceData) => void
  updateWorkspace: (id: string, data: Partial<WorkspaceData>) => void
  removeWorkspace: (id: string) => void
  setLoading: (loading: boolean) => void
  setResourceUsage: (id: string, usage: ResourceUsage) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  loading: false,
  resourceUsage: {},

  setWorkspaces: (workspaces) => set({ workspaces }),
  addWorkspace: (workspace) =>
    set((s) => ({ workspaces: [...s.workspaces, workspace] })),
  updateWorkspace: (id, data) =>
    set((s) => ({
      workspaces: s.workspaces.map((w) =>
        w.id === id ? { ...w, ...data } : w
      ),
    })),
  removeWorkspace: (id) =>
    set((s) => ({
      workspaces: s.workspaces.filter((w) => w.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
  setResourceUsage: (id, usage) =>
    set((s) => ({
      resourceUsage: { ...s.resourceUsage, [id]: usage },
    })),
}))
