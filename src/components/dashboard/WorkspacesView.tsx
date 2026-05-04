'use client'

import { useEffect, useState } from 'react'
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
  { value: 'general', label: 'عام (Ubuntu)' },
  { value: 'n8n', label: 'n8n' },
  { value: 'wordpress', label: 'WordPress' },
  { value: 'nextcloud', label: 'Nextcloud' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'redis', label: 'Redis' },
  { value: 'nodejs', label: 'Node.js' },
  { value: 'python', label: 'Python' },
]

export function WorkspacesView() {
  const { setSelectedWorkspaceId } = useAppStore()
  const { workspaces, setWorkspaces, addWorkspace, updateWorkspace, removeWorkspace, loading } = useWorkspaceStore()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPlatform, setNewPlatform] = useState('general')
  const [newCpu, setNewCpu] = useState('1')
  const [newRam, setNewRam] = useState('1024')
  const [newDisk, setNewDisk] = useState('10')

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await fetch('/api/workspaces')
        if (res.ok) {
          const data = await res.json()
          setWorkspaces(data)
        }
      } catch {
        // mock
      }
    }
    fetchWorkspaces()
  }, [setWorkspaces])

  const filtered = workspaces.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.platform || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال اسم المساحة', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          platform: newPlatform,
          cpu: newCpu,
          ram: newRam,
          disk: newDisk,
        }),
      })
      if (res.ok) {
        const ws = await res.json()
        addWorkspace(ws)
        toast({ title: 'تم بنجاح', description: 'جارٍ إنشاء مساحة العمل...' })

        // Simulate creation → running
        setTimeout(() => {
          updateWorkspace(ws.id, { status: 'running' })
          toast({ title: 'تم!', description: `مساحة "${ws.name}" تعمل الآن` })
        }, 3000)

        setDialogOpen(false)
        setNewName('')
        setNewPlatform('general')
        setNewCpu('1')
        setNewRam('1024')
        setNewDisk('10')
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error || 'فشل إنشاء المساحة', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const handleToggleStatus = async (ws: typeof workspaces[0]) => {
    const newStatus = ws.status === 'running' ? 'stopped' : 'running'
    updateWorkspace(ws.id, { status: newStatus })
    toast({
      title: newStatus === 'running' ? 'تم التشغيل' : 'تم الإيقاف',
      description: `مساحة "${ws.name}" ${newStatus === 'running' ? 'تعمل الآن' : 'تم إيقافها'}`,
    })
  }

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/workspaces/${id}`, { method: 'DELETE' })
      if (res.ok) {
        removeWorkspace(id)
        toast({ title: 'تم الحذف', description: `تم حذف مساحة "${name}"` })
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل حذف المساحة', variant: 'destructive' })
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">مساحات العمل</h1>
          <p className="text-muted-foreground">إدارة جميع مساحات العمل الخاصة بك</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 hover:bg-sky-600 text-white gap-2">
              <Plus className="h-4 w-4" />
              مساحة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء مساحة عمل جديدة</DialogTitle>
              <DialogDescription>حدد إعدادات مساحة العمل الجديدة</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>اسم المساحة</Label>
                <Input
                  placeholder="مثال: مساحة n8n"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>المنصة / البرنامج</Label>
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
                  <Label>قرص (GB)</Label>
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
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إنشاء المساحة'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث في مساحات العمل..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
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
              {search ? 'لا توجد نتائج' : 'لا توجد مساحات عمل'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search
                ? 'جرّب البحث بكلمات مختلفة'
                : 'ابدأ بإنشاء أول مساحة عمل لك'}
            </p>
            {!search && (
              <Button
                className="bg-sky-500 hover:bg-sky-600 gap-2"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                إنشاء مساحة عمل
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
                        {ws.platform ? platformOptions.find((p) => p.value === ws.platform)?.label || ws.platform : 'عام'}
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
                      ? 'يعمل'
                      : ws.status === 'stopped'
                      ? 'متوقف'
                      : ws.status === 'creating'
                      ? 'جارٍ الإنشاء'
                      : 'خطأ'}
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
                    <p className="text-xs text-muted-foreground">قرص</p>
                    <p className="font-semibold text-sm">{ws.disk} GB</p>
                  </div>
                </div>

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
                        إيقاف
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        تشغيل
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
                    onClick={() => handleDelete(ws.id, ws.name)}
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
    </div>
  )
}
