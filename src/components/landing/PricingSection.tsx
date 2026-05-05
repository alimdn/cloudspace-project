'use client'

import { useAppStore } from '@/store/useAppStore'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Check, ArrowRight } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '0',
    period: '/month',
    description: 'Perfect for trying out',
    color: 'from-slate-500 to-slate-600',
    features: [
      '2 Workspaces',
      '1 vCPU',
      '1 GB RAM',
      '10 GB Disk',
      'Community Support',
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    name: 'Basic',
    price: '9',
    period: '/month',
    description: 'For small projects',
    color: 'from-sky-500 to-cyan-500',
    features: [
      '5 Workspaces',
      '2 vCPU per workspace',
      '4 GB RAM per workspace',
      '50 GB Disk per workspace',
      'Email Support',
      'Daily Backups',
    ],
    cta: 'Subscribe Now',
    popular: true,
  },
  {
    name: 'Pro',
    price: '29',
    period: '/month',
    description: 'For growing teams',
    color: 'from-violet-500 to-purple-500',
    features: [
      '10 Workspaces',
      '4 vCPU per workspace',
      '16 GB RAM per workspace',
      '200 GB Disk per workspace',
      'Priority Support',
      'Backups every 6 hours',
      'Custom Subdomain',
    ],
    cta: 'Subscribe Now',
    popular: false,
  },
  {
    name: 'Business',
    price: '59',
    period: '/month',
    description: 'For medium companies',
    color: 'from-amber-500 to-orange-500',
    features: [
      '25 Workspaces',
      '8 vCPU per workspace',
      '32 GB RAM per workspace',
      '500 GB Disk per workspace',
      'Account Manager',
      'Hourly Backups',
      '99.9% SLA',
    ],
    cta: 'Subscribe Now',
    popular: false,
  },
  {
    name: 'Enterprise',
    price: '99',
    period: '/month',
    description: 'For large organizations',
    color: 'from-emerald-500 to-teal-500',
    features: [
      '100 Workspaces',
      '16 vCPU per workspace',
      '64 GB RAM per workspace',
      '1 TB Disk per workspace',
      'Dedicated Support Team',
      'Continuous Backups',
      'Custom Domain',
      '99.99% SLA',
      'Advanced API',
    ],
    cta: 'Contact Us',
    popular: false,
  },
]

export function PricingSection() {
  const { setView, isAuthenticated } = useAppStore()

  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Flexible{' '}
            <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
              Plans
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Choose the plan that fits your needs. Upgrade or change anytime.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl border bg-card p-6 transition-all duration-300 hover:shadow-xl ${
                plan.popular
                  ? 'border-sky-500/50 shadow-lg shadow-sky-500/10'
                  : 'border-border hover:border-sky-500/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-sky-500 px-3 py-1 text-xs font-medium text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  plan.popular
                    ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/25'
                    : ''
                }`}
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => {
                  if (isAuthenticated) {
                    setView('pricing')
                  } else {
                    setView('register')
                  }
                }}
              >
                {plan.cta}
                {!isAuthenticated && <ArrowRight className="h-3.5 w-3.5 ml-1" />}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
