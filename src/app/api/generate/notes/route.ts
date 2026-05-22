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
        messages: [
          {
            role: 'system',
            content: 'You are an expert tutor and study assistant. You write deeply insightful, accurate, and well-structured study notes. Always respond with valid JSON only — no markdown, no code fences, no extra text before or after the JSON object.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 4096,
      })
      return completion.choices[0].message.content || '{}'
    } catch (e: unknown) {
      if (i === retries) throw e
      // wait 1.5s before retry
      await new Promise(r => setTimeout(r, 1500))
    }
  }
  return '{}'
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, title } = await req.json()
  if (!content) return NextResponse.json({ error: 'No content provided' }, { status: 400 })

  const prompt = `You are PEAK AI, an elite study assistant that generates deeply insightful, exam-ready notes.

Before generating, assess the subject type:
- History/Social Studies → chronological narrative, cause-and-effect, key figures and motivations
- Science/Math → conceptual explanations first, then mechanics; highlight formulas and processes
- Literature/Humanities → themes, arguments, interpretations
- Mixed/General → use the structure that best serves understanding

Rules:
1. Each section point must be a full 1-2 sentence explanation, NOT a vague bullet fragment
2. Explain WHY things happened or work the way they do, not just WHAT
3. Flag anything commonly confused or misunderstood
4. Key terms must have precise, meaningful definitions
5. Key takeaways must be the most exam-critical insights
6. Aim for 4-6 sections with real depth

Respond with ONLY this JSON (no markdown, no code fences, no text outside the JSON):
{
  "title": "string",
  "summary": "string (3-4 sentences: what this topic is, why it matters, big picture)",
  "subjectType": "string (e.g. History, Biology, Mathematics)",
  "sections": [
    {
      "heading": "string",
      "points": ["string (full sentence explanation)"],
      "keyTerms": [{"term": "string", "definition": "string"}],
      "commonMisconception": "string (optional)"
    }
  ],
  "keyTakeaways": ["string"],
  "connections": ["string"]
}

Study material:
${content.slice(0, 12000)}`

  try {
    const raw = await generateWithRetry(prompt)

    // Strip any accidental markdown fences
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')

    const notes = JSON.parse(jsonMatch[0])
    return NextResponse.json({ notes })
  } catch (e) {
    console.error('Notes generation error:', e)
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 500 })
  }
}
