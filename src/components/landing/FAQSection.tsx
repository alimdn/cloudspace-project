'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    question: 'ما هي مساحة العمل السحابية؟',
    answer:
      'مساحة العمل السحابية هي حاوية Docker معزولة بالكامل تحصل فيها على موارد مخصصة (معالج، ذاكرة، تخزين). يمكنك تشغيل أي برنامج مفتوح المصدر مثل n8n، WordPress، قواعد البيانات، والمزيد.',
  },
  {
    question: 'هل بياناتي محمية؟',
    answer:
      'نعم بالتأكيد. كل مساحة عمل معزولة تماماً عن المساحات الأخرى. نستخدم تشفير AES-256 للبيانات في حالة السكون ونقل آمن HTTPS. كما نوفر نسخاً احتياطية تلقائية حسب خطتك.',
  },
  {
    question: 'كيف يمكنني الترقية بين الخطط؟',
    answer:
      'يمكنك الترقية في أي وقت من صفحة الأسعار في لوحة التحكم. سيتم احتساب الفرق في السعر بشكل تناسبي مع المدة المتبقية من اشتراكك الحالي.',
  },
  {
    question: 'هل يمكنني تشغيل أي برنامج؟',
    answer:
      'يمكنك تشغيل أي برنامج مفتوح المصدر يدعم التشغيل في حاويات Docker. يشمل ذلك n8n، WordPress، Nextcloud، MySQL، PostgreSQL، Redis، Node.js، Python، والمزيد.',
  },
  {
    question: 'ماذا يحدث عند انتهاء الاشتراك؟',
    answer:
      'عند انتهاء الاشتراك، يتم إيقاف مساحات العمل مؤقتاً مع الاحتفاظ ببياناتك لمدة 30 يوماً. يمكنك إعادة الاشتراك خلال هذه الفترة لاستعادة مساحات العمل بالكامل.',
  },
  {
    question: 'هل يوجد حد للنطاق الترددي؟',
    answer:
      'جميع الخطط تشمل نقل بيانات غير محدود. لا نفرض أي رسوم إضافية على حركة البيانات.',
  },
  {
    question: 'كيف يعمل الدعم الفني؟',
    answer:
      'نوفر دعماً عبر البريد الإلكتروني لجميع الخطط. خطط الأساسي وما فوق تحصل على دعم على مدار الساعة. خطط الأعمال والمؤسسات تحصل على مدير حساب مخصص وفريق دعم مخصص.',
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
            الأسئلة{' '}
            <span className="bg-gradient-to-l from-sky-400 to-cyan-400 bg-clip-text text-transparent">
              الشائعة
            </span>
          </h2>
          <p className="text-muted-foreground">
            إجابات على أكثر الأسئلة شيوعاً حول منصة كلاود سبيس.
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
                className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-right transition-colors hover:border-sky-500/20"
              >
                <span className="font-medium text-sm">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 mr-4',
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
