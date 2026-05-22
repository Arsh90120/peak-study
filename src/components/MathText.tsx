'use client'

import { useEffect, useState } from 'react'
import { renderMath } from '@/lib/renderMath'

interface MathTextProps {
  text: string
  style?: React.CSSProperties
  className?: string
}

/**
 * Renders a string with inline/block LaTeX math via KaTeX.
 * Waits for KaTeX CDN script to load before rendering.
 */
export function MathText({ text, style, className }: MathTextProps) {
  const [html, setHtml] = useState(text)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tryRender = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).katex) {
        setHtml(renderMath(text))
      } else {
        // KaTeX not loaded yet — retry after script loads
        const script = document.querySelector('script[src*="katex"]')
        if (script) {
          script.addEventListener('load', () => setHtml(renderMath(text)), { once: true })
        }
      }
    }
    tryRender()
  }, [text])

  return (
    <span
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
