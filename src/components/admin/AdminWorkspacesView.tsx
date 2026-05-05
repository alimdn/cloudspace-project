'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
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
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Square,
  Loader2,
  Monitor,
  HardDrive,
  Cpu,
  MemoryStick,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AdminWorkspace {
  id: string
  name: string
  user: { email: string } | { email: string; name: string }
  status: string
  cpu: string
  ram: string
  disk: string
  platform: string | null
  createdAt: string
}

interface PaginatedResponse {
  success: boolean
  data: AdminWorkspace[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

const statusColors: Record<string, string> = {
  running: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  stopped: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  creating: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const statusLabels: Record<string, string> = {
  running: 'Running',
  stopped: 'Stopped',
  creating: 'Creating',
  error: 'Error',
}

const statusFilters = ['all', 'running', 'stopped', 'creating', 'error'] as const

export function AdminWorkspacesView() {
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalWorkspaces, setTotalWorkspaces] = useState(0)
  const limit = 10

  const [actionTarget, setActionTarget] = useState<AdminWorkspace | null>(null)
  const [actionType, setActionType] = useState<'stop' | 'start' | null>(null)
  const [acting, setActing] = useState(false)

  const { toast } = useToast()

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      const res = await fetch(`/api/admin/workspaces?${params.toString()}`, {
        credentials: 'include',
      })
      if (res.ok) {
        const json: PaginatedResponse = await res.json()
        if (json.success !== false && json.data) {
          setWorkspaces(json.data)
          setTotalWorkspaces(json.pagination?.total ?? json.data.length)
        }
      } else {
        toast({ title: 'Error', description: 'Failed to fetch workspaces', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, toast])

  useEffect(() => {
    fetchWorkspaces()
  }, [fetchWorkspaces])

  const totalPages = Math.ceil(totalWorkspaces / limit)

  const handleToggle = async () => {
    if (!actionTarget || !actionType) return
    setActing(true)
    try {
      const newStatus = actionType === 'stop' ? 'stopped' : 'running'
      const res = await fetch(`/api/admin/workspaces/${actionTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast({
          title: actionType === 'stop' ? 'Stopped' : 'Started',
          description: `"${actionTarget.name}" is now ${newStatus}`,
        })
        setActionTarget(null)
        setActionType(null)
        fetchWorkspaces()
      } else {
        const json = await res.json()
        toast({ title: 'Error', description: json.error || 'Failed to update workspace', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Workspace Management</h1>
        <p className="text-muted-foreground">Monitor and manage all user workspaces</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Tabs
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val)
            setPage(1)
          }}
        >
          <TabsList>
            {statusFilters.map((status) => (
              <TabsTrigger key={status} value={status} className="text-xs capitalize">
                {status === 'all' ? 'All' : statusLabels[status]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Badge variant="secondary" className="text-xs">
          {totalWorkspaces} workspace{totalWorkspaces !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : workspaces.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">CPU</TableHead>
                    <TableHead className="text-center">RAM</TableHead>
                    <TableHead className="text-center">Disk</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workspaces.map((ws) => (
                    <TableRow key={ws.id}>
                      <TableCell className="font-medium">{ws.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {ws.user?.email ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColors[ws.status] || statusColors.error}
                        >
                          {ws.status === 'creating' && (
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse mr-1" />
                          )}
                          {statusLabels[ws.status] || ws.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm">
                          <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                          {ws.cpu} vCPU
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm">
                          <MemoryStick className="h-3.5 w-3.5 text-muted-foreground" />
                          {(Number(ws.ram) / 1024).toFixed(0)} GB
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm">
                          <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                          {ws.disk} GB
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground capitalize">
                        {ws.platform || '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(ws.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {ws.status === 'running' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1 text-xs hover:bg-amber-500/10 hover:text-amber-400"
                              onClick={() => {
                                setActionTarget(ws)
                                setActionType('stop')
                              }}
                            >
                              <Square className="h-3.5 w-3.5" />
                              Stop
                            </Button>
                          )}
                          {(ws.status === 'stopped' || ws.status === 'error') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1 text-xs hover:bg-emerald-500/10 hover:text-emerald-400"
                              onClick={() => {
                                setActionTarget(ws)
                                setActionType('start')
                              }}
                            >
                              <Play className="h-3.5 w-3.5" />
                              Start
                            </Button>
                          )}
                          {ws.status === 'creating' && (
                            <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-400">
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Creating
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Monitor className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No workspaces found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({totalWorkspaces} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Toggle Confirmation Dialog */}
      <AlertDialog open={!!actionTarget} onOpenChange={(open) => !open && setActionTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'stop' ? 'Stop Workspace' : 'Start Workspace'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionType} <strong>{actionTarget?.name}</strong>?
              {actionType === 'stop' && ' The user will lose access to the running environment.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggle}
              disabled={acting}
              className={
                actionType === 'stop'
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }
            >
              {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {actionType === 'stop' ? 'Stop Workspace' : 'Start Workspace'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
