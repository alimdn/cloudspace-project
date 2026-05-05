'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  UserCog,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AdminUser {
  id: string
  name: string
  email: string
  plan: string
  createdAt: string
  workspaces?: { id: string }[]
  _count?: { workspaces: number }
}

interface PaginatedResponse {
  success: boolean
  data: AdminUser[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
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

const planOptions = ['free', 'basic', 'pro', 'business', 'enterprise']

export function AdminUsersView() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const limit = 10

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [planChangeTarget, setPlanChangeTarget] = useState<AdminUser | null>(null)
  const [newPlan, setNewPlan] = useState('')
  const [changingPlan, setChangingPlan] = useState(false)

  const { toast } = useToast()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (search.trim()) {
        params.set('search', search.trim())
      }
      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: 'include',
      })
      if (res.ok) {
        const json: PaginatedResponse = await res.json()
        if (json.success !== false && json.data) {
          setUsers(json.data)
          setTotalUsers(json.pagination?.total ?? json.data.length)
        }
      } else {
        toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, search, toast])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const totalPages = Math.ceil(totalUsers / limit)

  const handlePlanChange = async () => {
    if (!planChangeTarget || !newPlan) return
    setChangingPlan(true)
    try {
      const res = await fetch(`/api/admin/users/${planChangeTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan: newPlan }),
      })
      if (res.ok) {
        toast({
          title: 'Plan Updated',
          description: `${planChangeTarget.name} changed to ${planLabels[newPlan]}`,
        })
        setPlanChangeTarget(null)
        setNewPlan('')
        fetchUsers()
      } else {
        const json = await res.json()
        toast({ title: 'Error', description: json.error || 'Failed to update plan', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    } finally {
      setChangingPlan(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        toast({ title: 'Deleted', description: `${deleteTarget.name} has been deleted` })
        setDeleteTarget(null)
        fetchUsers()
      } else {
        const json = await res.json()
        toast({ title: 'Error', description: json.error || 'Failed to delete user', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">User Management</h1>
        <p className="text-muted-foreground">Manage all registered users</p>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="text-xs">
          {totalUsers} user{totalUsers !== 1 ? 's' : ''}
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
            ) : users.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-center">Workspaces</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
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
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-sky-500/10 text-sky-400">
                          {user._count?.workspaces ?? user.workspaces?.length ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-sky-500/10 hover:text-sky-400"
                            onClick={() => {
                              setPlanChangeTarget(user)
                              setNewPlan(user.plan)
                            }}
                            title="Change plan"
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleteTarget(user)}
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No users found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({totalUsers} total)
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

      {/* Change Plan Dialog */}
      <AlertDialog open={!!planChangeTarget} onOpenChange={(open) => !open && setPlanChangeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Change plan for <strong>{planChangeTarget?.name}</strong> ({planChangeTarget?.email})
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={newPlan} onValueChange={setNewPlan}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                {planOptions.map((p) => (
                  <SelectItem key={p} value={p}>
                    {planLabels[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changingPlan}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePlanChange} disabled={changingPlan}>
              {changingPlan ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})?
              This will also delete all their workspaces and data. This action cannot be undone.
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
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
