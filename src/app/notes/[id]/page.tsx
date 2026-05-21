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
        {[1,2,3].map(i => <div key={i} className="h-32 rounded-card mb-4 animate-pulse" style={{ background: 'var(--surface)' }} />)}
      </div>
    </div>
  )

  if (!notes) return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-28 text-center">
        <p style={{ color: 'var(--text-muted)' }}>Session not found.</p>
      </div>
    </div>
  )

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-24 pb-16">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--accent)' }}>PEAK AI Notes</p>
          <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{notes.title || sessionTitle}</h1>
          <p className="text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>{notes.summary}</p>
        </div>

        <div className="h-px mb-8" style={{ background: 'var(--border)' }} />

        {/* Key Takeaways */}
        {notes.keyTakeaways?.length > 0 && (
          <div className="mb-8 p-5 rounded-card border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} style={{ color: 'var(--accent)' }} />
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Key Takeaways</p>
            </div>
            <ul className="space-y-2">
              {notes.keyTakeaways.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-3 mb-10">
          {notes.sections?.map((s, i) => (
            <div key={i} className="rounded-card border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
                style={{ background: 'var(--surface)' }}
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={15} style={{ color: 'var(--accent)' }} />
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{s.heading}</span>
                </div>
                {openSections[i] ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
              </button>

              {openSections[i] && (
                <div className="px-5 pb-5" style={{ background: 'var(--surface)' }}>
                  <div className="h-px mb-4" style={{ background: 'var(--border)' }} />
                  <ul className="space-y-2 mb-4">
                    {s.points?.map((p, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                  {s.keyTerms?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Key Terms</p>
                      <div className="space-y-1.5">
                        {s.keyTerms.map((kt, k) => (
                          <div key={k} className="text-sm">
                            <span className="font-medium" style={{ color: 'var(--accent)' }}>{kt.term}</span>
                            <span style={{ color: 'var(--text-muted)' }}> — {kt.definition}</span>
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

        {/* Quiz CTA */}
        <div className="p-6 rounded-card border flex items-center justify-between" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Ready to test yourself?</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>PEAK AI built a quiz based on these notes</p>
          </div>
          <Link href={`/quiz/${id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-btn font-semibold text-sm text-white" style={{ background: 'var(--accent)' }}>
            <CheckSquare size={15} /> Take quiz <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
