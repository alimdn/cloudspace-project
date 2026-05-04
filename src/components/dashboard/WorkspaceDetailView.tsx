'use client'

import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowRight,
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
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function WorkspaceDetailView() {
  const { selectedWorkspaceId, setView } = useAppStore()
  const { workspaces, updateWorkspace } = useWorkspaceStore()
  const { toast } = useToast()
  const workspace = workspaces.find((w) => w.id === selectedWorkspaceId)

  // Simulate resource usage
  const [usage, setUsage] = useState({ cpu: 0, ram: 0, disk: 0 })
  const workspaceIdRef = useRef(selectedWorkspaceId)
  workspaceIdRef.current = selectedWorkspaceId

  useEffect(() => {
    if (!selectedWorkspaceId) {
      setView('workspaces')
    }
  }, [selectedWorkspaceId, setView])

  useEffect(() => {
    const tick = () => {
      const ws = workspaces.find((w) => w.id === workspaceIdRef.current)
      if (!ws || ws.status !== 'running') return
      setUsage({
        cpu: Math.floor(Math.random() * 60) + 10,
        ram: Math.floor(Math.random() * 50) + 20,
        disk: Math.floor(Math.random() * 30) + 5,
      })
    }
    tick()
    const interval = setInterval(tick, 3000)
    return () => clearInterval(interval)
  }, [workspaces])

  if (!selectedWorkspaceId || !workspace) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const handleToggleStatus = () => {
    const newStatus = workspace.status === 'running' ? 'stopped' : 'running'
    updateWorkspace(workspace.id, { status: newStatus })
    toast({
      title: newStatus === 'running' ? 'تم التشغيل' : 'تم الإيقاف',
      description: `مساحة "${workspace.name}" ${newStatus === 'running' ? 'تعمل الآن' : 'تم إيقافها'}`,
    })
    if (newStatus === 'running') {
      setUsage({ cpu: Math.floor(Math.random() * 30) + 10, ram: Math.floor(Math.random() * 40) + 20, disk: Math.floor(Math.random() * 20) + 5 })
    } else {
      setUsage({ cpu: 0, ram: 0, disk: 0 })
    }
  }

  const handleRestart = () => {
    updateWorkspace(workspace.id, { status: 'creating' })
    toast({ title: 'إعادة تشغيل', description: 'جارٍ إعادة تشغيل مساحة العمل...' })
    setTimeout(() => {
      updateWorkspace(workspace.id, { status: 'running' })
      toast({ title: 'تم!', description: 'تم إعادة تشغيل مساحة العمل بنجاح' })
    }, 3000)
  }

  const statusColors: Record<string, string> = {
    running: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    stopped: 'bg-red-500/10 text-red-400 border-red-500/20',
    creating: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  const statusLabels: Record<string, string> = {
    running: 'يعمل',
    stopped: 'متوقف',
    creating: 'جارٍ الإنشاء',
    error: 'خطأ',
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <button
        onClick={() => setView('workspaces')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowRight className="h-4 w-4" />
        العودة لمساحات العمل
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
              {workspace.platform || 'عام'} · تم الإنشاء {new Date(workspace.createdAt).toLocaleDateString('ar-SA')}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={statusColors[workspace.status]}>
          {workspace.status === 'creating' && (
            <span className="animate-pulse mr-1">●</span>
          )}
          {statusLabels[workspace.status]}
        </Badge>
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
                <p className="font-semibold text-sm">المعالج (CPU)</p>
                <p className="text-xs text-muted-foreground">
                  {usage.cpu}% من {workspace.cpu} vCPU
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-violet-500 to-violet-400 transition-all duration-1000"
                  style={{ width: `${usage.cpu}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-left" dir="ltr">
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
                <p className="font-semibold text-sm">الذاكرة (RAM)</p>
                <p className="text-xs text-muted-foreground">
                  {usage.ram}% من {(Number(workspace.ram) / 1024).toFixed(0)} GB
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-amber-500 to-amber-400 transition-all duration-1000"
                  style={{ width: `${usage.ram}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-left" dir="ltr">
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
                <p className="font-semibold text-sm">التخزين (Disk)</p>
                <p className="text-xs text-muted-foreground">
                  {usage.disk}% من {workspace.disk} GB
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-sky-500 to-sky-400 transition-all duration-1000"
                  style={{ width: `${usage.disk}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-left" dir="ltr">
                {usage.disk}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            إجراءات
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
              disabled={workspace.status === 'creating'}
            >
              {workspace.status === 'running' ? (
                <>
                  <Square className="h-4 w-4" />
                  إيقاف
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  تشغيل
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleRestart}
              disabled={workspace.status === 'creating'}
            >
              <RotateCw className="h-4 w-4" />
              إعادة تشغيل
            </Button>
            {workspace.url && (
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                <span>فتح الرابط</span>
              </Button>
            )}
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                navigator.clipboard.writeText(workspace.id)
                toast({ title: 'تم النسخ', description: 'تم نسخ معرف المساحة' })
              }}
            >
              <Copy className="h-4 w-4" />
              نسخ المعرف
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">تفاصيل المساحة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">المعالج</p>
              <p className="font-semibold">{workspace.cpu} vCPU</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">الذاكرة</p>
              <p className="font-semibold">{(Number(workspace.ram) / 1024).toFixed(0)} GB</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">التخزين</p>
              <p className="font-semibold">{workspace.disk} GB</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">المعرف</p>
              <p className="font-mono text-xs truncate" dir="ltr">{workspace.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
