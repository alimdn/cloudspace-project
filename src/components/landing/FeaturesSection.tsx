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
    title: 'عزل تام',
    description: 'كل مساحة عمل في حاوية Docker معزولة بالكامل مع موارد مخصصة.',
  },
  {
    icon: Zap,
    title: 'تشغيل فوري',
    description: 'انشاء مساحة العمل وتشغيلها في ثوانٍ معدودة بدون انتظار.',
  },
  {
    icon: Globe,
    title: 'وصول عالمي',
    description: 'احصل على رابط خاص لكل مساحة عمل للوصول من أي مكان.',
  },
  {
    icon: Server,
    title: 'موارد مرنة',
    description: 'اختر بين وحدات المعالجة والذاكرة والتخزين حسب احتياجاتك.',
  },
  {
    icon: Layers,
    title: 'برامج متنوعة',
    description: 'شغّل n8n، WordPress، Nextcloud، قواعد البيانات، والمزيد.',
  },
  {
    icon: RefreshCw,
    title: 'نسخ احتياطي تلقائي',
    description: 'نسخ احتياطية يومية تلقائية لجميع مساحات العمل.',
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
            مميزات{' '}
            <span className="bg-gradient-to-l from-sky-400 to-cyan-400 bg-clip-text text-transparent">
              قوية
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            كل ما تحتاجه لإدارة مساحات العمل السحابية الخاصة بك في مكان واحد.
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
