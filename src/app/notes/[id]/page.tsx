'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { CheckSquare, ArrowRight, BookOpen, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type KeyTerm = { term: string; definition: string }
type Section = { heading: string; points: string[]; keyTerms: KeyTerm[] }
type Notes = { title: string; summary: string; sections: Section[]; keyTakeaways: string[] }

export default function NotesPage() {
  const { id } = useParams()
  const [notes, setNotes] = useState<Notes | null>(null)
  const [sessionTitle, setSessionTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({})

  useEffect(() => {
    supabase.from('sessions').select('title, notes').eq('id', id).single()
      .then(({ data }) => {
        if (data) { setNotes(data.notes as Notes); setSessionTitle(data.title) }
        setLoading(false)
      })
  }, [id])

  const toggle = (i: number) => setOpenSections(p => ({ ...p, [i]: !p[i] }))

  if (loading) return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-28">
        {[1,2,3].map(i => <div key={i} className="h-32 rounded-xl mb-4 animate-pulse" style={{ background: 'var(--card)' }} />)}
      </div>
    </div>
  )

  if (!notes) return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-28 text-center">
        <p style={{ color: 'var(--muted-foreground)' }}>Session not found.</p>
        <Link href="/dashboard" className="text-sm mt-4 inline-block" style={{ color: 'var(--primary)' }}>← Back to dashboard</Link>
      </div>
    </div>
  )

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-24 pb-16">

        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--primary)' }}>PEAK AI Notes</p>
          <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>{notes.title || sessionTitle}</h1>
          <p className="text-base leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{notes.summary}</p>
        </div>

        <div className="h-px mb-8" style={{ background: 'var(--border)' }} />

        {notes.keyTakeaways?.length > 0 && (
          <div className="mb-8 p-5 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} style={{ color: 'var(--primary)' }} />
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--muted-foreground)' }}>Key Takeaways</p>
            </div>
            <ul className="space-y-2">
              {notes.keyTakeaways.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--primary)' }} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-3 mb-10">
          {notes.sections?.map((s, i) => (
            <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted"
                style={{ background: 'var(--card)' }}
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={15} style={{ color: 'var(--primary)' }} />
                  <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{s.heading}</span>
                </div>
                {openSections[i]
                  ? <ChevronUp size={16} style={{ color: 'var(--muted-foreground)' }} />
                  : <ChevronDown size={16} style={{ color: 'var(--muted-foreground)' }} />}
              </button>

              {openSections[i] && (
                <div className="px-5 pb-5" style={{ background: 'var(--card)' }}>
                  <div className="h-px mb-4" style={{ background: 'var(--border)' }} />
                  <ul className="space-y-2 mb-4">
                    {s.points?.map((p, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
                        <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--primary)' }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                  {s.keyTerms?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--muted-foreground)' }}>Key Terms</p>
                      <div className="space-y-1.5">
                        {s.keyTerms.map((kt, k) => (
                          <div key={k} className="text-sm">
                            <span className="font-medium" style={{ color: 'var(--primary)' }}>{kt.term}</span>
                            <span style={{ color: 'var(--muted-foreground)' }}> — {kt.definition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-6 rounded-xl border flex items-center justify-between" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div>
            <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Ready to test yourself?</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>PEAK AI built a quiz based on these notes</p>
          </div>
          <Link
            href={`/quiz/${id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <CheckSquare size={15} /> Take quiz <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
