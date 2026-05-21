'use client'

import { Zap, Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import ThemeToggle from '@/components/ThemeToggle'

export default function Navbar() {
  const pathname = usePathname()
  const isLanding = pathname === '/'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md" style={{ borderColor: 'var(--border)' }}>
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Zap size={18} fill="currentColor" style={{ color: 'var(--accent-brand)' }} />
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>PEAK</span>
        </Link>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <SignedOut>
            <Button asChild variant="outline" size="sm">
              <Link href="/sign-in">Log in</Link>
            </Button>
            <Button asChild size="sm" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            {!isLanding && (
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            )}
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>
                  <Link href="/" className="flex items-center gap-2">
                    <Zap size={16} fill="currentColor" style={{ color: 'var(--accent-brand)' }} />
                    <span className="font-bold">PEAK</span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-4">
                <SignedOut>
                  <Button asChild variant="outline">
                    <Link href="/sign-in">Log in</Link>
                  </Button>
                  <Button asChild style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                    <Link href="/sign-up">Sign up</Link>
                  </Button>
                </SignedOut>
                <SignedIn>
                  <Button asChild variant="outline">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <div className="pt-2">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </SignedIn>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
