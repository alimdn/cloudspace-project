'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Star, Loader2, Minus, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    features: ['2 Workspaces', '1 vCPU', '1 GB RAM', '10 GB Disk', '100 Pids', 'Community Support'],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '9',
    features: ['5 Workspaces', '2 vCPU per workspace', '4 GB RAM per workspace', '50 GB Disk per workspace', 'Total: 4 vCPU / 8 GB RAM / 100 GB Disk', '256 Pids', 'Email Support', 'Daily Backups'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '29',
    features: ['10 Workspaces', '4 vCPU per workspace', '16 GB RAM per workspace', '200 GB Disk per workspace', 'Total: 8 vCPU / 32 GB RAM / 500 GB Disk', '512 Pids', 'Priority Support', 'Backups every 6 hours', 'Custom Subdomain'],
  },
  {
    id: 'business',
    name: 'Business',
    price: '59',
    features: ['25 Workspaces', '8 vCPU per workspace', '32 GB RAM per workspace', '500 GB Disk per workspace', 'Total: 16 vCPU / 64 GB RAM / 1 TB Disk', '1024 Pids', 'Account Manager', 'Hourly Backups', '99.9% SLA'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '99',
    features: ['100 Workspaces', '16 vCPU per workspace', '64 GB RAM per workspace', '1 TB Disk per workspace', 'Total: 64 vCPU / 256 GB RAM / 5 TB Disk', '4096 Pids', 'Dedicated Support', 'Continuous Backups', 'Custom Domain', '99.99% SLA', 'Advanced API'],
  },
]

const comparisonFeatures = [
  {
    name: 'Workspaces',
    values: ['2', '5', '10', '25', '100'],
  },
  {
    name: 'CPU (per workspace)',
    values: ['1 vCPU', '2 vCPU', '4 vCPU', '8 vCPU', '16 vCPU'],
  },
  {
    name: 'RAM (per workspace)',
    values: ['1 GB', '4 GB', '16 GB', '32 GB', '64 GB'],
  },
  {
    name: 'Disk (per workspace)',
    values: ['10 GB', '50 GB', '200 GB', '500 GB', '1 TB'],
  },
  {
    name: 'Total CPU',
    values: ['1.5', '4', '8', '16', '64'],
  },
  {
    name: 'Total RAM',
    values: ['1.5 GB', '8 GB', '32 GB', '64 GB', '256 GB'],
  },
  {
    name: 'Total Disk',
    values: ['15 GB', '100 GB', '500 GB', '1 TB', '5 TB'],
  },
  {
    name: 'Max Processes',
    values: ['100', '256', '512', '1024', '4096'],
  },
  {
    name: 'Support',
    values: ['Community', 'Email', 'Priority', 'Priority', 'Dedicated'],
  },
  {
    name: 'Custom Domain',
    boolean: true,
    values: [false, false, true, true, true],
  },
  {
    name: 'Backups',
    values: ['None', 'Daily', 'Every 6h', 'Hourly', 'Continuous'],
  },
  {
    name: 'API Access',
    boolean: true,
    values: [false, true, true, true, true],
  },
  {
    name: 'SSL',
    boolean: true,
    values: [true, true, true, true, true],
  },
]

const planIds = ['free', 'basic', 'pro', 'business', 'enterprise']

export function PricingView() {
  const { user, setView } = useAppStore()
  const { toast } = useToast()
  const [subscribing, setSubscribing] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      setView('login')
      toast({ title: 'Sign In Required', description: 'Please sign in to subscribe to a plan', variant: 'destructive' })
      return
    }

    if (planId === user.plan) {
      toast({ title: 'Info', description: 'You are already subscribed to this plan' })
      return
    }

    if (planId === 'free') {
      toast({ title: 'Info', description: 'You can downgrade to the free plan from Settings' })
      return
    }

    setSubscribing(planId)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planId }),
      })
      const json = await res.json()
      if (res.ok) {
        toast({
          title: 'Checkout Initiated',
          description: `Redirecting to payment for ${plans.find(p => p.id === planId)?.name} plan...`,
        })
        // In production, redirect to Stripe checkout:
        // if (json.data?.url) window.location.href = json.data.url
      } else {
        toast({ title: 'Error', description: json.error || 'Failed to initiate checkout', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    } finally {
      setSubscribing(null)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Pricing & Plans</h1>
        <p className="text-muted-foreground">Choose the plan that fits your needs</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {plans.map((plan) => {
          const isCurrent = user?.plan === plan.id
          return (
            <Card
              key={plan.id}
              className={`border transition-all ${
                isCurrent
                  ? 'border-sky-500/50 bg-sky-500/5 shadow-lg shadow-sky-500/10'
                  : 'border-border hover:border-sky-500/20'
              }`}
            >
              <CardContent className="p-4 flex flex-col h-full">
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h3 className="font-semibold">{plan.name}</h3>
                    {isCurrent && (
                      <Badge className="bg-sky-500/10 text-sky-400 text-[10px]">
                        <Star className="h-2.5 w-2.5 ml-0.5" />
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-xs text-muted-foreground">/month</span>
                  </div>
                </div>

                <ul className="space-y-2 flex-1 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    isCurrent
                      ? ''
                      : 'bg-sky-500 hover:bg-sky-600 text-white'
                  }`}
                  variant={isCurrent ? 'outline' : 'default'}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrent || subscribing === plan.id}
                >
                  {subscribing === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Feature Comparison Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="p-4 md:p-6 pb-0">
            <h2 className="text-xl font-bold mb-1">Compare Plans</h2>
            <p className="text-sm text-muted-foreground">Detailed feature comparison across all plans</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground min-w-[140px]">Feature</th>
                  {planIds.map((planId) => {
                    const plan = plans.find(p => p.id === planId)!
                    const isCurrent = user?.plan === planId
                    return (
                      <th
                        key={planId}
                        className={`p-4 text-center font-medium min-w-[100px] ${
                          isCurrent ? 'text-sky-400' : 'text-foreground'
                        }`}
                      >
                        {plan.name}
                        {isCurrent && (
                          <Badge className="bg-sky-500/10 text-sky-400 text-[10px] ml-1">Current</Badge>
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, idx) => (
                  <tr
                    key={feature.name}
                    className={idx % 2 === 0 ? 'bg-muted/20' : ''}
                  >
                    <td className="p-4 font-medium text-muted-foreground">{feature.name}</td>
                    {feature.values.map((value, colIdx) => {
                      const isCurrent = user?.plan === planIds[colIdx]
                      const isBool = feature.boolean
                      if (isBool) {
                        return (
                          <td key={colIdx} className={`p-4 text-center ${isCurrent ? 'text-sky-400' : ''}`}>
                            {value ? (
                              <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                            )}
                          </td>
                        )
                      }
                      return (
                        <td key={colIdx} className={`p-4 text-center ${isCurrent ? 'text-sky-400' : ''}`}>
                          {value}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Need a custom plan?{' '}
          <button
            onClick={() => setView('support')}
            className="text-sky-400 hover:text-sky-300 font-medium"
          >
            Contact Us
          </button>
        </p>
      </div>
    </div>
  )
}
