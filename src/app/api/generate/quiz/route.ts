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
        temperature: 0.95,
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

  const { content, count = 8, coveredConcepts = [] } = await req.json()
  if (!content) return NextResponse.json({ error: 'No content provided' }, { status: 400 })

  const avoidClause = coveredConcepts.length > 0
    ? `\n\nCRITICAL — The following concepts and topics have ALREADY been tested in previous rounds. You must NOT ask about them again — not even with different wording, a different angle, or a rephrased version. Choose entirely different concepts from the material:\n${coveredConcepts.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}\n\nIf the material is limited, test edge cases, applications, exceptions, or implications of NEW concepts rather than revisiting covered ones.\n`
    : ''

  const prompt = `You are PEAK AI, an expert study assistant. Generate exactly ${count} quiz questions based on the study material below.

Use a MIX of the following question types — do not use only one type:
- "multiple_choice": 4 options (A, B, C, D), one correct answer
- "true_false": statement that is either true or false
- "fill_blank": a sentence with one key term replaced by "_____"
- "matching": 4 pairs of terms and definitions to match
- "short_answer": open-ended question requiring a 1-3 sentence answer

Guidelines:
- Aim for roughly: 3 multiple_choice, 1 true_false, 1 fill_blank, 1 matching, 2 short_answer (adjust if count differs)
- Questions should test real understanding, not just memorization
- short_answer questions should require synthesis or application of concepts
- NEVER produce a question that is just a synonym or reword of another question in this batch${avoidClause}

After generating the questions, output a separate field "coveredConcepts" — an array of short concept labels (3-6 words each) describing every distinct topic/idea this batch of questions covers. This list will be used to prevent repetition in future rounds.

Respond with ONLY this JSON (no markdown, no code fences):
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
      "question": "string (contains _____)",
      "correct": "the missing word or phrase",
      "explanation": "string"
    },
    {
      "type": "matching",
      "question": "Match each term to its definition.",
      "pairs": [
        { "term": "string", "definition": "string" },
        { "term": "string", "definition": "string" },
        { "term": "string", "definition": "string" },
        { "term": "string", "definition": "string" }
      ],
      "explanation": "string"
    },
    {
      "type": "short_answer",
      "question": "string",
      "sampleAnswer": "string (a model answer for self-grading)",
      "explanation": "string"
    }
  ],
  "coveredConcepts": ["concept label 1", "concept label 2", "..."]
}

Study material:
${content.slice(0, 8000)}`

  try {
    const raw = await generateWithRetry(prompt)
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json({ quiz: { questions: parsed.questions }, coveredConcepts: parsed.coveredConcepts || [] })
  } catch (e) {
    console.error('Quiz generation error:', e)
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 500 })
  }
}
