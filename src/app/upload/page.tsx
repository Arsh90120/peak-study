'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Upload, FileText, Type, Lightbulb, ArrowRight, Loader2, X, CheckCircle2, Sparkles } from 'lucide-react'

type InputType = 'pdf' | 'text' | 'topic'

const LOADING_STEPS = [
  { label: 'Reading your material...', duration: 2500 },
  { label: 'Analyzing key concepts...', duration: 3500 },
  { label: 'Building your notes...', duration: 4000 },
  { label: 'Generating quiz questions...', duration: 3500 },
  { label: 'Almost done...', duration: 99999 },
]

function LoadingScreen() {
  const [stepIndex, setStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  useEffect(() => {
    let current = 0
    const advance = () => {
      if (current < LOADING_STEPS.length - 1) {
        const timeout = setTimeout(() => {
          setCompletedSteps(prev => [...prev, current])
          current += 1
          setStepIndex(current)
          advance()
        }, LOADING_STEPS[current].duration)
        return timeout
      }
    }
    const t = advance()
    return () => { if (t) clearTimeout(t) }
  }, [])

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-md mx-auto px-6 pt-40 pb-16 flex flex-col items-center text-center">
        <div className="relative mb-8">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(100,74,64,0.1)' }}
          >
            <Sparkles size={36} style={{ color: 'var(--primary)' }} className="animate-pulse" />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>PEAK AI is working...</h2>
        <p className="text-sm mb-10" style={{ color: 'var(--muted-foreground)' }}>Hang tight, this usually takes 15–30 seconds</p>

        <div className="w-full space-y-3">
          {LOADING_STEPS.slice(0, -1).map((step, i) => {
            const isDone = completedSteps.includes(i)
            const isActive = stepIndex === i
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={{
                  background: isActive ? 'rgba(100,74,64,0.08)' : 'transparent',
                  opacity: i > stepIndex ? 0.3 : 1,
                }}
              >
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  {isDone
                    ? <CheckCircle2 size={18} style={{ color: '#22c55e' }} />
                    : isActive
                      ? <Loader2 size={18} className="animate-spin" style={{ color: 'var(--primary)' }} />
                      : <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: 'var(--border)' }} />
                  }
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: isDone ? 'var(--muted-foreground)' : isActive ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function UploadForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [inputType, setInputType] = useState<InputType>((searchParams.get('type') as InputType) || 'pdf')
  const [topic, setTopic] = useState(searchParams.get('q') || '')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const q = searchParams.get('q')
    if (q && searchParams.get('type') === 'topic') setTopic(q)
  }, [])

  const tabs: { id: InputType; label: string; icon: React.ReactNode }[] = [
    { id: 'pdf', label: 'Upload PDF', icon: <Upload size={15} /> },
    { id: 'topic', label: 'Enter topic', icon: <Lightbulb size={15} /> },
    { id: 'text', label: 'Paste text', icon: <Type size={15} /> },
  ]

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      let content = ''
      let title = ''

      if (inputType === 'topic') {
        if (!topic.trim()) { setError('Please enter a topic'); setLoading(false); return }
        content = `Topic: ${topic}\n\nGenerate comprehensive study material about this topic.`
        title = topic
      } else if (inputType === 'text') {
        if (!text.trim()) { setError('Please paste some text'); setLoading(false); return }
        content = text
        title = text.slice(0, 60) + (text.length > 60 ? '...' : '')
      } else {
        if (!file) { setError('Please select a PDF file'); setLoading(false); return }
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/parse-pdf', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'PDF parse failed')
        content = data.text
        title = file.name.replace('.pdf', '')
      }

      const [notesRes, quizRes] = await Promise.all([
        fetch('/api/generate/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, title }) }),
        fetch('/api/generate/quiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) }),
      ])

      const [notesData, quizData] = await Promise.all([notesRes.json(), quizRes.json()])
      if (!notesRes.ok) throw new Error(notesData.error || 'Notes generation failed')
      if (!quizRes.ok) throw new Error(quizData.error || 'Quiz generation failed')

      const sessionRes = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, input_type: inputType, notes: notesData.notes, quiz: quizData.quiz, raw_content: content.slice(0, 5000) }),
      })
      const sessionData = await sessionRes.json()
      if (!sessionRes.ok) throw new Error(sessionData.error || 'Session save failed')

      router.push(`/notes/${sessionData.session.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (loading) return <LoadingScreen />

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-28 pb-16">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>New study session</h1>
        <p className="mb-8" style={{ color: 'var(--muted-foreground)' }}>PEAK AI will generate notes and a quiz for you in seconds.</p>

        <div className="flex gap-1 p-1 rounded-xl mb-6 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setInputType(t.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all"
              style={inputType === t.id
                ? { background: 'var(--primary)', color: 'var(--primary-foreground)' }
                : { color: 'var(--muted-foreground)' }
              }>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="mb-6">
          {inputType === 'pdf' && (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all hover:opacity-70"
              style={{ borderColor: 'var(--border)' }}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText size={20} style={{ color: 'var(--primary)' }} />
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>{file.name}</span>
                  <button onClick={e => { e.stopPropagation(); setFile(null) }} style={{ color: 'var(--muted-foreground)' }}><X size={16} /></button>
                </div>
              ) : (
                <>
                  <Upload size={28} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
                  <p className="font-medium mb-1" style={{ color: 'var(--foreground)' }}>Drop your PDF here</p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>or click to browse</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
          )}

          {inputType === 'topic' && (
            <input
              type="text" value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Mitosis and meiosis, The French Revolution, Newton's laws..."
              className="w-full px-4 py-3 rounded-xl border text-base outline-none transition-all"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          )}

          {inputType === 'text' && (
            <textarea
              value={text} onChange={e => setText(e.target.value)}
              placeholder="Paste your notes, textbook excerpt, or any study material here..."
              rows={10}
              className="w-full px-4 py-3 rounded-xl border text-base outline-none resize-none"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(229,77,46,0.1)', color: 'var(--destructive)' }}>
            <X size={15} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          Generate study materials <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div style={{ background: 'var(--background)', minHeight: '100vh' }} />}>
      <UploadForm />
    </Suspense>
  )
}
