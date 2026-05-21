import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { nvidiaClient, MODEL } from '@/lib/nvidia'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, count = 8 } = await req.json()
  if (!content) return NextResponse.json({ error: 'No content provided' }, { status: 400 })

  const prompt = `You are PEAK AI. Generate ${count} multiple choice quiz questions based on the study material below.

Format as JSON:
{
  "questions": [
    {
      "question": "string",
      "options": ["A. string", "B. string", "C. string", "D. string"],
      "correct": "A",
      "explanation": "string (brief explanation of correct answer)"
    }
  ]
}

Make questions clear, specific, and test real understanding — not just memorization. Vary difficulty.

Study material:
${content.slice(0, 6000)}`

  try {
    const completion = await nvidiaClient.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 2048,
    })

    const raw = completion.choices[0].message.content || '{}'
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const quiz = jsonMatch ? JSON.parse(jsonMatch[0]) : { questions: [] }

    return NextResponse.json({ quiz })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
