'use client'

import { motion } from 'framer-motion'
import {
  Shield,
  Zap,
  Globe,
  Server,
  Layers,
  RefreshCw,
} from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Full Isolation',
    description: 'Each workspace runs in a fully isolated Docker container with dedicated resources.',
  },
  {
    icon: Zap,
    title: 'Instant Setup',
    description: 'Create and launch your workspace in seconds with zero waiting time.',
  },
  {
    icon: Globe,
    title: 'Global Access',
    description: 'Get a unique URL for each workspace accessible from anywhere in the world.',
  },
  {
    icon: Server,
    title: 'Flexible Resources',
    description: 'Choose CPU, RAM, and storage exactly to match your workload needs.',
  },
  {
    icon: Layers,
    title: 'Full Control',
    description: 'Install any software, tools, or applications inside your workspace. You have root access and complete freedom.',
  },
  {
    icon: RefreshCw,
    title: 'Auto Backups',
    description: 'Automatic daily backups for all your workspaces and data.',
  },
]

export function FeaturesSection() {
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
            <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything you need to manage your cloud workspaces in one place.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-2xl border border-border bg-card p-6 hover:border-sky-500/30 hover:bg-sky-500/5 transition-all duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 mb-4 group-hover:bg-sky-500/20 transition-colors">
                <feature.icon className="h-6 w-6 text-sky-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
