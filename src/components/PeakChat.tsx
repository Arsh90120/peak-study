'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileUp, MonitorIcon, CircleUserRound, ArrowRight, Sparkles } from 'lucide-react'

export function PeakChat() {
  const router = useRouter()
  const [topicOpen, setTopicOpen] = useState(false)
  const [topic, setTopic] = useState('')

  const handleTopicSubmit = () => {
    if (!topic.trim()) return
    router.push(`/upload?type=topic&q=${encodeURIComponent(topic.trim())}`)
  }

  const cards = [
    {
      icon: <FileUp size={24} />,
      label: 'Upload PDF',
      desc: 'Turn any PDF into structured notes and a quiz',
      href: '/upload?type=pdf',
      onClick: () => router.push('/upload?type=pdf'),
    },
    {
      icon: <MonitorIcon size={24} />,
      label: 'Enter a Topic',
      desc: 'Type any subject and PEAK AI builds your study material',
      href: null,
      onClick: () => setTopicOpen(true),
    },
    {
      icon: <CircleUserRound size={24} />,
      label: 'Paste Notes',
      desc: 'Drop in your own notes and get them cleaned up and quizzed',
      href: '/upload?type=text',
      onClick: () => router.push('/upload?type=text'),
    },
  ]

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div
          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border"
          style={{ color: 'var(--primary)', borderColor: 'rgba(100,74,64,0.3)', background: 'rgba(100,74,64,0.06)' }}
        >
          <Sparkles size={11} /> PEAK AI
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          What do you want to study?
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Choose how you want to start — PEAK AI does the rest
        </p>
      </div>

      {/* Three cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={card.onClick}
            className="group flex flex-col items-start gap-3 p-5 rounded-2xl border text-left transition-all hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
            style={{
              background: 'var(--card)',
              borderColor: 'var(--border)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: 'rgba(100,74,64,0.1)', color: 'var(--primary)' }}
            >
              {card.icon}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm mb-1" style={{ color: 'var(--foreground)' }}>{card.label}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{card.desc}</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--primary)' }}>
              Get started <ArrowRight size={12} />
            </div>
          </button>
        ))}
      </div>

      {/* Topic input — slides in when "Enter a Topic" is clicked */}
      {topicOpen && (
        <div
          className="w-full mt-5"
          style={{ animation: 'peakSlideDown 0.2s ease forwards' }}
        >
          <style>{`
            @keyframes peakSlideDown {
              from { opacity: 0; transform: translateY(-8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <div
            className="flex items-center gap-3 p-3 rounded-2xl border"
            style={{ background: 'var(--card)', borderColor: 'var(--primary)' }}
          >
            <input
              autoFocus
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleTopicSubmit(); if (e.key === 'Escape') { setTopicOpen(false); setTopic('') } }}
              placeholder="e.g. Mitosis, The French Revolution, Newton's laws..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--foreground)' }}
            />
            <button
              onClick={handleTopicSubmit}
              disabled={!topic.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: topic.trim() ? 'pointer' : 'not-allowed' }}
            >
              Generate <ArrowRight size={14} />
            </button>
          </div>
          <p className="text-xs mt-2 text-center" style={{ color: 'var(--muted-foreground)' }}>Press <kbd style={{ padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--muted)', fontFamily: 'monospace' }}>Esc</kbd> to cancel</p>
        </div>
      )}
    </div>
  )
}
