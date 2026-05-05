'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Trash2,
  Loader2,
  Database,
  Shield,
  Info,
  CheckCircle2,
  Server,
  HardDrive,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CleanupStats {
  totalRecords: number
  last7Days: number
  last30Days: number
  olderThan30: number
  oldest: string | null
  newest: string | null
}

interface CleanupResult {
  deleted: number
  retentionDays: number
  cutoffDate: string
}

export function AdminSettingsView() {
  const [retentionDays, setRetentionDays] = useState('7')
  const [cleaning, setCleaning] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null)

  const [cleanupStats, setCleanupStats] = useState<CleanupStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const { toast } = useToast()

  const fetchCleanupStats = async () => {
    setStatsLoading(true)
    try {
      const res = await fetch('/api/admin/cleanup/stats', { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setCleanupStats(json.data)
        }
      }
    } catch {
      // Silent fail for stats
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    fetchCleanupStats()
  }, [])

  const handleCleanup = async () => {
    const days = parseInt(retentionDays, 10)
    if (isNaN(days) || days < 1 || days > 90) {
      toast({
        title: 'Invalid Input',
        description: 'Retention days must be between 1 and 90',
        variant: 'destructive',
      })
      return
    }
    setCleaning(true)
    setCleanupResult(null)
    try {
      const res = await fetch(`/api/admin/cleanup?retentionDays=${days}`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setCleanupResult(json.data)
          toast({
            title: 'Cleanup Complete',
            description: `Deleted ${json.data.deleted} usage records older than ${json.data.retentionDays} days`,
          })
          fetchCleanupStats()
        }
      } else {
        const json = await res.json()
        toast({ title: 'Error', description: json.error || 'Cleanup failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    } finally {
      setCleaning(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">System Settings</h1>
        <p className="text-muted-foreground">Admin configuration and maintenance</p>
      </div>

      {/* Cleanup Usage Records */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-muted-foreground" />
            Cleanup Usage Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Delete old usage records to prevent unbounded table growth. Records older than
            the specified retention period will be permanently removed.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="retention-days">Retention Period (days)</Label>
              <Input
                id="retention-days"
                type="number"
                min={1}
                max={90}
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                placeholder="7"
                className="w-32"
              />
            </div>
            <Button
              onClick={handleCleanup}
              disabled={cleaning}
              variant="outline"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-2"
            >
              {cleaning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Execute Cleanup
            </Button>
          </div>

          {cleanupResult && (
            <Alert className="border-emerald-500/20 bg-emerald-500/5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <AlertTitle className="text-emerald-400">Cleanup Successful</AlertTitle>
              <AlertDescription className="text-muted-foreground">
                Deleted <strong className="text-foreground">{cleanupResult.deleted}</strong> records
                older than <strong className="text-foreground">{cleanupResult.retentionDays}</strong>{' '}
                days (cutoff: {formatDate(cleanupResult.cutoffDate)})
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Cleanup Stats */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            Usage Records Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : cleanupStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold text-sky-400">
                    {cleanupStats.totalRecords.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Records</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-400">
                    {cleanupStats.last7Days.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Last 7 Days</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold text-amber-400">
                    {cleanupStats.last30Days.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">8-30 Days</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold text-red-400">
                    {cleanupStats.olderThan30.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Older than 30 Days</p>
                </div>
              </div>
              <Separator />
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">Oldest record:</span>
                  {formatDate(cleanupStats.oldest)}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">Newest record:</span>
                  {formatDate(cleanupStats.newest)}
                </div>
              </div>
              {cleanupStats.olderThan30 > 0 && (
                <Alert className="border-amber-500/20 bg-amber-500/5">
                  <Info className="h-4 w-4 text-amber-400" />
                  <AlertTitle className="text-amber-400">High Record Count</AlertTitle>
                  <AlertDescription className="text-muted-foreground">
                    There are <strong className="text-foreground">{cleanupStats.olderThan30.toLocaleString()}</strong>{' '}
                    records older than 30 days. Consider running a cleanup to free up database space.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Unable to load cleanup statistics
            </p>
          )}
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="h-5 w-5 text-muted-foreground" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-sky-400" />
                <span className="text-sm font-medium">Admin Email</span>
              </div>
              <Badge variant="outline" className="border-sky-500/20 bg-sky-500/10 text-sky-400">
                {process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@cloudspace.dev'}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <Server className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium">API Server</span>
              </div>
              <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-medium">Database</span>
              </div>
              <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <HardDrive className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium">Docker Runtime</span>
              </div>
              <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                Operational
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
