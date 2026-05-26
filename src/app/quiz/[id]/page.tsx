'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, FileText, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'short_answer'
type MatchPair = { term: string; definition: string }
type Question = {
  type: QuestionType
  question: string
  options?: string[]
  correct?: string
  pairs?: MatchPair[]
  sampleAnswer?: string
  explanation: string
}
type Quiz = { questions: Question[] }
type MatchingAnswers = Record<string, string>

const TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  fill_blank: 'Fill in the Blank',
  matching: 'Matching',
  short_answer: 'Short Answer',
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function QuizPage() {
  const { id } = useParams()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [rawContent, setRawContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [matchingAnswers, setMatchingAnswers] = useState<Record<number, MatchingAnswers>>({})
  const [fillAnswers, setFillAnswers] = useState<Record<number, string>>({})
  const [shortAnswers, setShortAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [questionHistory, setQuestionHistory] = useState<string[]>([])
  // Store shuffled definitions per matching question so they don't re-shuffle on re-render
  const [shuffledDefs, setShuffledDefs] = useState<Record<number, string[]>>({})

  useEffect(() => {
    supabase.from('sessions').select('quiz, raw_content').eq('id', id).single()
      .then(({ data }) => {
        if (data) {
          const q = data.quiz as Quiz
          setQuiz(q)
          setRawContent((data as Record<string, unknown>).raw_content as string || '')
          // Pre-shuffle definitions for matching questions
          const defs: Record<number, string[]> = {}
          q?.questions?.forEach((question, qi) => {
            if (question.type === 'matching' && question.pairs) {
              defs[qi] = shuffleArray(question.pairs.map(p => p.definition))
            }
          })
          setShuffledDefs(defs)
        }
        setLoading(false)
      })
  }, [id])

  const regenerateQuiz = useCallback(async () => {
    if (!rawContent) return
    setRegenerating(true)
    try {
      const res = await fetch('/api/generate/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: rawContent, count: 8, previousQuestions: questionHistory }),
      })
      const data = await res.json()
      if (data.quiz) {
        const q = data.quiz as Quiz
        setQuiz(q)
        setQuestionHistory(prev => [...prev, ...q.questions.map((qu: Question) => qu.question)])
        // Pre-shuffle new matching questions
        const defs: Record<number, string[]> = {}
        q.questions.forEach((question, qi) => {
          if (question.type === 'matching' && question.pairs) {
            defs[qi] = shuffleArray(question.pairs.map(p => p.definition))
          }
        })
        setShuffledDefs(defs)
        setAnswers({})
        setMatchingAnswers({})
        setFillAnswers({})
        setShortAnswers({})
        setSubmitted(false)
        setScore(0)
      }
    } catch (e) {
      console.error('Regeneration failed:', e)
    } finally {
      setRegenerating(false)
    }
  }, [rawContent, questionHistory])

  function selectOption(qi: number, letter: string) {
    if (submitted) return
    setAnswers(p => ({ ...p, [qi]: letter }))
  }

  function setMatchAnswer(qi: number, term: string, definition: string) {
    if (submitted) return
    setMatchingAnswers(p => ({ ...p, [qi]: { ...(p[qi] || {}), [term]: definition } }))
  }

  function isQuestionAnswered(q: Question, qi: number): boolean {
    switch (q.type) {
      case 'multiple_choice':
      case 'true_false': return !!answers[qi]
      case 'fill_blank': return !!(fillAnswers[qi]?.trim())
      case 'matching': return Object.keys(matchingAnswers[qi] || {}).length === (q.pairs?.length || 0)
      case 'short_answer': return !!(shortAnswers[qi]?.trim())
      default: return false
    }
  }

  function submit() {
    if (!quiz) return
    let correct = 0
    quiz.questions.forEach((q, qi) => {
      switch (q.type) {
        case 'multiple_choice':
        case 'true_false':
          if (answers[qi] === q.correct) correct++; break
        case 'fill_blank': {
          const ua = (fillAnswers[qi] || '').trim().toLowerCase()
          const ca = (q.correct || '').trim().toLowerCase()
          if (ua === ca) correct++; break
        }
        case 'matching': {
          const um = matchingAnswers[qi] || {}
          if (q.pairs?.every(p => um[p.term] === p.definition)) correct++; break
        }
        case 'short_answer':
          if (shortAnswers[qi]?.trim()) correct++; break
      }
    })
    setScore(correct)
    setSubmitted(true)
  }

  function reset() {
    setAnswers({})
    setMatchingAnswers({})
    setFillAnswers({})
    setShortAnswers({})
    setSubmitted(false)
    setScore(0)
  }

  if (loading) return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-28">
        {[1,2,3].map(i => <div key={i} className="h-36 rounded-xl mb-4 animate-pulse" style={{ background: 'var(--card)' }} />)}
      </div>
    </div>
  )

  if (!quiz) return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-28 text-center">
        <p style={{ color: 'var(--muted-foreground)' }}>Quiz not found.</p>
        <Link href="/dashboard" className="text-sm mt-4 inline-block" style={{ color: 'var(--primary)' }}>← Back to dashboard</Link>
      </div>
    </div>
  )

  const total = quiz.questions.length
  const allAnswered = quiz.questions.every((q, qi) => isQuestionAnswered(q, qi))
  const pct = submitted ? Math.round((score / total) * 100) : 0

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--primary)' }}>PEAK AI Quiz</p>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Test your knowledge</h1>
        </div>

        {submitted && (
          <div className="mb-8 p-5 rounded-xl border text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="text-4xl font-bold mb-1" style={{ color: pct >= 70 ? '#22c55e' : pct >= 50 ? 'var(--primary)' : 'var(--destructive)' }}>{pct}%</p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{score} of {total} correct</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Short answer questions are self-graded.</p>
            <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
              {pct >= 80 ? '🎉 Excellent work!' : pct >= 60 ? 'Good effort — review the missed ones below.' : "Keep studying — you've got this."}
            </p>
          </div>
        )}

        <div className="space-y-5 mb-8">
          {quiz.questions.map((q, qi) => {
            const qType = q.type || 'multiple_choice'

            const getCardBorder = () => {
              if (!submitted) return 'var(--border)'
              if (qType === 'short_answer') return 'var(--border)'
              if (qType === 'fill_blank') {
                return (fillAnswers[qi] || '').trim().toLowerCase() === (q.correct || '').trim().toLowerCase()
                  ? 'rgba(34,197,94,0.4)' : 'rgba(229,77,46,0.4)'
              }
              if (qType === 'matching') {
                return q.pairs?.every(p => (matchingAnswers[qi] || {})[p.term] === p.definition)
                  ? 'rgba(34,197,94,0.4)' : 'rgba(229,77,46,0.4)'
              }
              return answers[qi] === q.correct ? 'rgba(34,197,94,0.4)'
                : answers[qi] ? 'rgba(229,77,46,0.4)' : 'var(--border)'
            }

            return (
              <div key={qi} className="p-5 rounded-xl border" style={{ background: 'var(--card)', borderColor: getCardBorder() }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(100,74,64,0.1)', color: 'var(--primary)' }}>
                    {TYPE_LABELS[qType as QuestionType] || qType}
                  </span>
                  <span className="text-xs font-bold" style={{ color: 'var(--muted-foreground)' }}>Q{qi + 1}</span>
                </div>

                <p className="font-medium mb-4 leading-relaxed" style={{ color: 'var(--foreground)' }}>{q.question}</p>

                {/* MULTIPLE CHOICE */}
                {qType === 'multiple_choice' && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const letter = ['A','B','C','D'][oi]
                      const isSelected = answers[qi] === letter
                      const isCorrectOpt = q.correct === letter
                      let bg = 'transparent', borderC = 'var(--border)', color = 'var(--foreground)'
                      if (submitted) {
                        if (isCorrectOpt) { bg = 'rgba(34,197,94,0.1)'; borderC = 'rgba(34,197,94,0.4)'; color = '#22c55e' }
                        else if (isSelected) { bg = 'rgba(229,77,46,0.1)'; borderC = 'rgba(229,77,46,0.4)'; color = 'var(--destructive)' }
                      } else if (isSelected) {
                        bg = 'rgba(100,74,64,0.1)'; borderC = 'var(--primary)'; color = 'var(--primary)'
                      }
                      return (
                        <button key={oi} onClick={() => selectOption(qi, letter)}
                          className="w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all hover:opacity-80"
                          style={{ background: bg, borderColor: borderC, color }}>
                          <span className="font-semibold mr-2">{letter}.</span>
                          {opt.replace(/^[A-D]\. /, '')}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* TRUE / FALSE */}
                {qType === 'true_false' && (
                  <div className="flex gap-3">
                    {['True','False'].map(val => {
                      const isSelected = answers[qi] === val
                      const isCorrectOpt = q.correct === val
                      let bg = 'transparent', borderC = 'var(--border)', color = 'var(--foreground)'
                      if (submitted) {
                        if (isCorrectOpt) { bg = 'rgba(34,197,94,0.1)'; borderC = 'rgba(34,197,94,0.4)'; color = '#22c55e' }
                        else if (isSelected) { bg = 'rgba(229,77,46,0.1)'; borderC = 'rgba(229,77,46,0.4)'; color = 'var(--destructive)' }
                      } else if (isSelected) {
                        bg = 'rgba(100,74,64,0.1)'; borderC = 'var(--primary)'; color = 'var(--primary)'
                      }
                      return (
                        <button key={val} onClick={() => selectOption(qi, val)}
                          className="flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all hover:opacity-80"
                          style={{ background: bg, borderColor: borderC, color }}>
                          {val}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* FILL IN THE BLANK */}
                {qType === 'fill_blank' && (
                  <div>
                    <input
                      type="text"
                      value={fillAnswers[qi] || ''}
                      onChange={e => !submitted && setFillAnswers(p => ({ ...p, [qi]: e.target.value }))}
                      disabled={submitted}
                      placeholder="Type the missing word or phrase…"
                      className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all"
                      style={{
                        background: submitted
                          ? ((fillAnswers[qi] || '').trim().toLowerCase() === (q.correct || '').trim().toLowerCase() ? 'rgba(34,197,94,0.1)' : 'rgba(229,77,46,0.1)')
                          : 'transparent',
                        borderColor: submitted
                          ? ((fillAnswers[qi] || '').trim().toLowerCase() === (q.correct || '').trim().toLowerCase() ? 'rgba(34,197,94,0.4)' : 'rgba(229,77,46,0.4)')
                          : 'var(--border)',
                        color: 'var(--foreground)',
                      }}
                    />
                    {submitted && (
                      <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                        Correct answer: <span className="font-semibold" style={{ color: '#22c55e' }}>{q.correct}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* MATCHING */}
                {qType === 'matching' && q.pairs && (
                  <div className="space-y-3">
                    {q.pairs.map((pair, pi) => {
                      const defs = shuffledDefs[qi] || q.pairs!.map(p => p.definition)
                      const selectedDef = (matchingAnswers[qi] || {})[pair.term]
                      const isCorrectMatch = submitted && selectedDef === pair.definition
                      const isWrongMatch = submitted && !!selectedDef && selectedDef !== pair.definition
                      return (
                        <div key={pi} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-2/5 truncate" style={{ color: 'var(--foreground)' }}>{pair.term}</span>
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>→</span>
                          <select
                            value={selectedDef || ''}
                            onChange={e => setMatchAnswer(qi, pair.term, e.target.value)}
                            disabled={submitted}
                            className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-all"
                            style={{
                              background: isCorrectMatch ? 'rgba(34,197,94,0.1)' : isWrongMatch ? 'rgba(229,77,46,0.1)' : 'var(--background)',
                              borderColor: isCorrectMatch ? 'rgba(34,197,94,0.4)' : isWrongMatch ? 'rgba(229,77,46,0.4)' : 'var(--border)',
                              color: 'var(--foreground)',
                            }}
                          >
                            <option value="">Select…</option>
                            {defs.map((def, di) => <option key={di} value={def}>{def}</option>)}
                          </select>
                        </div>
                      )
                    })}
                    {submitted && (
                      <div className="mt-2 pt-2 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>Answer key:</p>
                        {q.pairs.map((pair, pi) => (
                          <p key={pi} className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            <span className="font-semibold">{pair.term}</span> → {pair.definition}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SHORT ANSWER */}
                {qType === 'short_answer' && (
                  <div className="space-y-3">
                    <textarea
                      value={shortAnswers[qi] || ''}
                      onChange={e => !submitted && setShortAnswers(p => ({ ...p, [qi]: e.target.value }))}
                      disabled={submitted}
                      placeholder="Write your answer here…"
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all resize-none"
                      style={{ background: 'transparent', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                    {submitted && (
                      <div className="p-3 rounded-lg" style={{ background: 'rgba(34,197,94,0.08)', borderLeft: '3px solid rgba(34,197,94,0.5)' }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: '#22c55e' }}>Sample Answer</p>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{q.sampleAnswer}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* EXPLANATION */}
                {submitted && qType !== 'short_answer' && (
                  <div className="mt-3 flex items-start gap-2">
                    {(qType === 'multiple_choice' || qType === 'true_false') && (
                      answers[qi] === q.correct
                        ? <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} />
                        : <XCircle size={15} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--destructive)' }} />
                    )}
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{q.explanation}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {!submitted ? (
            <button
              onClick={submit}
              disabled={!allAnswered}
              className="flex-1 py-3 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              Submit quiz
            </button>
          ) : (
            <>
              <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 rounded-lg border font-medium text-sm transition-all hover:opacity-80" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                <RotateCcw size={14} /> Try again
              </button>
              <button
                onClick={regenerateQuiz}
                disabled={regenerating || !rawContent}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border font-medium text-sm transition-all hover:opacity-80 disabled:opacity-40"
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
                {regenerating ? 'Generating…' : 'New questions'}
              </button>
              <Link href={`/notes/${id}`} className="flex items-center gap-2 px-5 py-2.5 rounded-lg border font-medium text-sm transition-all hover:opacity-80" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                <FileText size={14} /> Review notes
              </Link>
              <Link href="/upload" className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                New session <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
