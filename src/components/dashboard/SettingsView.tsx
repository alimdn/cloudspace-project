'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Mail,
  Lock,
  Bell,
  Shield,
  Save,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function SettingsView() {
  const { user, setUser, logout } = useAppStore()
  const { toast } = useToast()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    workspace: true,
    billing: true,
    marketing: false,
  })

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال الاسم', variant: 'destructive' })
      return
    }
    setSaving(true)
    // Simulate save
    setTimeout(() => {
      setUser({ ...user!, name, email })
      toast({ title: 'تم الحفظ', description: 'تم تحديث إعداداتك بنجاح' })
      setSaving(false)
    }, 1000)
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">الإعدادات</h1>
        <p className="text-muted-foreground">إدارة حسابك وتفضيلاتك</p>
      </div>

      {/* Profile */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            الملف الشخصي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-sky-500/20 flex items-center justify-center text-2xl font-bold text-sky-400">
              {user?.name?.charAt(0) || 'م'}
            </div>
            <div>
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                عضو منذ {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-SA') : 'الآن'}
              </p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background"
                dir="ltr"
                disabled
              />
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-sky-500 hover:bg-sky-600 gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ التغييرات
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            تغيير كلمة المرور
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>كلمة المرور الحالية</Label>
            <Input type="password" placeholder="••••••••" className="bg-background" dir="ltr" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>كلمة المرور الجديدة</Label>
              <Input type="password" placeholder="••••••••" className="bg-background" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>تأكيد كلمة المرور الجديدة</Label>
              <Input type="password" placeholder="••••••••" className="bg-background" dir="ltr" />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => toast({ title: 'تم', description: 'تم تغيير كلمة المرور بنجاح' })}
            className="gap-2"
          >
            <Lock className="h-4 w-4" />
            تحديث كلمة المرور
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            الإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'email' as const, label: 'إشعارات البريد الإلكتروني', desc: 'استلم إشعارات مهمة عبر البريد' },
            { key: 'workspace' as const, label: 'إشعارات مساحة العمل', desc: 'تنبيهات حالة مساحات العمل' },
            { key: 'billing' as const, label: 'إشعارات الفواتير', desc: 'تنبيهات الدفع والاشتراك' },
            { key: 'marketing' as const, label: 'العروض والتحديثات', desc: 'أخبار المنصة والعروض الخاصة' },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
              <div>
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={notifications[item.key]}
                onCheckedChange={(checked) =>
                  setNotifications((n) => ({ ...n, [item.key]: checked }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-destructive flex items-center gap-2">
            <Shield className="h-5 w-5" />
            منطقة الخطر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm">حذف الحساب</p>
              <p className="text-xs text-muted-foreground">
                سيتم حذف حسابك وجميع بياناتك بشكل نهائي
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={logout}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              حذف الحساب
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
