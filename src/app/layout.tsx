import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { FloatingAiAssistant } from '@/components/FloatingAiAssistant'

export const metadata: Metadata = {
  title: 'PEAK — Study smarter. Reach your peak.',
  description: 'PEAK uses AI to turn your PDFs, notes, and topics into structured study materials — notes, quizzes, and more.',
  openGraph: {
    title: 'PEAK',
    description: 'AI-powered study platform',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
          <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" />
        </head>
        <body>
          <ThemeProvider>
            {children}
            <FloatingAiAssistant />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
