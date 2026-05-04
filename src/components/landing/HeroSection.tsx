'use client'

import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Cloud, ArrowLeft, Play, Shield, Zap } from 'lucide-react'

export function HeroSection() {
  const { setView } = useAppStore()

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.15)_0%,_transparent_60%)]" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-1.5 mb-8">
            <Zap className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-sm text-sky-300">منصة سحابية جديدة بالكامل</span>
          </div>

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20 shadow-lg shadow-sky-500/5">
                <Cloud className="h-8 w-8 text-sky-400" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-foreground">مساحات عمل</span>
            <br />
            <span className="bg-gradient-to-l from-sky-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              سحابية معزولة
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            احصل على حاويات Docker معزولة بالكامل مع موارد مخصصة.
            <br className="hidden sm:block" />
            شغّل أي برنامج مفتوح المصدر — n8n، WordPress، قواعد البيانات، والمزيد.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/25 px-8 h-12 text-base gap-2"
              onClick={() => setView('register')}
            >
              ابدأ مجاناً
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border hover:bg-accent px-8 h-12 text-base gap-2"
              onClick={() => {
                const el = document.getElementById('how-it-works')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <Play className="h-4 w-4" />
              شاهد كيف يعمل
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-sky-400" />
              <span>تشفير كامل</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-sky-400" />
              <span>تشغيل فوري</span>
            </div>
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-sky-400" />
              <span>99.9% وقت تشغيل</span>
            </div>
          </div>
        </motion.div>

        {/* Floating stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {[
            { value: '+10,000', label: 'مستخدم نشط' },
            { value: '+50,000', label: 'حاوية مُنشأة' },
            { value: '99.9%', label: 'وقت التشغيل' },
            { value: '24/7', label: 'دعم فني' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-4"
            >
              <p className="text-2xl font-bold text-sky-400">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
