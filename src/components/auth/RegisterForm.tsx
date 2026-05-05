'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Cloud, Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function RegisterForm() {
  const { setAuthenticated, setView } = useAppStore()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const passwordStrength = (() => {
    if (!password) return 0
    let s = 0
    if (password.length >= 6) s++
    if (password.length >= 8) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return Math.min(s, 4)
  })()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password || !confirmPassword) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' })
      return
    }
    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' })
      return
    }
    if (password.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' })
      return
    }
    if (!/[A-Z]/.test(password)) {
      toast({ title: 'Error', description: 'Password must contain at least one uppercase letter', variant: 'destructive' })
      return
    }
    if (!/[0-9]/.test(password)) {
      toast({ title: 'Error', description: 'Password must contain at least one number', variant: 'destructive' })
      return
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      toast({ title: 'Error', description: 'Password must contain at least one special character', variant: 'destructive' })
      return
    }
    if (name.length < 2) {
      toast({ title: 'Error', description: 'Name must be at least 2 characters', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        // Backend sets httpOnly cookie, we just update client state
        const userData = data.data?.user || data.data
        setAuthenticated(true, userData)
        toast({ title: 'Welcome!', description: 'Your account has been created successfully' })
      } else {
        toast({ title: 'Error', description: data.error || 'Account creation failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Connection error occurred', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-background px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.1)_0%,_transparent_50%)]" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20">
              <Cloud className="h-6 w-6 text-sky-400" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
              CloudSpace
            </span>
          </div>
        </div>

        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Join thousands of users on CloudSpace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((l) => (
                        <div
                          key={l}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            passwordStrength >= l
                              ? l <= 1 ? 'bg-red-500' : l <= 2 ? 'bg-amber-500' : l <= 3 ? 'bg-sky-500' : 'bg-emerald-500'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {passwordStrength <= 1 ? 'Weak' : passwordStrength <= 2 ? 'Fair' : passwordStrength <= 3 ? 'Strong' : 'Very Strong'}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-background"
                />
                {confirmPassword && password === confirmPassword && (
                  <p className="text-xs text-emerald-500 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Match
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full bg-sky-500 hover:bg-sky-600" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={() => setView('login')}
                  className="text-sky-400 hover:text-sky-300 font-medium"
                >
                  Sign In
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
