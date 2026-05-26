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
        temperature: 0.7,
        max_tokens: 3500,
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

  const prompt = `You are PEAK AI. Generate exactly ${count} quiz questions based on the study material below.

Use a MIX of these question types. Distribute them naturally based on the content:
- "multiple_choice": 4 options (A/B/C/D), one correct answer
- "true_false": statement that is either true or false
- "fill_blank": sentence with a key term replaced by "_____"
- "short_answer": open-ended question requiring a 1-3 sentence response
- "matching": 4 pairs of terms and definitions to match

For a set of ${count} questions, aim for roughly: 3 multiple_choice, 2 true_false, 1 fill_blank, 1 short_answer, 1 matching.
Adjust naturally — do not force types that don't fit the material.

Respond with ONLY this JSON (no markdown, no code fences, no extra text):
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "string",
      "options": ["A. string", "B. string", "C. string", "D. string"],
      "correct": "A",
      "explanation": "string"
    },
    {
      "type": "true_false",
      "question": "string",
      "correct": "True",
      "explanation": "string"
    },
    {
      "type": "fill_blank",
      "question": "The _____ is responsible for ...",
      "correct": "term that fills the blank",
      "explanation": "string"
    },
    {
      "type": "short_answer",
      "question": "string",
      "sampleAnswer": "A concise model answer of 1-3 sentences.",
      "explanation": "string"
    },
    {
      "type": "matching",
      "question": "Match each term to its correct definition.",
      "pairs": [
        { "term": "string", "definition": "string" },
        { "term": "string", "definition": "string" },
        { "term": "string", "definition": "string" },
        { "term": "string", "definition": "string" }
      ],
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
