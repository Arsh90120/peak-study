'use client'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Plus, FileText, CheckSquare, Clock, ArrowRight, Zap } from 'lucide-react'

type Session = {
  id: string
  title: string
  input_type: string
  created_at: string
  notes: object | null
  quiz: object | null
}

export default function DashboardPage() {
  const { user } = useUser()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => { setSessions(d.sessions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const firstName = user?.firstName || 'there'

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-16">

        {/* Header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Welcome back</p>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Hey, {firstName} 👋</h1>
          </div>
          <Link href="/upload" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn font-semibold text-sm text-white transition-all hover:opacity-90" style={{ background: 'var(--accent)' }}>
            <Plus size={16} /> New session
          </Link>
        </div>

        {/* Quick Start */}
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--text-muted)' }}>Quick start</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <FileText size={18} />, label: 'Upload a PDF', href: '/upload?type=pdf', desc: 'Parse and study any document' },
              { icon: <Zap size={18} />, label: 'Enter a topic', href: '/upload?type=topic', desc: 'AI builds everything from scratch' },
              { icon: <CheckSquare size={18} />, label: 'Paste text', href: '/upload?type=text', desc: 'Drop in your notes or reading' },
            ].map(item => (
              <Link key={item.label} href={item.href} className="p-5 rounded-card border flex items-start gap-3 transition-all hover:-translate-y-0.5 hover:shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="mt-0.5 w-8 h-8 rounded-btn flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(79,110,247,0.1)', color: 'var(--accent)' }}>
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Sessions */}
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--text-muted)' }}>Recent sessions</p>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 rounded-card animate-pulse" style={{ background: 'var(--surface)' }} />)}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16 rounded-card border" style={{ borderColor: 'var(--border)', borderStyle: 'dashed' }}>
              <Zap size={28} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No sessions yet</p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Drop a PDF and let&apos;s get to work</p>
              <Link href="/upload" className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--accent)' }}>
                Start your first session <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => (
                <div key={s.id} className="p-4 rounded-card border flex items-center justify-between" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-btn flex items-center justify-center" style={{ background: 'rgba(79,110,247,0.1)', color: 'var(--accent)' }}>
                      <FileText size={15} />
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{s.title}</p>
                      <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        <Clock size={11} /> {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.notes && <Link href={`/notes/${s.id}`} className="text-xs px-3 py-1.5 rounded-btn border font-medium transition-colors hover:opacity-70" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Notes</Link>}
                    {s.quiz && <Link href={`/quiz/${s.id}`} className="text-xs px-3 py-1.5 rounded-btn border font-medium transition-colors hover:opacity-70" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Quiz</Link>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
