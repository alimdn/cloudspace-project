'use client'

import { useAppStore } from '@/store/useAppStore'
import { Cloud, Mail, Github, Twitter } from 'lucide-react'

export function Footer() {
  const { setView, isAuthenticated } = useAppStore()

  return (
    <footer className="border-t border-border bg-card/50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
                <Cloud className="h-5 w-5 text-sky-400" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-l from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                كلاود سبيس
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              منصة سحابية لتأجير مساحات عمل معزولة مع موارد مخصصة.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">المنتج</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setView(isAuthenticated ? 'pricing' : 'landing')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  الأسعار
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const el = document.getElementById('how-it-works')
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  كيف يعمل
                </button>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">الوثائق</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">حالة الخدمة</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">الشركة</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">من نحن</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">المدونة</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">الوظائف</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">تواصل معنا</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">قانوني</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">شروط الاستخدام</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">سياسة الخصوصية</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">سياسة الاسترداد</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 كلاود سبيس. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github className="h-4 w-4" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
