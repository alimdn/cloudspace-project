'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  User,
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

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  // Notifications
  const [notifications, setNotifications] = useState({
    email: true,
    workspace: true,
    billing: true,
    marketing: false,
  })
  const [savingNotifications, setSavingNotifications] = useState(false)

  // Delete account
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Sync name/email when user changes
  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [user])

  // Fetch notification settings on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/user/notifications', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            setNotifications(json.data)
          }
        }
      } catch {
        // Use defaults
      }
    }
    fetchNotifications()
  }, [])

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Please enter your name', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setUser(json.data)
        }
        toast({ title: 'Saved', description: 'Your settings have been updated successfully' })
      } else {
        const json = await res.json()
        toast({ title: 'Error', description: json.error || 'Failed to save settings', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast({ title: 'Error', description: 'Please enter your current password', variant: 'destructive' })
      return
    }
    if (!newPassword) {
      toast({ title: 'Error', description: 'Please enter a new password', variant: 'destructive' })
      return
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: 'Error', description: 'New passwords do not match', variant: 'destructive' })
      return
    }
    if (newPassword.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' })
      return
    }
    setChangingPassword(true)
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        toast({ title: 'Password Updated', description: 'Please sign in again with your new password' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
        // Logout user since sessions are invalidated
        setTimeout(() => logout(), 1500)
      } else {
        const json = await res.json()
        toast({ title: 'Error', description: json.error || 'Failed to change password', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    } finally {
      setChangingPassword(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSavingNotifications(true)
    try {
      const res = await fetch('/api/user/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(notifications),
      })
      if (res.ok) {
        toast({ title: 'Saved', description: 'Notification preferences updated' })
      } else {
        toast({ title: 'Error', description: 'Failed to save notification settings', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    } finally {
      setSavingNotifications(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/user/account', {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted' })
        logout()
      } else {
        const json = await res.json()
        toast({ title: 'Error', description: json.error || 'Failed to delete account', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-sky-500/20 flex items-center justify-center text-2xl font-bold text-sky-400">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US') : 'now'}
              </p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background"
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
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-background"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background"
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleChangePassword}
            disabled={changingPassword}
            className="gap-2"
          >
            {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'email' as const, label: 'Email Notifications', desc: 'Receive important notifications via email' },
            { key: 'workspace' as const, label: 'Workspace Notifications', desc: 'Alerts about workspace status changes' },
            { key: 'billing' as const, label: 'Billing Notifications', desc: 'Payment and subscription alerts' },
            { key: 'marketing' as const, label: 'Promotions & Updates', desc: 'Platform news and special offers' },
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
                onCheckedChange={(checked) => {
                  const updated = { ...notifications, [item.key]: checked }
                  setNotifications(updated)
                  // Auto-save notification changes
                  fetch('/api/user/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(updated),
                  }).catch(() => {})
                }}
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
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm">Delete Account</p>
              <p className="text-xs text-muted-foreground">
                Your account and all data will be permanently deleted
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your workspaces, data, and account information will be permanently deleted.
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Yes, Delete My Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
