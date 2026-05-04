'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Receipt, Download, CreditCard, CalendarDays, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface InvoiceData {
  id: string
  amount: number
  plan: string
  status: string
  date: string
}

interface PaymentMethod {
  type: string
  last4: string
  expiryMonth: number
  expiryYear: number
}

export function BillingView() {
  const { user } = useAppStore()
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, pmRes] = await Promise.all([
          fetch('/api/billing/invoices', { credentials: 'include' }),
          fetch('/api/billing/payment-method', { credentials: 'include' }).catch(() => null),
        ])

        if (invRes && invRes.ok) {
          const json = await invRes.json()
          if (json.success) {
            const invData = Array.isArray(json.data) ? json.data : json.data?.items || []
            setInvoices(invData)
          }
        } else {
          toast({ title: 'Error', description: 'Failed to load invoices', variant: 'destructive' })
        }

        if (pmRes && pmRes.ok) {
          const json = await pmRes.json()
          if (json.success && json.data) {
            setPaymentMethod(json.data)
          }
        }
      } catch {
        toast({ title: 'Error', description: 'Failed to load billing data', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [toast])

  const planLabels: Record<string, string> = {
    free: 'Free',
    basic: 'Basic',
    pro: 'Pro',
    business: 'Business',
    enterprise: 'Enterprise',
  }

  const planPrices: Record<string, string> = {
    free: '0',
    basic: '9',
    pro: '29',
    business: '59',
    enterprise: '99',
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

  const handleDownload = async (id: string) => {
    setDownloading(id)
    try {
      const res = await fetch(`/api/billing/invoices/${id}/download`, { credentials: 'include' })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${id}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast({ title: 'Downloaded', description: `Invoice ${id} downloaded successfully` })
      } else {
        const json = await res.json()
        toast({ title: 'Error', description: json.error || 'Failed to download invoice', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to download invoice', variant: 'destructive' })
    } finally {
      setDownloading(null)
    }
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
                ${planPrices[user?.plan || 'free'] || '0'}
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
          {loading ? (
            <Skeleton className="h-14 rounded-lg" />
          ) : paymentMethod ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-16 rounded-lg bg-muted flex items-center justify-center text-xs font-mono text-muted-foreground">
                  {paymentMethod.type.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">**** **** **** {paymentMethod.last4}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires {String(paymentMethod.expiryMonth).padStart(2, '0')}/{paymentMethod.expiryYear}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-16 rounded-lg bg-muted flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">No payment method</p>
                  <p className="text-xs text-muted-foreground">Add a payment method to upgrade your plan</p>
                </div>
              </div>
            </div>
          )}
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
                      disabled={downloading === inv.id}
                    >
                      {downloading === inv.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
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
