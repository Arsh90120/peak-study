'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Paperclip, Link, Code, Mic, Send, Info, Bot, X } from 'lucide-react'

export function FloatingAiAssistant() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [charCount, setCharCount] = useState(0)
  const maxChars = 2000
  const chatRef = useRef<HTMLDivElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)
    setCharCount(value.length)
  }

  const handleSend = () => {
    if (message.trim()) {
      setMessage('')
      setCharCount(0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        if (!(event.target as Element).closest('.floating-ai-button')) {
          setIsChatOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating button */}
      <button
        className={`floating-ai-button relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
          isChatOpen ? 'rotate-90' : 'rotate-0'
        }`}
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={{
          background: 'var(--primary)',
          boxShadow: '0 0 20px rgba(100,74,64,0.4), 0 4px 12px rgba(0,0,0,0.15)',
          border: '2px solid rgba(255,255,255,0.15)',
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-30" />
        <div className="relative z-10">
          {isChatOpen ? <X className="w-5 h-5 text-white" /> : <Bot className="w-6 h-6 text-white" />}
        </div>
        <div className="absolute inset-0 rounded-full animate-ping opacity-10" style={{ background: 'var(--primary)' }} />
      </button>

      {/* Chat panel */}
      {isChatOpen && (
        <div
          ref={chatRef}
          className="absolute bottom-18 right-0 w-[420px] max-w-[calc(100vw-2rem)]"
          style={{ animation: 'popIn 0.25s cubic-bezier(0.175,0.885,0.32,1.275) forwards' }}
        >
          <div className="flex flex-col rounded-2xl border shadow-2xl backdrop-blur-xl overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>PEAK AI Assistant</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                <X className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              </button>
            </div>

            {/* Textarea */}
            <textarea
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={4}
              className="w-full px-5 py-3 bg-transparent border-none outline-none resize-none text-sm leading-relaxed placeholder:text-muted-foreground"
              style={{ color: 'var(--foreground)', minHeight: '110px' }}
              placeholder="Ask PEAK anything about your study material..."
            />

            {/* Controls */}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 p-1 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
                  {[
                    { icon: <Paperclip className="w-3.5 h-3.5" />, label: 'Attach' },
                    { icon: <Link className="w-3.5 h-3.5" />, label: 'Link' },
                    { icon: <Code className="w-3.5 h-3.5" />, label: 'Code' },
                    { icon: <Mic className="w-3.5 h-3.5" />, label: 'Voice' },
                  ].map(({ icon, label }) => (
                    <button key={label} title={label} className="p-2 rounded-lg transition-colors hover:bg-background" style={{ color: 'var(--muted-foreground)' }}>
                      {icon}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{charCount}/{maxChars}</span>
                  <button
                    onClick={handleSend}
                    className="p-2.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
                    style={{ background: 'var(--primary)' }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                <Info className="w-3 h-3" />
                <span>Press <kbd className="px-1.5 py-0.5 rounded border font-mono" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>Shift+Enter</kbd> for new line</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.85) translateY(16px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
