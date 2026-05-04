'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  ArrowLeft,
  Play,
  Square,
  RotateCw,
  Terminal,
  Copy,
  ExternalLink,
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
  Loader2,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { WorkspaceData } from '@/store/useWorkspaceStore'

interface ResourceUsage {
  cpu: number
  ram: number
  disk: number
  network: { in: number; out: number }
  memoryUsageMb: number
  memoryLimitMb: number
  containerAvailable: boolean
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

export function WorkspaceDetailView() {
  const { selectedWorkspaceId, setView } = useAppStore()
  const { toast } = useToast()
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null)
  const [usage, setUsage] = useState<ResourceUsage>({
    cpu: 0,
    ram: 0,
    disk: 0,
    network: { in: 0, out: 0 },
    memoryUsageMb: 0,
    memoryLimitMb: 0,
    containerAvailable: false,
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [restartDialogOpen, setRestartDialogOpen] = useState(false)
  const [sseConnected, setSseConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchWorkspace = useCallback(async () => {
    if (!selectedWorkspaceId) return
    try {
      const res = await fetch(`/api/workspaces/${selectedWorkspaceId}`, { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setWorkspace(json.data)
        }
      } else {
        toast({ title: 'Error', description: 'Failed to load workspace', variant: 'destructive' })
        setView('workspaces')
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [selectedWorkspaceId, setView, toast])

  // ── SSE connection for real-time stats ──
  useEffect(() => {
    if (!selectedWorkspaceId || !workspace) return

    // Only connect SSE when workspace is running
    if (workspace.status !== 'running') {
      setSseConnected(false)
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      return
    }

    const es = new EventSource(`/api/workspaces/${selectedWorkspaceId}/ws`)
    eventSourceRef.current = es

    es.addEventListener('connected', () => {
      setSseConnected(true)
    })

    es.addEventListener('close', () => {
      setSseConnected(false)
      es.close()
      eventSourceRef.current = null
    })

    es.addEventListener('error', (e) => {
      // EventSource will auto-reconnect for transient errors
      // Only close on explicit close event
      if ((e as MessageEvent).data) {
        try {
          const data = JSON.parse((e as MessageEvent).data)
          if (data.type === 'close') {
            setSseConnected(false)
            es.close()
            eventSourceRef.current = null
          }
        } catch {
          // ignore parse errors
        }
      }
    })

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'stats') {
          setUsage({
            cpu: Math.round(data.cpu),
            ram: Math.round(data.ram),
            disk: Math.round(data.disk),
            network: data.network || { in: 0, out: 0 },
            memoryUsageMb: data.memoryUsageMb || 0,
            memoryLimitMb: data.memoryLimitMb || 0,
            containerAvailable: data.containerAvailable || false,
          })
        }
      } catch {
        // ignore parse errors
      }
    }

    return () => {
      es.close()
      eventSourceRef.current = null
      setSseConnected(false)
    }
  }, [selectedWorkspaceId, workspace?.status])

  // ── Fallback polling when SSE is not connected ──
  useEffect(() => {
    if (!selectedWorkspaceId || sseConnected) return

    // Poll workspace status every 3s when not connected to SSE
    pollRef.current = setInterval(fetchWorkspace, 3000)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
    }
  }, [selectedWorkspaceId, sseConnected, fetchWorkspace])

  // ── Initial load ──
  useEffect(() => {
    if (!selectedWorkspaceId) {
      setView('workspaces')
      return
    }
    setLoading(true)
    setUsage({
      cpu: 0,
      ram: 0,
      disk: 0,
      network: { in: 0, out: 0 },
      memoryUsageMb: 0,
      memoryLimitMb: 0,
      containerAvailable: false,
    })
    fetchWorkspace()
  }, [selectedWorkspaceId, setView, fetchWorkspace])

  const handleToggleStatus = async () => {
    if (!workspace || actionLoading) return
    const newStatus = workspace.status === 'running' ? 'stopped' : 'running'
    setActionLoading(true)
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setWorkspace(json.data)
        }
        toast({
          title: newStatus === 'running' ? 'Started' : 'Stopped',
          description: `"${workspace.name}" ${newStatus === 'running' ? 'is now running' : 'has been stopped'}`,
        })
      } else {
        const json = await res.json()
        toast({ title: 'Error', description: json.error || 'Failed to update workspace', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRestart = async () => {
    if (!workspace || actionLoading) return
    setRestartDialogOpen(false)
    setActionLoading(true)
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'creating' }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setWorkspace(json.data)
        }
        toast({ title: 'Restarting', description: 'Restarting your workspace...' })
      } else {
        const json = await res.json()
        toast({ title: 'Error', description: json.error || 'Failed to restart workspace', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const statusColors: Record<string, string> = {
    running: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    stopped: 'bg-red-500/10 text-red-400 border-red-500/20',
    creating: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  const statusLabels: Record<string, string> = {
    running: 'Running',
    stopped: 'Stopped',
    creating: 'Creating',
    error: 'Error',
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <button
        onClick={() => setView('workspaces')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Workspaces
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <Terminal className="h-6 w-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{workspace.name}</h1>
            <p className="text-sm text-muted-foreground">
              {workspace.platform || 'Ubuntu'} · Created {new Date(workspace.createdAt).toLocaleDateString('en-US')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusColors[workspace.status]}>
            {workspace.status === 'creating' && (
              <span className="animate-pulse ml-1">●</span>
            )}
            {statusLabels[workspace.status]}
          </Badge>
          {workspace.status === 'running' && (
            <Badge
              variant="outline"
              className={sseConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground'}
            >
              {sseConnected ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
              {sseConnected ? 'Live' : 'Polling'}
            </Badge>
          )}
        </div>
      </div>

      {/* Resource Monitoring */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Cpu className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">CPU</p>
                <p className="text-xs text-muted-foreground">
                  {usage.cpu}% of {workspace.cpu} vCPU
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-1000"
                  style={{ width: `${usage.cpu}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {usage.cpu}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <MemoryStick className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Memory (RAM)</p>
                <p className="text-xs text-muted-foreground">
                  {usage.memoryUsageMb.toFixed(0)} / {usage.memoryLimitMb.toFixed(0)} MB ({usage.ram}%)
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-1000"
                  style={{ width: `${usage.ram}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {usage.ram}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <HardDrive className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Storage (Disk)</p>
                <p className="text-xs text-muted-foreground">
                  {usage.disk}% of {workspace.disk} GB
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-1000"
                  style={{ width: `${usage.disk}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {usage.disk}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network I/O */}
      {workspace.status === 'running' && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              Network I/O
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground mb-1">Inbound</p>
                <p className="font-semibold text-lg">{formatBytes(usage.network.in)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground mb-1">Outbound</p>
                <p className="font-semibold text-lg">{formatBytes(usage.network.out)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={workspace.status === 'running' ? 'outline' : 'default'}
              className={
                workspace.status !== 'running'
                  ? 'bg-emerald-500 hover:bg-emerald-600 gap-2'
                  : 'gap-2'
              }
              onClick={handleToggleStatus}
              disabled={workspace.status === 'creating' || actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {workspace.status === 'running' ? (
                <>
                  <Square className="h-4 w-4" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setRestartDialogOpen(true)}
              disabled={workspace.status === 'creating' || actionLoading}
            >
              <RotateCw className="h-4 w-4" />
              Restart
            </Button>
            {workspace.url && (
              <a href={workspace.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  <span>Open URL</span>
                </Button>
              </a>
            )}
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                navigator.clipboard.writeText(workspace.id)
                toast({ title: 'Copied', description: 'Workspace ID copied to clipboard' })
              }}
            >
              <Copy className="h-4 w-4" />
              Copy ID
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Workspace Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Processor</p>
              <p className="font-semibold">{workspace.cpu} vCPU</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Memory</p>
              <p className="font-semibold">{(Number(workspace.ram) / 1024).toFixed(0)} GB</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Storage</p>
              <p className="font-semibold">{workspace.disk} GB</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Container</p>
              <p className="font-mono text-xs truncate">
                {workspace.containerId ? `${workspace.containerId.slice(0, 12)}` : 'Not attached'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restart Confirmation Dialog */}
      <AlertDialog open={restartDialogOpen} onOpenChange={setRestartDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restart Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restart <strong>{workspace.name}</strong>? The workspace will be temporarily unavailable during the restart process.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestart}>
              Restart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
