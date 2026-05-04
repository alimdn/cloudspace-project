'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Receipt, Download, CreditCard, CalendarDays } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface InvoiceData {
  id: string
  amount: number
  plan: string
  status: string
  date: string
}

export function BillingView() {
  const { user } = useAppStore()
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch('/api/billing/invoices')
        if (res.ok) {
          const data = await res.json()
          setInvoices(data)
        }
      } catch {
        // Generate mock invoices
        setInvoices([
          { id: 'inv-001', amount: 9, plan: 'Basic', status: 'paid', date: new Date().toISOString() },
          { id: 'inv-002', amount: 9, plan: 'Basic', status: 'paid', date: new Date(Date.now() - 30 * 86400000).toISOString() },
          { id: 'inv-003', amount: 0, plan: 'Free', status: 'paid', date: new Date(Date.now() - 60 * 86400000).toISOString() },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchInvoices()
  }, [])

  const planLabels: Record<string, string> = {
    free: 'Free',
    basic: 'Basic',
    pro: 'Pro',
    business: 'Business',
    enterprise: 'Enterprise',
  }

  const statusLabels: Record<string, string> = {
    paid: 'Paid',
    pending: 'Pending',
    failed: 'Failed',
  }

  const statusColors: Record<string, string> = {
    paid: 'bg-emerald-500/10 text-emerald-400',
    pending: 'bg-amber-500/10 text-amber-400',
    failed: 'bg-red-500/10 text-red-400',
  }

  const handleDownload = (id: string) => {
    toast({ title: 'Downloading', description: `Downloading invoice ${id}` })
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Billing & Payments</h1>
        <p className="text-muted-foreground">Manage your invoices and payment methods</p>
      </div>

      {/* Current plan summary */}
      <Card className="border-border bg-gradient-to-b from-sky-500/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <CreditCard className="h-7 w-7 text-sky-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-2xl font-bold">
                  {planLabels[user?.plan || 'free'] || user?.plan}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Monthly Cost</p>
              <p className="text-2xl font-bold">
                $
                {user?.plan === 'free'
                  ? '0'
                  : user?.plan === 'basic'
                  ? '9'
                  : user?.plan === 'pro'
                  ? '29'
                  : user?.plan === 'business'
                  ? '59'
                  : '99'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment method */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-16 rounded-lg bg-muted flex items-center justify-center text-xs font-mono text-muted-foreground">
                VISA
              </div>
              <div>
                <p className="text-sm font-medium">**** **** **** 4242</p>
                <p className="text-xs text-muted-foreground">Expires 12/2025</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{inv.plan}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(inv.date).toLocaleDateString('en-US')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className={statusColors[inv.status]}>
                      {statusLabels[inv.status]}
                    </Badge>
                    <span className="font-semibold text-sm">${inv.amount}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(inv.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
