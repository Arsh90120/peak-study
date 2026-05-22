/**
 * Renders LaTeX math in a string using KaTeX (loaded via CDN).
 * Supports:
 *   $$...$$ — block/display math
 *   $...$   — inline math
 *
 * Falls back to plain text if KaTeX hasn't loaded yet.
 */
export function renderMath(text: string): string {
  if (typeof window === 'undefined') return text

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const katex = (window as any).katex
  if (!katex) return text

  // Block math: $$...$$
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
    try {
      return katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false })
    } catch {
      return _
    }
  })

  // Inline math: $...$  (not preceded/followed by another $)
  text = text.replace(/(?<!\$)\$([^\$\n]+?)\$(?!\$)/g, (_, expr) => {
    try {
      return katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false })
    } catch {
      return _
    }
  })

  return text
}
