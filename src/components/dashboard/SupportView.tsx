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
    q: 'How do I create a new workspace?',
    a: 'Go to the "Workspaces" page and click "New Workspace". Choose your platform and resources, then click "Create".',
  },
  {
    q: 'How do I change my plan?',
    a: 'Go to the "Pricing" page and select your new plan. The change will take effect immediately.',
  },
  {
    q: 'I can\'t access my workspace',
    a: 'Make sure the workspace is running. If the problem persists, contact our support team.',
  },
  {
    q: 'How do I get an invoice?',
    a: 'Go to the "Billing" page and click the download button next to any invoice.',
  },
]

const categories = [
  { icon: HelpCircle, label: 'General Question', color: 'text-sky-400 bg-sky-500/10' },
  { icon: Bug, label: 'Technical Issue', color: 'text-red-400 bg-red-500/10' },
  { icon: BookOpen, label: 'Feature Request', color: 'text-emerald-400 bg-emerald-500/10' },
  { icon: MessageSquare, label: 'Other', color: 'text-violet-400 bg-violet-500/10' },
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
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' })
      return
    }
    setSending(true)
    setTimeout(() => {
      toast({ title: 'Sent', description: 'We will get back to you as soon as possible' })
      setSubject('')
      setMessage('')
      setSending(false)
    }, 1500)
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Help & Support</h1>
        <p className="text-muted-foreground">How can we help you?</p>
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
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-lg border border-border">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex items-center justify-between w-full p-3 text-left"
              >
                <span className="text-sm font-medium">{faq.q}</span>
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${openFaq === i ? 'bg-sky-500/10 text-sky-400' : ''}`}
                >
                  {openFaq === i ? 'Hide' : 'Show'}
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
            Contact Us
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or question in detail..."
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
              Send Message
            </Button>
            <span className="text-xs text-muted-foreground">
              We respond within 24 business hours
            </span>
          </div>
        </CardContent>
      </Card>

      {/* External links */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="gap-2" onClick={() => window.open('#', '_blank')}>
          <BookOpen className="h-4 w-4" />
          Documentation
          <ExternalLink className="h-3 w-3" />
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => window.open('#', '_blank')}>
          <MessageSquare className="h-4 w-4" />
          Discord Community
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
