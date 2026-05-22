'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Info, Bot, X } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }

export function FloatingAiAssistant() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (isChatOpen) setTimeout(() => textareaRef.current?.focus(), 100)
  }, [isChatOpen])

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

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMessage: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Try again.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Could not connect. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
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

      {isChatOpen && (
        <div
          ref={chatRef}
          className="absolute bottom-18 right-0 w-[420px] max-w-[calc(100vw-2rem)]"
          style={{ animation: 'popIn 0.25s cubic-bezier(0.175,0.885,0.32,1.275) forwards' }}
        >
          <div className="flex flex-col rounded-2xl border shadow-2xl overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)', maxHeight: '520px' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>PEAK AI Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={() => setMessages([])}
                    className="text-xs px-2 py-1 rounded-lg border transition-colors hover:bg-muted"
                    style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                  >
                    Clear
                  </button>
                )}
                <button onClick={() => setIsChatOpen(false)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                  <X className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: '200px', maxHeight: '320px' }}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <Bot size={28} className="mb-2" style={{ color: 'var(--muted-foreground)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Ask PEAK anything</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Explain concepts, clarify doubts, dive deeper</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed"
                    style={{
                      background: msg.role === 'user' ? 'var(--primary)' : 'var(--muted)',
                      color: msg.role === 'user' ? 'var(--primary-foreground)' : 'var(--foreground)',
                      borderBottomRightRadius: msg.role === 'user' ? '4px' : undefined,
                      borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : undefined,
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm" style={{ background: 'var(--muted)' }}>
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--muted-foreground)', animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={loading}
                  className="flex-1 px-3 py-2 rounded-xl border bg-transparent outline-none resize-none text-sm leading-relaxed placeholder:text-muted-foreground"
                  style={{ color: 'var(--foreground)', borderColor: 'var(--border)', maxHeight: '100px' }}
                  placeholder="Ask anything..."
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="p-2.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 flex-shrink-0"
                  style={{ background: 'var(--primary)' }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
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
