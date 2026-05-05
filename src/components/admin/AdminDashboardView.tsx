'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Users,
  Box,
  DollarSign,
  TicketCheck,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AdminStats {
  totalUsers: number
  totalWorkspaces: number
  totalRevenue: number
  openTickets: number
  recentUsers: {
    id: string
    name: string
    email: string
    plan: string
    createdAt: string
  }[]
  planDistribution: Record<string, number>
}

const planLabels: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  business: 'Business',
  enterprise: 'Enterprise',
}

const planColors: Record<string, string> = {
  free: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  basic: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  pro: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  business: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  enterprise: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

export function AdminDashboardView() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            setStats(json.data)
          }
        } else {
          toast({ title: 'Error', description: 'Failed to fetch admin stats', variant: 'destructive' })
        }
      } catch {
        toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [toast])

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      badgeBg: 'bg-sky-500/10 text-sky-400',
    },
    {
      label: 'Total Workspaces',
      value: stats?.totalWorkspaces ?? 0,
      icon: Box,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      badgeBg: 'bg-emerald-500/10 text-emerald-400',
    },
    {
      label: 'Total Revenue',
      value: stats?.totalRevenue ?? 0,
      icon: DollarSign,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      badgeBg: 'bg-amber-500/10 text-amber-400',
      prefix: '$',
    },
    {
      label: 'Open Tickets',
      value: stats?.openTickets ?? 0,
      icon: TicketCheck,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      badgeBg: 'bg-violet-500/10 text-violet-400',
    },
  ]

  const planEntries = stats?.planDistribution
    ? Object.entries(stats.planDistribution).filter(([, count]) => count > 0)
    : []

  const systemChecks = [
    { label: 'API Server', status: 'operational' as const },
    { label: 'Database', status: 'operational' as const },
    { label: 'Docker Runtime', status: 'operational' as const },
  ]

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and key metrics</p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Card key={card.label} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`h-10 w-10 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  {card.prefix || ''}
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Users */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : stats?.recentUsers && stats.recentUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={planColors[user.plan] || planColors.free}
                        >
                          {planLabels[user.plan] || user.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No users yet</p>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              Plan Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : planEntries.length > 0 ? (
              <div className="space-y-3">
                {planEntries.map(([plan, count]) => {
                  const total = stats?.totalUsers ?? 1
                  const percentage = Math.round((count / total) * 100)
                  return (
                    <div key={plan} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {planLabels[plan] || plan}
                        </span>
                        <span className="text-muted-foreground">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            plan === 'enterprise'
                              ? 'bg-amber-400'
                              : plan === 'business'
                              ? 'bg-emerald-400'
                              : plan === 'pro'
                              ? 'bg-violet-400'
                              : plan === 'basic'
                              ? 'bg-sky-400'
                              : 'bg-gray-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {systemChecks.map((check) => (
                <div
                  key={check.label}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    {check.status === 'operational' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                    )}
                    <span className="text-sm font-medium">{check.label}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      check.status === 'operational'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }
                  >
                    {check.status === 'operational' ? 'Operational' : 'Degraded'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
