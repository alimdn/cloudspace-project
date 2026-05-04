'use client'

import { useAppStore } from '@/store/useAppStore'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Check, ArrowLeft } from 'lucide-react'

const plans = [
  {
    name: 'مجاني',
    price: '0',
    period: '/شهرياً',
    description: 'مثالي للتجربة والبدء',
    color: 'from-slate-500 to-slate-600',
    features: [
      'مساحة عمل واحدة',
      '1 vCPU',
      '1 GB RAM',
      '10 GB قرص صلب',
      'دعم عبر البريد',
    ],
    cta: 'ابدأ مجاناً',
    popular: false,
  },
  {
    name: 'أساسي',
    price: '9',
    period: '/شهرياً',
    description: 'للمشاريع الصغيرة',
    color: 'from-sky-500 to-cyan-500',
    features: [
      '3 مساحات عمل',
      '2 vCPU',
      '4 GB RAM',
      '50 GB قرص صلب',
      'دعم على مدار الساعة',
      'نسخ احتياطي يومي',
    ],
    cta: 'اشترك الآن',
    popular: true,
  },
  {
    name: 'احترافي',
    price: '29',
    period: '/شهرياً',
    description: 'للفرق المتنامية',
    color: 'from-violet-500 to-purple-500',
    features: [
      '10 مساحات عمل',
      '4 vCPU',
      '16 GB RAM',
      '200 GB قرص صلب',
      'دعم أولوية عالية',
      'نسخ احتياطي كل 6 ساعات',
      'نطاق فرعي خاص',
    ],
    cta: 'اشترك الآن',
    popular: false,
  },
  {
    name: 'أعمال',
    price: '59',
    period: '/شهرياً',
    description: 'للشركات المتوسطة',
    color: 'from-amber-500 to-orange-500',
    features: [
      '25 مساحة عمل',
      '8 vCPU',
      '32 GB RAM',
      '500 GB قرص صلب',
      'مدير حساب مخصص',
      'نسخ احتياطي كل ساعة',
      'نطاق فرعي خاص',
      'SLA مضمون 99.9%',
    ],
    cta: 'اشترك الآن',
    popular: false,
  },
  {
    name: 'مؤسسات',
    price: '99',
    period: '/شهرياً',
    description: 'للمؤسسات الكبيرة',
    color: 'from-emerald-500 to-teal-500',
    features: [
      'مساحات عمل غير محدودة',
      '16 vCPU',
      '64 GB RAM',
      '1 TB قرص صلب',
      'فريق دعم مخصص',
      'نسخ احتياطي مستمر',
      'نطاق مخصص',
      'SLA مضمون 99.99%',
      'تكامل API متقدم',
    ],
    cta: 'تواصل معنا',
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
            خطط{' '}
            <span className="bg-gradient-to-l from-sky-400 to-cyan-400 bg-clip-text text-transparent">
              مرنة
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            اختر الخطة المناسبة لاحتياجاتك. يمكنك الترقية أو التغيير في أي وقت.
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
                    الأكثر شعبية
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
                {!isAuthenticated && <ArrowLeft className="h-3.5 w-3.5 mr-1" />}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
