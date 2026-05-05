'use client'

import { useAppStore } from '@/store/useAppStore'
import { Cloud, Mail, Github } from 'lucide-react'

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
              <span className="text-lg font-bold bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                CloudSpace
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Cloud platform for renting isolated workspaces with dedicated resources.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">Product</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setView(isAuthenticated ? 'pricing' : 'landing')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pricing
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
                  How It Works
                </button>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Documentation</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Service Status</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">Company</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">About Us</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Blog</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Careers</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Contact Us</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">Legal</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">Terms of Service</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Privacy Policy</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Refund Policy</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} CloudSpace. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
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
