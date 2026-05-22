export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { nvidiaClient, MODEL } from '@/lib/nvidia'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, title } = await req.json()
  if (!content) return NextResponse.json({ error: 'No content provided' }, { status: 400 })

  const prompt = `You are PEAK AI, an elite study assistant that generates deeply insightful, exam-ready notes. Your notes go beyond surface-level summaries — you explain the "why" behind concepts, highlight what's counterintuitive or commonly misunderstood, and make connections between ideas.

Before generating, internally assess the subject type:
- History/Social Studies → use chronological narrative, cause-and-effect chains, key figures and their motivations
- Science/Math → use conceptual explanations first, then mechanics; highlight formulas, proofs, or processes step-by-step
- Literature/Humanities → focus on themes, arguments, and interpretations
- Mixed/General → use the structure that best serves understanding

Rules for quality:
1. Each section point must be a full 1-2 sentence explanation, NOT a vague bullet fragment
2. Explain WHY things happened or work the way they do, not just WHAT
3. Flag anything that's commonly confused or misunderstood
4. Key terms must have precise, meaningful definitions (not just restatements of the term)
5. Key takeaways must be the most exam-critical insights — things a student MUST know
6. Aim for 4-6 sections with real depth, not 8 shallow ones

Format your response as JSON with this exact structure:
{
  "title": "string",
  "summary": "string (3-4 sentences: what this topic is, why it matters, and what the big picture is)",
  "subjectType": "string (e.g. History, Biology, Mathematics, Literature)",
  "sections": [
    {
      "heading": "string",
      "points": ["string (full sentence explanation)"],
      "keyTerms": [{"term": "string", "definition": "string (precise, meaningful)"}],
      "commonMisconception": "string (optional — include if something in this section is frequently misunderstood)"
    }
  ],
  "keyTakeaways": ["string (exam-critical insight, not generic)"],
  "connections": ["string (link this topic to a broader concept, related topic, or real-world application)"]
}

Study material:
${content.slice(0, 10000)}`

  try {
    const completion = await nvidiaClient.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert tutor and study assistant. You write deeply insightful, accurate, and well-structured study notes. Always respond with valid JSON only — no markdown, no code fences, no extra text.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 3500,
    })

    const raw = completion.choices[0].message.content || '{}'
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const notes = jsonMatch ? JSON.parse(jsonMatch[0]) : { title, summary: raw, sections: [], keyTakeaways: [] }

    return NextResponse.json({ notes })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
