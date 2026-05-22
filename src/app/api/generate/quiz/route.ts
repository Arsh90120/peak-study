export const dynamic = 'force-dynamic'
export const maxDuration = 90

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { nvidiaClient, MODEL } from '@/lib/nvidia'

async function generateWithRetry(prompt: string, retries = 2): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    try {
      const completion = await nvidiaClient.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 2500,
      })
      return completion.choices[0].message.content || '{}'
    } catch (e: unknown) {
      if (i === retries) throw e
      await new Promise(r => setTimeout(r, 1500))
    }
  }
  return '{}'
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, count = 8 } = await req.json()
  if (!content) return NextResponse.json({ error: 'No content provided' }, { status: 400 })

  const prompt = `You are PEAK AI. Generate ${count} multiple choice quiz questions based on the study material below.

Respond with ONLY this JSON (no markdown, no code fences, no extra text):
{
  "questions": [
    {
      "question": "string",
      "options": ["A. string", "B. string", "C. string", "D. string"],
      "correct": "A",
      "explanation": "string"
    }
  ]
}

Study material:
${content.slice(0, 8000)}`

  try {
    const raw = await generateWithRetry(prompt)

    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')

    const quiz = JSON.parse(jsonMatch[0])
    return NextResponse.json({ quiz })
  } catch (e) {
    console.error('Quiz generation error:', e)
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 500 })
  }
}
