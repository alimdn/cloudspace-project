'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError] Unhandled error:', error)
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              An unexpected error occurred. This has been logged and our team has been notified.
              Please try again or contact support if the problem persists.
            </p>
          </div>
          {error.message && (
            <div className="rounded-lg bg-muted/50 p-3 text-left">
              <p className="text-xs text-muted-foreground font-mono break-words">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              className="bg-sky-500 hover:bg-sky-600 text-white"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/')}
            >
              Go Home
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
