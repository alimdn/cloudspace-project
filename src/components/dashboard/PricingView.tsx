'use client'

import { useAppStore } from '@/store/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Star } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    features: ['1 Workspace', '1 vCPU', '1 GB RAM', '10 GB Disk', 'Email Support'],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '9',
    features: ['3 Workspaces', '2 vCPU', '4 GB RAM', '50 GB Disk', '24/7 Support', 'Daily Backups'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '29',
    features: ['10 Workspaces', '4 vCPU', '16 GB RAM', '200 GB Disk', 'Priority Support', 'Backups every 6 hours', 'Custom Subdomain'],
  },
  {
    id: 'business',
    name: 'Business',
    price: '59',
    features: ['25 Workspaces', '8 vCPU', '32 GB RAM', '500 GB Disk', 'Account Manager', 'Hourly Backups', 'Custom Subdomain', '99.9% SLA'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '99',
    features: ['Unlimited Workspaces', '16 vCPU', '64 GB RAM', '1 TB Disk', 'Dedicated Support', 'Continuous Backups', 'Custom Domain', '99.99% SLA', 'Advanced API'],
  },
]

export function PricingView() {
  const { user, setUser, setView } = useAppStore()
  const { toast } = useToast()

  const handleSubscribe = (planId: string) => {
    if (planId === user?.plan) {
      toast({ title: 'Info', description: 'You are already subscribed to this plan' })
      return
    }
    // Simulate subscription
    setUser({ ...(user!), plan: planId })
    toast({ title: 'Success!', description: `Your plan has been changed to ${plans.find(p => p.id === planId)?.name}` })
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
                  disabled={isCurrent}
                >
                  {isCurrent ? 'Current Plan' : 'Subscribe'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

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
