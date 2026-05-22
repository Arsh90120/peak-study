'use client'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { PeakChat } from '@/components/PeakChat'
import { FileText, Clock, ArrowRight, Zap, Trash2 } from 'lucide-react'

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
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => { setSessions(d.sessions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
      if (res.ok) setSessions(prev => prev.filter(s => s.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-16">

        <PeakChat />

        <div className="mt-16">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--muted-foreground)' }}>Recent sessions</p>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: 'var(--card)' }} />)}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16 rounded-xl border" style={{ borderColor: 'var(--border)', borderStyle: 'dashed' }}>
              <Zap size={28} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
              <p className="font-medium mb-1" style={{ color: 'var(--foreground)' }}>No sessions yet</p>
              <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>Pick one of the options above to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => (
                <div
                  key={s.id}
                  className="group p-4 rounded-xl border flex items-center justify-between transition-all"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(100,74,64,0.1)', color: 'var(--primary)' }}>
                      <FileText size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: 'var(--foreground)' }}>{s.title}</p>
                      <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                        <Clock size={11} /> {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {s.notes && (
                      <Link href={`/notes/${s.id}`} className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors hover:bg-muted" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>Notes</Link>
                    )}
                    {s.quiz && (
                      <Link href={`/quiz/${s.id}`} className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors hover:bg-muted" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>Quiz</Link>
                    )}
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 disabled:opacity-50"
                      style={{ color: 'var(--muted-foreground)' }}
                      title="Delete session"
                    >
                      <Trash2 size={14} />
                    </button>
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
