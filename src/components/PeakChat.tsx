'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { FileUp, MonitorIcon, CircleUserRound, ArrowUpIcon, Paperclip } from 'lucide-react'

function useAutoResizeTextarea({ minHeight, maxHeight }: { minHeight: number; maxHeight?: number }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current
      if (!textarea) return
      if (reset) { textarea.style.height = `${minHeight}px`; return }
      textarea.style.height = `${minHeight}px`
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight ?? Infinity))
      textarea.style.height = `${newHeight}px`
    },
    [minHeight, maxHeight],
  )

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`
  }, [minHeight])

  useEffect(() => {
    const handleResize = () => adjustHeight()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [adjustHeight])

  return { textareaRef, adjustHeight }
}

export function PeakChat() {
  const [value, setValue] = useState('')
  const router = useRouter()
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 60, maxHeight: 200 })

  const handleSubmit = () => {
    if (!value.trim()) return
    router.push(`/upload?type=topic&q=${encodeURIComponent(value.trim())}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const quickActions = [
    { icon: <FileUp className="w-4 h-4" />, label: 'Upload PDF', href: '/upload?type=pdf' },
    { icon: <MonitorIcon className="w-4 h-4" />, label: 'Enter Topic', href: '/upload?type=topic' },
    { icon: <CircleUserRound className="w-4 h-4" />, label: 'Paste Notes', href: '/upload?type=text' },
  ]

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          What do you want to study?
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Enter a topic, upload a PDF, or paste your notes</p>
      </div>

      <div className="w-full">
        <div className="relative rounded-xl border transition-all focus-within:ring-2" style={{ background: 'var(--card)', borderColor: 'var(--border)', '--tw-ring-color': 'var(--ring)' } as React.CSSProperties}>
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => { setValue(e.target.value); adjustHeight() }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Mitosis, The French Revolution, Newton's laws of motion..."
            className={cn(
              'w-full px-4 py-3 resize-none bg-transparent border-none text-sm',
              'focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
              'placeholder:text-muted-foreground min-h-[60px]',
            )}
            style={{ overflow: 'hidden', color: 'var(--foreground)' }}
          />

          <div className="flex items-center justify-between p-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <button type="button" className="group p-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-1">
              <Paperclip className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-xs hidden group-hover:inline" style={{ color: 'var(--muted-foreground)' }}>Attach PDF</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-1.5 py-1.5 rounded-lg text-sm transition-all border flex items-center gap-1 hover:opacity-90"
              style={{
                background: value.trim() ? 'var(--primary)' : 'transparent',
                borderColor: value.trim() ? 'var(--primary)' : 'var(--border)',
                color: value.trim() ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              }}
            >
              <ArrowUpIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          {quickActions.map(({ icon, label, href }) => (
            <a
              key={label}
              href={href}
              className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs transition-colors hover:bg-muted"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              {icon} {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
