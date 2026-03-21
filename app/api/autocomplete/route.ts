import OpenAI from 'openai'
import { getLevelConfig } from '@/lib/autocomplete/levelConfig'
import { buildPrompt, buildSummarizePrompt } from '@/lib/autocomplete/buildPrompt'
import type { AutocompleteContext } from '@/types/autocomplete'

export const runtime = 'edge'

export async function POST(req: Request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const body = await req.json()

  // Summarize mode: returns JSON
  if (body.mode === 'summarize') {
    const messages = buildSummarizePrompt(body.text)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 80,
      messages,
    })
    const summary = completion.choices[0]?.message?.content ?? ''
    return Response.json({ summary })
  }

  // Autocomplete mode: streams plain text
  const { context, level } = body as { context: AutocompleteContext; level: number }
  const { maxTokens, stopSequences } = getLevelConfig(level)
  const messages = buildPrompt(context)

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: maxTokens,
    stop: stopSequences.length > 0 ? stopSequences : undefined,
    stream: true,
    messages,
  })

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
    cancel() {
      stream.controller.abort()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
