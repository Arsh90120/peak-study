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
    const completion = await nvidiaClient.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are PEAK AI, a sharp and helpful study assistant built into the PEAK study app. 
You help students understand concepts, clarify doubts, quiz themselves, and think more deeply about their study material.
Be concise, clear, and friendly — like a smart tutor, not a textbook. 
If a student asks about a topic, explain it well. If they paste notes or content, help them work with it.
Never make up facts. If you're unsure, say so.`
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1024,
    })

    const reply = completion.choices[0].message.content || ''
    return NextResponse.json({ reply })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'AI failed to respond' }, { status: 500 })
  }
}
