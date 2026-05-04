'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    question: 'What is a cloud workspace?',
    answer:
      'A cloud workspace is a fully isolated Docker container where you get dedicated resources (CPU, RAM, storage). You can run any open-source application such as n8n, WordPress, databases, and more.',
  },
  {
    question: 'Is my data protected?',
    answer:
      'Absolutely. Each workspace is completely isolated from all others. We use AES-256 encryption for data at rest and HTTPS for secure transfers. Automatic backups are included based on your plan.',
  },
  {
    question: 'How can I upgrade between plans?',
    answer:
      'You can upgrade anytime from the Pricing page in your dashboard. The price difference will be prorated based on the remaining time of your current subscription.',
  },
  {
    question: 'Can I run any application?',
    answer:
      'You can run any open-source application that supports Docker containers. This includes n8n, WordPress, Nextcloud, MySQL, PostgreSQL, Redis, Node.js, Python, and many more.',
  },
  {
    question: 'What happens when my subscription expires?',
    answer:
      'When your subscription expires, workspaces are temporarily suspended while your data is preserved for 30 days. You can resubscribe within this period to fully restore your workspaces.',
  },
  {
    question: 'Is there a bandwidth limit?',
    answer:
      'All plans include unlimited data transfer. We do not impose any additional charges on traffic or bandwidth usage.',
  },
  {
    question: 'How does technical support work?',
    answer:
      'We provide email support for all plans. Basic plans and above get 24/7 support. Business and Enterprise plans receive a dedicated account manager and a specialized support team.',
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-muted-foreground">
            Answers to the most common questions about CloudSpace.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-sky-500/20"
              >
                <span className="font-medium text-sm">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ml-4',
                    openIndex === i && 'rotate-180'
                  )}
                />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-3 text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
