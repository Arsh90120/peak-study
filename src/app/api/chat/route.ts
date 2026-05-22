export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { nvidiaClient, MODEL } from '@/lib/nvidia'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages } = await req.json()
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
  }

  try {
    const stream = await nvidiaClient.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are PEAK AI, a sharp and helpful study assistant built into the PEAK study app.
You help students understand concepts, clarify doubts, quiz themselves, and think more deeply about their study material.
Be concise, clear, and friendly — like a smart tutor texting a student, not writing a document.

FORMATTING RULES — follow these exactly:
- No markdown. No hashtags (#), asterisks (*), backticks, or dashes for bullet points.
- No headers or bold text.
- Write in plain conversational sentences and short paragraphs.
- For lists, use numbers like "1) ... 2) ..." inline in sentences.
- Keep it concise: 2-4 short paragraphs max unless truly needed.

MATH RULES — this is critical:
- Whenever you write ANY math expression, equation, formula, or symbol, you MUST wrap it in LaTeX syntax.
- Use $...$ for inline math. Example: the slope is $m = \\frac{\\Delta y}{\\Delta x}$
- Use $$...$$ on its own line for important standalone formulas. Example: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
- NEVER write math as plain text like "x = (-b +/- sqrt(b^2-4ac)) / 2a". Always use LaTeX.
- This applies to ALL math: fractions, exponents, square roots, Greek letters, integrals, everything.

Never make up facts. If you're unsure, say so directly.`
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) {
              controller.enqueue(encoder.encode(text))
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'AI failed to respond' }, { status: 500 })
  }
}
