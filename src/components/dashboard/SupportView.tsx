'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Mail,
  Send,
  Loader2,
  ExternalLink,
  HelpCircle,
  BookOpen,
  Bug,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const faqs = [
  {
    q: 'كيف أنشئ مساحة عمل جديدة؟',
    a: 'اذهب إلى صفحة "مساحات العمل" وانقر على "مساحة جديدة". اختر المنصة والموارد ثم اضغط "إنشاء".',
  },
  {
    q: 'كيف أغير خطتي؟',
    a: 'اذهب إلى صفحة "الأسعار" واختر الخطة الجديدة. سيتم تطبيق التغيير فوراً.',
  },
  {
    q: 'لا أستطيع الوصول لمساحة العمل',
    a: 'تأكد أن المساحة تعمل. إذا استمرت المشكلة، تواصل مع الدعم الفني.',
  },
  {
    q: 'كيف أحصل على فاتورة؟',
    a: 'اذهب إلى صفحة "الفواتير" واضغط على زر التحميل بجانب أي فاتورة.',
  },
]

const categories = [
  { icon: HelpCircle, label: 'سؤال عام', color: 'text-sky-400 bg-sky-500/10' },
  { icon: Bug, label: 'مشكلة تقنية', color: 'text-red-400 bg-red-500/10' },
  { icon: BookOpen, label: 'طلب ميزة', color: 'text-emerald-400 bg-emerald-500/10' },
  { icon: MessageSquare, label: 'أخرى', color: 'text-violet-400 bg-violet-500/10' },
]

export function SupportView() {
  const { toast } = useToast()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('general')
  const [sending, setSending] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول', variant: 'destructive' })
      return
    }
    setSending(true)
    setTimeout(() => {
      toast({ title: 'تم الإرسال', description: 'سنتواصل معك في أقرب وقت' })
      setSubject('')
      setMessage('')
      setSending(false)
    }, 1500)
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">المساعدة والدعم</h1>
        <p className="text-muted-foreground">كيف يمكننا مساعدتك؟</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categories.map((cat) => (
          <Card
            key={cat.label}
            className="border-border hover:border-sky-500/20 cursor-pointer transition-colors"
            onClick={() => setCategory(cat.label)}
          >
            <CardContent className="p-4 text-center">
              <div className={`h-10 w-10 rounded-lg ${cat.color} flex items-center justify-center mx-auto mb-2`}>
                <cat.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">{cat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            الأسئلة الشائعة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-lg border border-border">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex items-center justify-between w-full p-3 text-right"
              >
                <span className="text-sm font-medium">{faq.q}</span>
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${openFaq === i ? 'bg-sky-500/10 text-sky-400' : ''}`}
                >
                  {openFaq === i ? 'إخفاء' : 'عرض'}
                </Badge>
              </button>
              {openFaq === i && (
                <div className="px-3 pb-3 text-sm text-muted-foreground leading-relaxed border-t border-border pt-2">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contact Form */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            تواصل معنا
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>الموضوع</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="موضوع رسالتك"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label>الرسالة</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اشرح مشكلتك أو استفسارك بالتفصيل..."
              className="bg-background min-h-[120px]"
              rows={5}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSend}
              disabled={sending}
              className="bg-sky-500 hover:bg-sky-600 gap-2"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              إرسال الرسالة
            </Button>
            <span className="text-xs text-muted-foreground">
              سنرد خلال 24 ساعة عمل
            </span>
          </div>
        </CardContent>
      </Card>

      {/* External links */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="gap-2" onClick={() => window.open('#', '_blank')}>
          <BookOpen className="h-4 w-4" />
          التوثيق
          <ExternalLink className="h-3 w-3" />
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => window.open('#', '_blank')}>
          <MessageSquare className="h-4 w-4" />
          مجتمع Discord
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
