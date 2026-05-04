import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-sky-500/10 flex items-center justify-center mx-auto">
          <FileQuestion className="h-8 w-8 text-sky-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-muted-foreground/20">404</h1>
          <h2 className="text-2xl font-bold">Page Not Found</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The page you are looking for doesn&apos;t exist or has been moved.
            Check the URL or head back to the homepage.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-sky-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-sky-600 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
