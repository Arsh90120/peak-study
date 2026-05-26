'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, FileText, Shuffle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────
type MCQuestion = {
  type: 'multiple_choice'
  question: string
  options: string[]
  correct: string
  explanation: string
}
type TFQuestion = {
  type: 'true_false'
  question: string
  correct: 'True' | 'False'
  explanation: string
}
type FillQuestion = {
  type: 'fill_blank'
  question: string
  correct: string
  explanation: string
}
type ShortQuestion = {
  type: 'short_answer'
  question: string
  sampleAnswer: string
  explanation: string
}
type MatchPair = { term: string; definition: string }
type MatchQuestion = {
  type: 'matching'
  question: string
  pairs: MatchPair[]
  explanation: string
}
// Legacy support: questions without a type field are treated as multiple_choice
type LegacyQuestion = {
  type?: undefined
  question: string
  options: string[]
  correct: string
  explanation: string
}

type Question = MCQuestion | TFQuestion | FillQuestion | ShortQuestion | MatchQuestion | LegacyQuestion
type Quiz = { questions: Question[] }
type Answers = Record<number, string | Record<string, string>>

// ── Helpers ────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getQuestionType(q: Question): string {
  return q.type ?? 'multiple_choice'
}

function isAnswerCorrect(q: Question, answer: string | Record<string, string> | undefined): boolean {
  if (answer === undefined) return false
  const type = getQuestionType(q)
  if (type === 'multiple_choice' || type === 'true_false') {
    return (answer as string).toUpperCase() === (q as MCQuestion | TFQuestion).correct.toUpperCase()
  }
  if (type === 'fill_blank') {
    return (answer as string).trim().toLowerCase() === (q as FillQuestion).correct.trim().toLowerCase()
  }
  if (type === 'matching') {
    const mq = q as MatchQuestion
    const ans = answer as Record<string, string>
    return mq.pairs.every(p => ans[p.term]?.trim().toLowerCase() === p.definition.trim().toLowerCase())
  }
  // short_answer: always show as "reviewed" — no auto-grading
  return false
}

// ── Sub-components ────────────────────────────────────────────────────────

function MultipleChoiceQuestion({ q, qi, answer, submitted, onSelect }: {
  q: MCQuestion | LegacyQuestion; qi: number;
  answer: string | undefined; submitted: boolean;
  onSelect: (qi: number, val: string) => void
}) {
  const isCorrect = answer === q.correct
  return (
    <div className="space-y-2">
      {q.options.map((opt, oi) => {
        const letter = ['A', 'B', 'C', 'D'][oi]
        const isSelected = answer === letter
        const isCorrectOpt = q.correct === letter
        let bg = 'transparent', borderColor = 'var(--border)', color = 'var(--foreground)'
        if (submitted) {
          if (isCorrectOpt) { bg = 'rgba(34,197,94,0.1)'; borderColor = 'rgba(34,197,94,0.4)'; color = '#22c55e' }
          else if (isSelected) { bg = 'rgba(229,77,46,0.1)'; borderColor = 'rgba(229,77,46,0.4)'; color = 'var(--destructive)' }
        } else if (isSelected) {
          bg = 'rgba(100,74,64,0.1)'; borderColor = 'var(--primary)'; color = 'var(--primary)'
        }
        return (
          <button key={oi} onClick={() => !submitted && onSelect(qi, letter)}
            className="w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all hover:opacity-80"
            style={{ background: bg, borderColor, color }}>
            <span className="font-semibold mr-2">{letter}.</span>
            {opt.replace(/^[A-D]\. /, '')}
          </button>
        )
      })}
      {submitted && (
        <div className="mt-3 flex items-start gap-2">
          {isCorrect
            ? <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} />
            : <XCircle size={15} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--destructive)' }} />}
          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{q.explanation}</p>
        </div>
      )}
    </div>
  )
}

function TrueFalseQuestion({ q, qi, answer, submitted, onSelect }: {
  q: TFQuestion; qi: number;
  answer: string | undefined; submitted: boolean;
  onSelect: (qi: number, val: string) => void
}) {
  const isCorrect = answer?.toLowerCase() === q.correct.toLowerCase()
  return (
    <div className="space-y-2">
      {['True', 'False'].map(opt => {
        const isSelected = answer === opt
        const isCorrectOpt = q.correct === opt
        let bg = 'transparent', borderColor = 'var(--border)', color = 'var(--foreground)'
        if (submitted) {
          if (isCorrectOpt) { bg = 'rgba(34,197,94,0.1)'; borderColor = 'rgba(34,197,94,0.4)'; color = '#22c55e' }
          else if (isSelected) { bg = 'rgba(229,77,46,0.1)'; borderColor = 'rgba(229,77,46,0.4)'; color = 'var(--destructive)' }
        } else if (isSelected) {
          bg = 'rgba(100,74,64,0.1)'; borderColor = 'var(--primary)'; color = 'var(--primary)'
        }
        return (
          <button key={opt} onClick={() => !submitted && onSelect(qi, opt)}
            className="w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all hover:opacity-80"
            style={{ background: bg, borderColor, color }}>
            {opt}
          </button>
        )
      })}
      {submitted && (
        <div className="mt-3 flex items-start gap-2">
          {isCorrect
            ? <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} />
            : <XCircle size={15} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--destructive)' }} />}
          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{q.explanation}</p>
        </div>
      )}
    </div>
  )
}

function FillBlankQuestion({ q, qi, answer, submitted, onSelect }: {
  q: FillQuestion; qi: number;
  answer: string | undefined; submitted: boolean;
  onSelect: (qi: number, val: string) => void
}) {
  const isCorrect = isAnswerCorrect(q, answer)
  return (
    <div className="space-y-3">
      <input
        type="text"
        disabled={submitted}
        placeholder="Type your answer…"
        value={answer ?? ''}
        onChange={e => onSelect(qi, e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all"
        style={{
          background: submitted
            ? isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(229,77,46,0.1)'
            : 'transparent',
          borderColor: submitted
            ? isCorrect ? 'rgba(34,197,94,0.4)' : 'rgba(229,77,46,0.4)'
            : 'var(--border)',
          color: 'var(--foreground)'
        }}
      />
      {submitted && (
        <div className="space-y-1">
          {!isCorrect && (
            <p className="text-xs font-medium" style={{ color: '#22c55e' }}>
              ✓ Correct answer: <span className="font-bold">{q.correct}</span>
            </p>
          )}
          <div className="flex items-start gap-2">
            {isCorrect
              ? <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} />
              : <XCircle size={15} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--destructive)' }} />}
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{q.explanation}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ShortAnswerQuestion({ q, qi, answer, submitted, onSelect }: {
  q: ShortQuestion; qi: number;
  answer: string | undefined; submitted: boolean;
  onSelect: (qi: number, val: string) => void
}) {
  return (
    <div className="space-y-3">
      <textarea
        disabled={submitted}
        placeholder="Write your answer here…"
        value={answer ?? ''}
        onChange={e => onSelect(qi, e.target.value)}
        rows={3}
        className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none resize-none transition-all"
        style={{ background: 'transparent', borderColor: 'var(--border)', color: 'var(--foreground)' }}
      />
      {submitted && (
        <div className="p-3 rounded-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--primary)' }}>Sample answer</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{q.sampleAnswer}</p>
        </div>
      )}
    </div>
  )
}

function MatchingQuestion({ q, qi, answer, submitted, onSelect }: {
  q: MatchQuestion; qi: number;
  answer: Record<string, string> | undefined; submitted: boolean;
  onSelect: (qi: number, val: string) => void
}) {
  const [shuffledDefs] = useState(() => shuffle(q.pairs.map(p => p.definition)))
  const current = answer ?? {}

  function selectMatch(term: string, def: string) {
    if (submitted) return
    // toggle off if already selected
    const next = { ...current }
    if (next[term] === def) {
      delete next[term]
    } else {
      // unassign def from any other term first
      Object.keys(next).forEach(k => { if (next[k] === def) delete next[k] })
      next[term] = def
    }
    onSelect(qi, JSON.stringify(next))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Click a term, then click its matching definition.</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>Terms</p>
          {q.pairs.map(p => {
            const isSelected = current[p.term] !== undefined
            const isCorrect = submitted && current[p.term]?.trim().toLowerCase() === p.definition.trim().toLowerCase()
            const isWrong = submitted && isSelected && !isCorrect
            return (
              <div key={p.term} className="px-3 py-2 rounded-lg border text-sm font-medium"
                style={{
                  borderColor: submitted ? (isCorrect ? 'rgba(34,197,94,0.4)' : isWrong ? 'rgba(229,77,46,0.4)' : 'var(--border)') : isSelected ? 'var(--primary)' : 'var(--border)',
                  background: submitted ? (isCorrect ? 'rgba(34,197,94,0.1)' : isWrong ? 'rgba(229,77,46,0.1)' : 'transparent') : isSelected ? 'rgba(100,74,64,0.1)' : 'transparent',
                  color: 'var(--foreground)'
                }}>
                {p.term}
                {submitted && isSelected && (
                  <span className="ml-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>→ {current[p.term]}</span>
                )}
              </div>
            )
          })}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>Definitions</p>
          {shuffledDefs.map(def => {
            const matchedTerm = Object.keys(current).find(k => current[k] === def)
            const isMatched = !!matchedTerm
            const isCorrect = submitted && q.pairs.find(p => p.definition === def)?.term === matchedTerm
            return (
              <button key={def} onClick={() => {
                // find which term is "active" (last clicked without a def), fallback: pick first unmatched
                const unmatched = q.pairs.find(p => !current[p.term])
                if (unmatched) selectMatch(unmatched.term, def)
              }}
                disabled={submitted}
                className="w-full text-left px-3 py-2 rounded-lg border text-sm transition-all hover:opacity-80"
                style={{
                  borderColor: submitted ? (isCorrect ? 'rgba(34,197,94,0.4)' : isMatched ? 'rgba(229,77,46,0.4)' : 'var(--border)') : isMatched ? 'var(--primary)' : 'var(--border)',
                  background: submitted ? (isCorrect ? 'rgba(34,197,94,0.1)' : isMatched ? 'rgba(229,77,46,0.1)' : 'transparent') : isMatched ? 'rgba(100,74,64,0.1)' : 'transparent',
                  color: 'var(--foreground)'
                }}>
                {def}
              </button>
            )
          })}
        </div>
      </div>
      {submitted && (
        <div className="mt-2">
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--primary)' }}>Correct matches</p>
          {q.pairs.map(p => (
            <p key={p.term} className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <span className="font-medium" style={{ color: 'var(--foreground)' }}>{p.term}</span> → {p.definition}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function QuizPage() {
  const { id } = useParams()
  const [notesContent, setNotesContent] = useState<string>('')
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [renewing, setRenewing] = useState(false)
  const [answers, setAnswers] = useState<Answers>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [gradableCount, setGradableCount] = useState(0)

  useEffect(() => {
    supabase.from('sessions').select('quiz, content').eq('id', id).single()
      .then(({ data }) => {
        if (data) {
          setQuiz(data.quiz as Quiz)
          setNotesContent(data.content ?? '')
        }
        setLoading(false)
      })
  }, [id])

  function handleSelect(qi: number, val: string) {
    if (submitted) return
    const q = quiz!.questions[qi]
    const type = getQuestionType(q)
    if (type === 'matching') {
      try {
        setAnswers(p => ({ ...p, [qi]: JSON.parse(val) as Record<string, string> }))
      } catch {
        setAnswers(p => ({ ...p, [qi]: {} }))
      }
    } else {
      setAnswers(p => ({ ...p, [qi]: val }))
    }
  }

  function submit() {
    if (!quiz) return
    let correct = 0
    let gradable = 0
    quiz.questions.forEach((q, i) => {
      const type = getQuestionType(q)
      if (type === 'short_answer') return // not auto-graded
      gradable++
      if (isAnswerCorrect(q, answers[i])) correct++
    })
    setScore(correct)
    setGradableCount(gradable)
    setSubmitted(true)
  }

  function reset() {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
    setGradableCount(0)
  }

  const renewQuiz = useCallback(async () => {
    if (!notesContent) return
    setRenewing(true)
    try {
      const res = await fetch('/api/generate/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: notesContent, count: quiz?.questions.length ?? 8 })
      })
      const data = await res.json()
      if (data.quiz) {
        setQuiz(data.quiz)
        reset()
      }
    } catch (e) {
      console.error('Quiz renewal error:', e)
    } finally {
      setRenewing(false)
    }
  }, [notesContent, quiz])

  function isQuizAnswered() {
    if (!quiz) return false
    return quiz.questions.every((q, i) => {
      const type = getQuestionType(q)
      if (type === 'short_answer') return true // optional — can always submit
      if (type === 'matching') return Object.keys((answers[i] as Record<string, string> | undefined) ?? {}).length === (q as MatchQuestion).pairs.length
      return !!answers[i]
    })
  }

  // ── Loading / not found states ───────────────────────────────────────────
  if (loading) return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-28">
        {[1, 2, 3].map(i => <div key={i} className="h-36 rounded-xl mb-4 animate-pulse" style={{ background: 'var(--card)' }} />)}
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
  const pct = submitted && gradableCount > 0 ? Math.round((score / gradableCount) * 100) : 0
  const hasShortAnswer = quiz.questions.some(q => getQuestionType(q) === 'short_answer')

  const TYPE_LABELS: Record<string, string> = {
    multiple_choice: 'Multiple Choice',
    true_false: 'True / False',
    fill_blank: 'Fill in the Blank',
    short_answer: 'Short Answer',
    matching: 'Matching',
  }

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-24 pb-16">

        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--primary)' }}>PEAK AI Quiz</p>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Test your knowledge</h1>
        </div>

        {/* Score banner */}
        {submitted && (
          <div className="mb-8 p-5 rounded-xl border text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="text-4xl font-bold mb-1" style={{ color: pct >= 70 ? '#22c55e' : pct >= 50 ? 'var(--primary)' : 'var(--destructive)' }}>
              {gradableCount > 0 ? `${pct}%` : '—'}
            </p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {gradableCount > 0 ? `${score} of ${gradableCount} auto-graded questions correct` : 'Review your answers below'}
            </p>
            {hasShortAnswer && (
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Short answer questions are self-reviewed — compare your response to the sample answer.</p>
            )}
            <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
              {pct >= 80 ? '🎉 Excellent work!' : pct >= 60 ? 'Good effort — review the missed ones below.' : gradableCount === 0 ? 'Review your short answers against the samples.' : "Keep studying — you've got this."}
            </p>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-5 mb-8">
          {quiz.questions.map((q, qi) => {
            const type = getQuestionType(q)
            const ans = answers[qi]
            const correct = isAnswerCorrect(q, ans)
            const borderColor = submitted
              ? type === 'short_answer' ? 'var(--border)' : (correct ? 'rgba(34,197,94,0.4)' : ans ? 'rgba(229,77,46,0.4)' : 'var(--border)')
              : 'var(--border)'

            return (
              <div key={qi} className="p-5 rounded-xl border" style={{ background: 'var(--card)', borderColor }}>
                {/* Question header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold" style={{ color: 'var(--muted-foreground)' }}>Q{qi + 1}.</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--border)', color: 'var(--muted-foreground)' }}>
                    {TYPE_LABELS[type] ?? 'Question'}
                  </span>
                </div>
                <p className="font-medium mb-4 leading-relaxed" style={{ color: 'var(--foreground)' }}>{q.question}</p>

                {/* Render by type */}
                {(type === 'multiple_choice' || !q.type) && (
                  <MultipleChoiceQuestion
                    q={q as MCQuestion}
                    qi={qi}
                    answer={ans as string | undefined}
                    submitted={submitted}
                    onSelect={handleSelect}
                  />
                )}
                {type === 'true_false' && (
                  <TrueFalseQuestion
                    q={q as TFQuestion}
                    qi={qi}
                    answer={ans as string | undefined}
                    submitted={submitted}
                    onSelect={handleSelect}
                  />
                )}
                {type === 'fill_blank' && (
                  <FillBlankQuestion
                    q={q as FillQuestion}
                    qi={qi}
                    answer={ans as string | undefined}
                    submitted={submitted}
                    onSelect={handleSelect}
                  />
                )}
                {type === 'short_answer' && (
                  <ShortAnswerQuestion
                    q={q as ShortQuestion}
                    qi={qi}
                    answer={ans as string | undefined}
                    submitted={submitted}
                    onSelect={handleSelect}
                  />
                )}
                {type === 'matching' && (
                  <MatchingQuestion
                    q={q as MatchQuestion}
                    qi={qi}
                    answer={ans as Record<string, string> | undefined}
                    submitted={submitted}
                    onSelect={handleSelect}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {!submitted ? (
            <button
              onClick={submit}
              disabled={!isQuizAnswered()}
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
                onClick={renewQuiz}
                disabled={renewing || !notesContent}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border font-medium text-sm transition-all hover:opacity-80 disabled:opacity-40"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
              >
                <Shuffle size={14} />
                {renewing ? 'Generating…' : 'New questions'}
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
