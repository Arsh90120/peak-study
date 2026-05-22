'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Info, Bot, X } from 'lucide-react'
import { MathText } from '@/components/MathText'

type Message = { role: 'user' | 'assistant'; content: string }

export function FloatingAiAssistant() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText, loading])

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
    setStreamingText('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.ok || !res.body) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }])
        setLoading(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setStreamingText(fullText)
        if (loading) setLoading(false)
      }

      setMessages(prev => [...prev, { role: 'assistant', content: fullText }])
      setStreamingText('')
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Could not connect. Please try again.' }])
    } finally {
      setLoading(false)
      setStreamingText('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isThinking = loading && streamingText === ''
  const isStreaming = streamingText !== ''

  return (
    <>
      <style>{`
        @keyframes peakPopIn {
          0% { opacity: 0; transform: scale(0.88) translateY(12px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes peakBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        .peak-chat-panel { animation: peakPopIn 0.22s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
        .peak-dot { animation: peakBounce 1.2s infinite ease-in-out; }
        .peak-dot:nth-child(2) { animation-delay: 0.2s; }
        .peak-dot:nth-child(3) { animation-delay: 0.4s; }
        .katex-display { margin: 6px 0; }
        .katex { font-size: 1em; }
      `}</style>

      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50 }}>

        {isChatOpen && (
          <div ref={chatRef} className="peak-chat-panel" style={{ position: 'absolute', bottom: '72px', right: '0', width: '420px', maxWidth: 'calc(100vw - 2rem)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', background: 'var(--card)', overflow: 'hidden', maxHeight: '520px' }}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>PEAK AI Assistant</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {messages.length > 0 && (
                    <button onClick={() => { setMessages([]); setStreamingText('') }} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--muted-foreground)', background: 'transparent', cursor: 'pointer' }}>Clear</button>
                  )}
                  <button onClick={() => setIsChatOpen(false)} style={{ padding: '4px', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted-foreground)', display: 'flex' }}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '200px', maxHeight: '320px' }}>
                {messages.length === 0 && !isThinking && !isStreaming && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '32px 0' }}>
                    <Bot size={28} style={{ color: 'var(--muted-foreground)', marginBottom: '8px' }} />
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)', margin: 0 }}>Ask PEAK anything</p>
                    <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '4px' }}>Explain concepts, clarify doubts, dive deeper</p>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '85%', padding: '8px 12px',
                      borderRadius: '16px',
                      borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                      borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                      fontSize: '13px', lineHeight: '1.6',
                      background: msg.role === 'user' ? 'var(--primary)' : 'var(--muted)',
                      color: msg.role === 'user' ? 'var(--primary-foreground)' : 'var(--foreground)',
                    }}>
                      {msg.role === 'assistant'
                        ? <MathText text={msg.content} />
                        : msg.content
                      }
                    </div>
                  </div>
                ))}

                {/* Streaming bubble */}
                {isStreaming && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ maxWidth: '85%', padding: '8px 12px', borderRadius: '16px', borderBottomLeftRadius: '4px', fontSize: '13px', lineHeight: '1.6', background: 'var(--muted)', color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>
                      {streamingText}
                      <span style={{ display: 'inline-block', width: '2px', height: '13px', background: 'var(--foreground)', marginLeft: '2px', verticalAlign: 'text-bottom', opacity: 0.7, animation: 'peakBounce 1s infinite' }} />
                    </div>
                  </div>
                )}

                {/* Typing dots */}
                {isThinking && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ padding: '10px 14px', borderRadius: '16px', borderBottomLeftRadius: '4px', background: 'var(--muted)', display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <span className="peak-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--muted-foreground)', display: 'inline-block' }} />
                      <span className="peak-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--muted-foreground)', display: 'inline-block' }} />
                      <span className="peak-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--muted-foreground)', display: 'inline-block' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '10px 16px 14px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                  <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} rows={1} disabled={loading || isStreaming} placeholder="Ask anything..."
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', outline: 'none', resize: 'none', fontSize: '13px', lineHeight: '1.5', color: 'var(--foreground)', maxHeight: '100px', fontFamily: 'inherit' }}
                  />
                  <button onClick={handleSend} disabled={loading || isStreaming || !input.trim()}
                    style={{ padding: '9px', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: 'white', cursor: loading || isStreaming || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || isStreaming || !input.trim() ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'opacity 0.15s' }}>
                    <Send size={16} />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '11px', color: 'var(--muted-foreground)' }}>
                  <Info size={11} />
                  <span>Press <kbd style={{ padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--muted)', fontFamily: 'monospace', fontSize: '10px' }}>Shift+Enter</kbd> for new line</span>
                </div>
              </div>

            </div>
          </div>
        )}

        <button className="floating-ai-button" onClick={() => setIsChatOpen(p => !p)}
          style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', background: 'var(--primary)', boxShadow: '0 0 20px rgba(100,74,64,0.4), 0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: 'transform 0.2s', transform: isChatOpen ? 'rotate(90deg)' : 'rotate(0deg)', position: 'relative' }}>
          {isChatOpen ? <X size={20} /> : <Bot size={22} />}
        </button>
      </div>
    </>
  )
}
