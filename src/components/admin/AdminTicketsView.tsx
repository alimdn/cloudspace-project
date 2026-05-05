'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AdminTicket {
  id: string
  subject: string
  message: string
  category: string
  status: string
  createdAt: string
  user: { email: string } | { email: string; name: string }
}

interface PaginatedResponse {
  success: boolean
  data: AdminTicket[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

const statusColors: Record<string, string> = {
  open: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  closed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  closed: 'Closed',
}

const categoryLabels: Record<string, string> = {
  general: 'General',
  technical: 'Technical',
  billing: 'Billing',
  feature: 'Feature Request',
  other: 'Other',
}

const statusFilters = ['all', 'open', 'in_progress', 'closed'] as const

export function AdminTicketsView() {
  const [tickets, setTickets] = useState<AdminTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalTickets, setTotalTickets] = useState(0)
  const limit = 10

  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null)

  const { toast } = useToast()

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      const res = await fetch(`/api/admin/tickets?${params.toString()}`, {
        credentials: 'include',
      })
      if (res.ok) {
        const json: PaginatedResponse = await res.json()
        if (json.success !== false && json.data) {
          setTickets(json.data)
          setTotalTickets(json.pagination?.total ?? json.data.length)
        }
      } else {
        toast({ title: 'Error', description: 'Failed to fetch tickets', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, toast])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const totalPages = Math.ceil(totalTickets / limit)

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Support Tickets</h1>
        <p className="text-muted-foreground">View and manage user support requests</p>
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
              <TabsTrigger key={status} value={status} className="text-xs">
                {status === 'all' ? 'All' : statusLabels[status]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Badge variant="secondary" className="text-xs">
          {totalTickets} ticket{totalTickets !== 1 ? 's' : ''}
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
            ) : tickets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {ticket.subject}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ticket.user?.email ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {categoryLabels[ticket.category] || ticket.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColors[ticket.status] || statusColors.open}
                        >
                          {statusLabels[ticket.status] || ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleDateString('en-US', {
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
              <div className="text-center py-12">
                <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No tickets found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({totalTickets} total)
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

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            <DialogDescription>
              From {selectedTicket?.user?.email ?? 'Unknown'}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {categoryLabels[selectedTicket.category] || selectedTicket.category}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    statusColors[selectedTicket.status] || statusColors.open
                  }
                >
                  {statusLabels[selectedTicket.status] || selectedTicket.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(selectedTicket.createdAt).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.message}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
