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

CRITICAL FORMATTING RULES — you must follow these without exception:
- Never use markdown. No hashtags (#), no asterisks (*), no backticks, no dashes for bullet points.
- Do not use headers or bold text.
- Write in plain conversational sentences and paragraphs only.
- If you need to list things, write them naturally in a sentence or use numbers like "1) ... 2) ..."
- Keep responses concise. 2-4 short paragraphs max unless the question truly needs more.

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
