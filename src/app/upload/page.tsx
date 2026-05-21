'use client'
import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Upload, FileText, Type, Lightbulb, ArrowRight, Loader2, X } from 'lucide-react'

type InputType = 'pdf' | 'text' | 'topic'

export default function UploadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [inputType, setInputType] = useState<InputType>((searchParams.get('type') as InputType) || 'pdf')
  const [topic, setTopic] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

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

      // Generate notes and quiz in parallel
      const [notesRes, quizRes] = await Promise.all([
        fetch('/api/generate/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, title }) }),
        fetch('/api/generate/quiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) }),
      ])

      const [notesData, quizData] = await Promise.all([notesRes.json(), quizRes.json()])
      if (!notesRes.ok) throw new Error(notesData.error || 'Notes generation failed')
      if (!quizRes.ok) throw new Error(quizData.error || 'Quiz generation failed')

      // Save session
      const sessionRes = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, input_type: inputType, notes: notesData.notes, quiz: quizData.quiz, raw_content: content.slice(0, 5000) }),
      })
      const sessionData = await sessionRes.json()
      if (!sessionRes.ok) throw new Error(sessionData.error || 'Session save failed')

      router.push(`/notes/${sessionData.session.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-28 pb-16">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>New study session</h1>
        <p className="mb-8" style={{ color: 'var(--text-muted)' }}>PEAK AI will generate notes and a quiz for you in seconds.</p>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-card mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setInputType(t.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-btn transition-all"
              style={inputType === t.id ? { background: 'var(--accent)', color: '#fff' } : { color: 'var(--text-muted)' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="mb-6">
          {inputType === 'pdf' && (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-card p-10 text-center cursor-pointer transition-all hover:opacity-70"
              style={{ borderColor: 'var(--border)' }}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText size={20} style={{ color: 'var(--accent)' }} />
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{file.name}</span>
                  <button onClick={e => { e.stopPropagation(); setFile(null) }} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
                </div>
              ) : (
                <>
                  <Upload size={28} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Drop your PDF here</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>or click to browse</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
          )}

          {inputType === 'topic' && (
            <input
              type="text" value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Mitosis and meiosis, The French Revolution, Newton's laws..."
              className="w-full px-4 py-3 rounded-card border text-base outline-none transition-all focus:ring-2"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          )}

          {inputType === 'text' && (
            <textarea
              value={text} onChange={e => setText(e.target.value)}
              placeholder="Paste your notes, textbook excerpt, or any study material here..."
              rows={10}
              className="w-full px-4 py-3 rounded-card border text-base outline-none transition-all focus:ring-2 resize-none"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          )}
        </div>

        {error && <p className="text-sm mb-4 px-4 py-3 rounded-btn" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{error}</p>}

        <button
          onClick={handleSubmit} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-btn font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--accent)' }}
        >
          {loading ? <><Loader2 size={17} className="animate-spin" /> Generating with PEAK AI...</> : <>Generate study materials <ArrowRight size={16} /></>}
        </button>
      </div>
    </div>
  )
}
