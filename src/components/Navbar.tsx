'use client'
import Link from 'next/link'
import { useTheme } from './ThemeProvider'
import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs'
import { Sun, Moon, Zap } from 'lucide-react'

export default function Navbar() {
  const { theme, toggle } = useTheme()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
          <Zap size={18} style={{ color: 'var(--accent)' }} fill="currentColor" />
          PEAK
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="p-2 rounded-btn transition-colors hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <SignedOut>
            <Link href="/sign-in" className="text-sm font-medium px-4 py-1.5 rounded-btn transition-colors" style={{ color: 'var(--text-muted)' }}>
              Sign in
            </Link>
            <Link href="/sign-up" className="text-sm font-semibold px-4 py-1.5 rounded-btn transition-colors text-white" style={{ background: 'var(--accent)' }}>
              Get started
            </Link>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard" className="text-sm font-medium px-4 py-1.5 rounded-btn transition-colors" style={{ color: 'var(--text-muted)' }}>
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </nav>
  )
}
