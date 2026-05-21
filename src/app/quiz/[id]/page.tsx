'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Question = { question: string; options: string[]; correct: string; explanation: string }
type Quiz = { questions: Question[] }

export default function QuizPage() {
  const { id } = useParams()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    supabase.from('sessions').select('quiz').eq('id', id).single()
      .then(({ data }) => {
        if (data) setQuiz(data.quiz as Quiz)
        setLoading(false)
      })
  }, [id])

  function select(qi: number, letter: string) {
    if (submitted) return
    setAnswers(p => ({ ...p, [qi]: letter }))
  }

  function submit() {
    if (!quiz) return
    let correct = 0
    quiz.questions.forEach((q, i) => { if (answers[i] === q.correct) correct++ })
    setScore(correct)
    setSubmitted(true)
  }

  function reset() {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
  }

  if (loading) return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-28">
        {[1,2,3].map(i => <div key={i} className="h-36 rounded-card mb-4 animate-pulse" style={{ background: 'var(--surface)' }} />)}
      </div>
    </div>
  )

  if (!quiz) return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-28 text-center">
        <p style={{ color: 'var(--text-muted)' }}>Quiz not found.</p>
      </div>
    </div>
  )

  const total = quiz.questions.length
  const pct = submitted ? Math.round((score / total) * 100) : 0

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-24 pb-16">

        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--accent)' }}>PEAK AI Quiz</p>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Test your knowledge</h1>
        </div>

        {/* Score banner */}
        {submitted && (
          <div className="mb-8 p-5 rounded-card border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-4xl font-bold mb-1" style={{ color: pct >= 70 ? '#22c55e' : pct >= 50 ? 'var(--accent)' : '#ef4444' }}>{pct}%</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{score} out of {total} correct</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {pct >= 80 ? '🎉 Excellent work!' : pct >= 60 ? 'Good effort — review the missed ones below.' : 'Keep studying — you\'ve got this.'}
            </p>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-5 mb-8">
          {quiz.questions.map((q, qi) => {
            const userAns = answers[qi]
            const isCorrect = userAns === q.correct
            return (
              <div key={qi} className="p-5 rounded-card border" style={{ background: 'var(--surface)', borderColor: submitted ? (isCorrect ? 'rgba(34,197,94,0.3)' : userAns ? 'rgba(239,68,68,0.3)' : 'var(--border)') : 'var(--border)' }}>
                <p className="font-medium mb-4 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  <span className="text-xs font-bold mr-2" style={{ color: 'var(--text-muted)' }}>Q{qi + 1}.</span>
                  {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const letter = ['A','B','C','D'][oi]
                    const isSelected = userAns === letter
                    const isCorrectOpt = q.correct === letter
                    let bg = 'transparent'
                    let border = 'var(--border)'
                    let color = 'var(--text-primary)'
                    if (submitted) {
                      if (isCorrectOpt) { bg = 'rgba(34,197,94,0.1)'; border = 'rgba(34,197,94,0.4)'; color = '#22c55e' }
                      else if (isSelected && !isCorrectOpt) { bg = 'rgba(239,68,68,0.1)'; border = 'rgba(239,68,68,0.4)'; color = '#ef4444' }
                    } else if (isSelected) {
                      bg = 'rgba(79,110,247,0.1)'; border = 'var(--accent)'; color = 'var(--accent)'
                    }
                    return (
                      <button key={oi} onClick={() => select(qi, letter)}
                        className="w-full text-left px-4 py-2.5 rounded-btn border text-sm transition-all"
                        style={{ background: bg, borderColor: border, color }}>
                        <span className="font-semibold mr-2">{letter}.</span>
                        {opt.replace(/^[A-D]\. /, '')}
                      </button>
                    )
                  })}
                </div>
                {submitted && (
                  <div className="mt-3 flex items-start gap-2">
                    {isCorrect ? <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} /> : <XCircle size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />}
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{q.explanation}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {!submitted ? (
            <button
              onClick={submit}
              disabled={Object.keys(answers).length < total}
              className="flex-1 py-3 rounded-btn font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: 'var(--accent)' }}
            >
              Submit quiz
            </button>
          ) : (
            <>
              <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 rounded-btn border font-medium text-sm transition-all hover:opacity-70" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <RotateCcw size={14} /> Try again
              </button>
              <Link href={`/notes/${id}`} className="flex items-center gap-2 px-5 py-2.5 rounded-btn font-medium text-sm transition-all hover:opacity-70" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                <FileText size={14} /> Review notes
              </Link>
              <Link href="/upload" className="flex items-center gap-2 px-5 py-2.5 rounded-btn font-semibold text-sm text-white transition-all hover:opacity-90" style={{ background: 'var(--accent)' }}>
                New session <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
