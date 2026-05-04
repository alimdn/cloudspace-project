'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Box,
  Plus,
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react'

export function DashboardView() {
  const { user, setView, setSelectedWorkspaceId } = useAppStore()
  const { workspaces, setWorkspaces, loading } = useWorkspaceStore()
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await fetch('/api/workspaces')
        if (res.ok) {
          const data = await res.json()
          setWorkspaces(data)
        }
      } catch {
        // Use mock data on error
        setWorkspaces([])
      } finally {
        setStatsLoading(false)
      }
    }
    fetchWorkspaces()
  }, [setWorkspaces])

  const runningCount = workspaces.filter((w) => w.status === 'running').length
  const totalCpu = workspaces.reduce((acc, w) => acc + Number(w.cpu), 0)
  const totalRam = workspaces.reduce((acc, w) => acc + Number(w.ram), 0)

  const planLabels: Record<string, string> = {
    free: 'مجانية',
    basic: 'أساسي',
    pro: 'احترافي',
    business: 'أعمال',
    enterprise: 'مؤسسات',
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">
          مرحباً، {user?.name} 👋
        </h1>
        <p className="text-muted-foreground">
          إليك نظرة عامة على مساحات العمل الخاصة بك
        </p>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <Box className="h-5 w-5 text-sky-400" />
                </div>
                <Badge variant="secondary" className="bg-sky-500/10 text-sky-400">
                  {workspaces.length} مساحة
                </Badge>
              </div>
              <p className="text-2xl font-bold">{workspaces.length}</p>
              <p className="text-xs text-muted-foreground">إجمالي المساحات</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-emerald-400" />
                </div>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">
                  نشط
                </Badge>
              </div>
              <p className="text-2xl font-bold">{runningCount}</p>
              <p className="text-xs text-muted-foreground">مساحات تعمل</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-violet-400" />
                </div>
              </div>
              <p className="text-2xl font-bold">{totalCpu}</p>
              <p className="text-xs text-muted-foreground">إجمالي vCPU</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <MemoryStick className="h-5 w-5 text-amber-400" />
                </div>
              </div>
              <p className="text-2xl font-bold">{(totalRam / 1024).toFixed(1)} GB</p>
              <p className="text-xs text-muted-foreground">إجمالي الذاكرة</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions + Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => setView('workspaces')}
            >
              <Plus className="h-5 w-5 text-sky-400" />
              <span>إنشاء مساحة عمل جديدة</span>
              <ArrowLeft className="h-4 w-4 mr-auto text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => setView('workspaces')}
            >
              <Box className="h-5 w-5 text-emerald-400" />
              <span>إدارة المساحات الحالية</span>
              <ArrowLeft className="h-4 w-4 mr-auto text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => setView('pricing')}
            >
              <TrendingUp className="h-5 w-5 text-violet-400" />
              <span>ترقية خطتك الحالية</span>
              <ArrowLeft className="h-4 w-4 mr-auto text-muted-foreground" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-b from-sky-500/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">خطتك الحالية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <HardDrive className="h-6 w-6 text-sky-400" />
              </div>
              <div>
                <p className="font-semibold text-lg">
                  {planLabels[user?.plan || 'free'] || user?.plan}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.plan === 'free' ? 'خطة مجانية' : 'اشتراك نشط'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
              onClick={() => setView('pricing')}
            >
              {user?.plan === 'free' ? 'ترقية الخطة' : 'تغيير الخطة'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Workspaces */}
      {!loading && workspaces.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">آخر مساحات العمل</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setView('workspaces')}>
                عرض الكل
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workspaces.slice(0, 3).map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => setSelectedWorkspaceId(ws.id)}
                  className="flex items-center justify-between w-full rounded-lg border border-border p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        ws.status === 'running'
                          ? 'bg-emerald-500'
                          : ws.status === 'stopped'
                          ? 'bg-red-500'
                          : ws.status === 'creating'
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-red-500'
                      }`}
                    />
                    <div className="text-right">
                      <p className="font-medium text-sm">{ws.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ws.platform || 'عام'} · {ws.cpu} vCPU · {(Number(ws.ram) / 1024).toFixed(0)} GB RAM
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
                        : 'bg-amber-500/10 text-amber-400'
                    }
                  >
                    {ws.status === 'running' ? 'يعمل' : ws.status === 'stopped' ? 'متوقف' : ws.status === 'creating' ? 'جارٍ الإنشاء' : 'خطأ'}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
