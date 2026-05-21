'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { ImageIcon, FileUp, Figma, MonitorIcon, CircleUserRound, ArrowUpIcon, Paperclip, PlusIcon } from 'lucide-react'

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
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 60, maxHeight: 200 })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim()) { setValue(''); adjustHeight(true) }
    }
  }

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
        What do you want to study?
      </h1>

      <div className="w-full">
        <div className="relative rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="overflow-y-auto">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => { setValue(e.target.value); adjustHeight() }}
              onKeyDown={handleKeyDown}
              placeholder="Drop a topic, paste notes, or describe what you want to learn..."
              className={cn(
                'w-full px-4 py-3 resize-none bg-transparent border-none text-sm',
                'focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
                'placeholder:text-muted-foreground min-h-[60px]',
              )}
              style={{ overflow: 'hidden', color: 'var(--foreground)' }}
            />
          </div>

          <div className="flex items-center justify-between p-3">
            <button type="button" className="group p-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-1">
              <Paperclip className="w-4 h-4" style={{ color: 'var(--foreground)' }} />
              <span className="text-xs hidden group-hover:inline" style={{ color: 'var(--muted-foreground)' }}>Attach</span>
            </button>
            <div className="flex items-center gap-2">
              <button type="button" className="px-2 py-1 rounded-lg text-sm border border-dashed transition-colors flex items-center gap-1 hover:bg-muted" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}>
                <PlusIcon className="w-4 h-4" /> Session
              </button>
              <button
                type="button"
                className={cn(
                  'px-1.5 py-1.5 rounded-lg text-sm transition-colors border flex items-center gap-1',
                  value.trim() ? 'text-white' : '',
                )}
                style={{
                  background: value.trim() ? 'var(--primary)' : 'transparent',
                  borderColor: 'var(--border)',
                  color: value.trim() ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                }}
              >
                <ArrowUpIcon className="w-4 h-4" />
                <span className="sr-only">Send</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          {[
            { icon: <ImageIcon className="w-4 h-4" />, label: 'Screenshot' },
            { icon: <Figma className="w-4 h-4" />, label: 'Figma' },
            { icon: <FileUp className="w-4 h-4" />, label: 'Upload PDF' },
            { icon: <MonitorIcon className="w-4 h-4" />, label: 'Enter Topic' },
            { icon: <CircleUserRound className="w-4 h-4" />, label: 'Paste Notes' },
          ].map(({ icon, label }) => (
            <button
              key={label}
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs transition-colors hover:bg-muted"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
