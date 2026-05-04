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
    name: 'مجاني',
    price: '0',
    features: ['مساحة عمل واحدة', '1 vCPU', '1 GB RAM', '10 GB قرص', 'دعم عبر البريد'],
  },
  {
    id: 'basic',
    name: 'أساسي',
    price: '9',
    features: ['3 مساحات عمل', '2 vCPU', '4 GB RAM', '50 GB قرص', 'دعم 24/7', 'نسخ احتياطي يومي'],
  },
  {
    id: 'pro',
    name: 'احترافي',
    price: '29',
    features: ['10 مساحات عمل', '4 vCPU', '16 GB RAM', '200 GB قرص', 'دعم أولوية', 'نسخ كل 6 ساعات', 'نطاق فرعي'],
  },
  {
    id: 'business',
    name: 'أعمال',
    price: '59',
    features: ['25 مساحة عمل', '8 vCPU', '32 GB RAM', '500 GB قرص', 'مدير حساب', 'نسخ كل ساعة', 'نطاق فرعي', 'SLA 99.9%'],
  },
  {
    id: 'enterprise',
    name: 'مؤسسات',
    price: '99',
    features: ['مساحات غير محدودة', '16 vCPU', '64 GB RAM', '1 TB قرص', 'فريق دعم مخصص', 'نسخ مستمر', 'نطاق مخصص', 'SLA 99.99%', 'API متقدم'],
  },
]

export function PricingView() {
  const { user, setUser, setView } = useAppStore()
  const { toast } = useToast()

  const handleSubscribe = (planId: string) => {
    if (planId === user?.plan) {
      toast({ title: 'معلومة', description: 'أنت مشترك بالفعل في هذه الخطة' })
      return
    }
    // Simulate subscription
    setUser({ ...(user!), plan: planId })
    toast({ title: 'تم بنجاح!', description: `تم تغيير خطتك إلى ${plans.find(p => p.id === planId)?.name}` })
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">الأسعار والخطط</h1>
        <p className="text-muted-foreground">اختر الخطة المناسبة لاحتياجاتك</p>
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
                        <Star className="h-2.5 w-2.5 mr-0.5" />
                        الحالية
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-xs text-muted-foreground">/شهر</span>
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
                  {isCurrent ? 'الخطة الحالية' : 'اشترك'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          هل تحتاج خطة مخصصة؟{' '}
          <button
            onClick={() => setView('support')}
            className="text-sky-400 hover:text-sky-300 font-medium"
          >
            تواصل معنا
          </button>
        </p>
      </div>
    </div>
  )
}
