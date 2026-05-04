'use client'

import { motion } from 'framer-motion'
import { UserPlus, CreditCard, Rocket, Monitor } from 'lucide-react'

const steps = [
  {
    icon: UserPlus,
    step: '1',
    title: 'Create Your Account',
    description: 'Sign up for a free account in under one minute.',
  },
  {
    icon: CreditCard,
    step: '2',
    title: 'Choose Your Plan',
    description: 'Select from flexible plans starting at just $9/month.',
  },
  {
    icon: Rocket,
    step: '3',
    title: 'Create a Workspace',
    description: 'Pick your resources, choose your app, and launch your container.',
  },
  {
    icon: Monitor,
    step: '4',
    title: 'Start Using',
    description: 'Access your workspace and start running your applications immediately.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            How Does It{' '}
            <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
              Work?
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Four simple steps to get your own cloud workspace up and running.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 -right-4 w-8 border-t border-dashed border-sky-500/30" />
              )}
              
              <div className="relative inline-flex">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-card">
                  <item.icon className="h-10 w-10 text-sky-400" />
                </div>
                <span className="absolute -top-2 -left-2 flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
                  {item.step}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
