'use client'

import { useState, useRef } from 'react'
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
  Paperclip,
  X,
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
  { icon: HelpCircle, label: 'General Question', value: 'general', color: 'text-sky-400 bg-sky-500/10' },
  { icon: Bug, label: 'Technical Issue', value: 'technical', color: 'text-red-400 bg-red-500/10' },
  { icon: BookOpen, label: 'Feature Request', value: 'feature', color: 'text-emerald-400 bg-emerald-500/10' },
  { icon: MessageSquare, label: 'Other', value: 'other', color: 'text-violet-400 bg-violet-500/10' },
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function SupportView() {
  const { toast } = useToast()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('general')
  const [sending, setSending] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File Too Large',
        description: `Maximum file size is 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
        variant: 'destructive',
      })
      // Reset the input
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setSelectedFile(file)
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' })
      return
    }
    if (message.trim().length < 10) {
      toast({ title: 'Error', description: 'Message must be at least 10 characters', variant: 'destructive' })
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          category,
          attachment: selectedFile ? {
            name: selectedFile.name,
            size: selectedFile.size,
            type: selectedFile.type,
          } : undefined,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        const ticketId = json.data?.ticketId || ''
        toast({
          title: 'Ticket Submitted',
          description: ticketId
            ? `Ticket ${ticketId} created. We will get back to you as soon as possible.`
            : 'We will get back to you as soon as possible.',
        })
        setSubject('')
        setMessage('')
        setCategory('general')
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        const json = await res.json()
        toast({ title: 'Error', description: json.error || 'Failed to submit ticket', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    } finally {
      setSending(false)
    }
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
            className={`border-border hover:border-sky-500/20 cursor-pointer transition-colors ${
              category === cat.value ? 'border-sky-500/50 bg-sky-500/5' : ''
            }`}
            onClick={() => setCategory(cat.value)}
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Category:</span>
            <Badge variant="secondary" className="text-xs">
              {categories.find((c) => c.value === category)?.label || category}
            </Badge>
          </div>
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

          {/* File Attachment */}
          <div className="space-y-2">
            <Label>Attachment (optional)</Label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".png,.jpg,.jpeg,.gif,.pdf,.txt,.log,.zip"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-3.5 w-3.5" />
                Choose File
              </Button>
              <span className="text-xs text-muted-foreground">
                Max 5MB (PNG, JPG, PDF, TXT, ZIP)
              </span>
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5 text-sm">
                <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(selectedFile.size / 1024).toFixed(0)} KB
                </span>
                <button
                  onClick={removeFile}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
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
        <Button variant="outline" className="gap-2" asChild>
          <a href="https://docs.cloudspace.dev" target="_blank" rel="noopener noreferrer">
            <BookOpen className="h-4 w-4" />
            Documentation
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
        <Button variant="outline" className="gap-2" asChild>
          <a href="https://discord.gg/cloudspace" target="_blank" rel="noopener noreferrer">
            <MessageSquare className="h-4 w-4" />
            Discord Community
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </div>
    </div>
  )
}
