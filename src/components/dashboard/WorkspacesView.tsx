'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Play,
  Square,
  Trash2,
  ExternalLink,
  Loader2,
  Search,
  Box,
  Monitor,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const platformOptions = [
  { value: 'ubuntu', label: 'Ubuntu 22.04 LTS' },
  { value: 'debian', label: 'Debian 12' },
  { value: 'alpine', label: 'Alpine Linux 3.19' },
  { value: 'centos', label: 'CentOS Stream 9' },
  { value: 'fedora', label: 'Fedora 39' },
]

export function WorkspacesView() {
  const { setSelectedWorkspaceId } = useAppStore()
  const { workspaces, setWorkspaces, addWorkspace, updateWorkspace, removeWorkspace, loading, setLoading } = useWorkspaceStore()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPlatform, setNewPlatform] = useState('general')
  const [newCpu, setNewCpu] = useState('1')
  const [newRam, setNewRam] = useState('1024')
  const [newDisk, setNewDisk] = useState('10')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const creatingIdRef = useRef<string | null>(null)

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/workspaces', { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setWorkspaces(json.data)
        }
      } else {
        toast({ title: 'Error', description: 'Failed to fetch workspaces', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [setWorkspaces, setLoading, toast])

  useEffect(() => {
    fetchWorkspaces()
  }, [fetchWorkspaces])

  // Poll for real status updates on creating/error workspaces
  useEffect(() => {
    const hasPending = workspaces.some((w) => w.status === 'creating' || w.status === 'error')
    if (!hasPending) return

    const poll = setInterval(async () => {
      try {
        const res = await fetch('/api/workspaces', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          if (json.success && Array.isArray(json.data)) {
            setWorkspaces(json.data)
          }
        }
      } catch {
        // Silently retry
      }
    }, 2000) // Poll every 2s for pending workspaces

    return () => clearInterval(poll)
  }, [workspaces, setWorkspaces])

  const filtered = workspaces.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.platform || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast({ title: 'Error', description: 'Please enter a workspace name', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newName,
          platform: newPlatform,
          cpu: newCpu,
          ram: newRam,
          disk: newDisk,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          addWorkspace(json.data)
          creatingIdRef.current = json.data.id
          toast({ title: 'Success', description: 'Workspace creation started...' })
        }
        setDialogOpen(false)
        setNewName('')
        setNewPlatform('general')
        setNewCpu('1')
        setNewRam('1024')
        setNewDisk('10')
      } else {
        const json = await res.json()
        toast({ title: 'Error', description: json.error || 'Failed to create workspace', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const handleToggleStatus = async (ws: typeof workspaces[0]) => {
    const newStatus = ws.status === 'running' ? 'stopped' : 'running'
    try {
      const res = await fetch(`/api/workspaces/${ws.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          updateWorkspace(ws.id, { status: json.data.status })
        }
        toast({
          title: newStatus === 'running' ? 'Started' : 'Stopped',
          description: `"${ws.name}" ${newStatus === 'running' ? 'is now running' : 'has been stopped'}`,
        })
      } else {
        const json = await res.json()
        toast({ title: 'Error', description: json.error || 'Failed to update workspace', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/workspaces/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        removeWorkspace(deleteTarget.id)
        toast({ title: 'Deleted', description: `"${deleteTarget.name}" has been deleted` })
        setDeleteTarget(null)
      } else {
        const json = await res.json()
        toast({ title: 'Error', description: json.error || 'Failed to delete workspace', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete workspace', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Workspaces</h1>
          <p className="text-muted-foreground">Manage all your workspaces</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 hover:bg-sky-600 text-white gap-2">
              <Plus className="h-4 w-4" />
              New Workspace
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Workspace</DialogTitle>
              <DialogDescription>Configure your new workspace with resources and an OS</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Workspace Name</Label>
                <Input
                  placeholder="e.g. My Workspace"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Operating System</Label>
                <Select value={newPlatform} onValueChange={setNewPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platformOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>vCPU</Label>
                  <Select value={newCpu} onValueChange={setNewCpu}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>RAM (MB)</Label>
                  <Select value={newRam} onValueChange={setNewRam}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024">1 GB</SelectItem>
                      <SelectItem value="2048">2 GB</SelectItem>
                      <SelectItem value="4096">4 GB</SelectItem>
                      <SelectItem value="8192">8 GB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Disk (GB)</Label>
                  <Select value={newDisk} onValueChange={setNewDisk}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 GB</SelectItem>
                      <SelectItem value="25">25 GB</SelectItem>
                      <SelectItem value="50">50 GB</SelectItem>
                      <SelectItem value="100">100 GB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="w-full bg-sky-500 hover:bg-sky-600"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Workspace'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search workspaces..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <Card className="border-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-sky-500/10 flex items-center justify-center mb-4">
              <Box className="h-8 w-8 text-sky-400" />
            </div>
            <h3 className="font-semibold text-lg mb-1">
              {search ? 'No results found' : 'No workspaces yet'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search
                ? 'Try different search terms'
                : 'Create your first workspace to get started'}
            </p>
            {!search && (
              <Button
                className="bg-sky-500 hover:bg-sky-600 gap-2"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Create Workspace
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Workspace Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ws) => (
            <Card
              key={ws.id}
              className="border-border hover:border-sky-500/20 transition-colors group"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                      <Monitor className="h-5 w-5 text-sky-400" />
                    </div>
                    <div>
                      <button
                        onClick={() => setSelectedWorkspaceId(ws.id)}
                        className="font-semibold hover:text-sky-400 transition-colors"
                      >
                        {ws.name}
                      </button>
                      <p className="text-xs text-muted-foreground">
                        {ws.platform ? platformOptions.find((p) => p.value === ws.platform)?.label || ws.platform : 'Ubuntu'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      ws.status === 'running'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : ws.status === 'stopped'
                        ? 'bg-red-500/10 text-red-400'
                        : ws.status === 'creating'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-red-500/10 text-red-400'
                    }
                  >
                    {ws.status === 'running'
                      ? 'Running'
                      : ws.status === 'stopped'
                      ? 'Stopped'
                      : ws.status === 'creating'
                      ? 'Creating'
                      : 'Error'}
                  </Badge>
                </div>

                {/* Resources */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-xs text-muted-foreground">CPU</p>
                    <p className="font-semibold text-sm">{ws.cpu} vCPU</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-xs text-muted-foreground">RAM</p>
                    <p className="font-semibold text-sm">{(Number(ws.ram) / 1024).toFixed(0)} GB</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-xs text-muted-foreground">Disk</p>
                    <p className="font-semibold text-sm">{ws.disk} GB</p>
                  </div>
                </div>

                {/* Container ID indicator */}
                {ws.containerId && (
                  <p className="text-xs text-muted-foreground mb-3 font-mono">
                    Container: {ws.containerId.slice(0, 12)}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1"
                    onClick={() => handleToggleStatus(ws)}
                    disabled={ws.status === 'creating'}
                  >
                    {ws.status === 'running' ? (
                      <>
                        <Square className="h-3.5 w-3.5" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        Start
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => setSelectedWorkspaceId(ws.id)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget({ id: ws.id, name: ws.name })}
                    disabled={ws.status === 'creating'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
              All data associated with this workspace will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
