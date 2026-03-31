import OpenAI from 'openai'
import { getLevelConfig } from '@/lib/autocomplete/levelConfig'
import { buildPrompt, buildSummarizePrompt, buildPlanSummarizePrompt, buildStyleSummarizePrompt } from '@/lib/autocomplete/buildPrompt'
import { createClient } from '@/lib/supabase/server'
import type { AutocompleteContext } from '@/types/autocomplete'

export const runtime = 'nodejs'

const DAILY_LIMIT = 200
const MAX_LEVEL = 7

async function checkAndIncrementUsage(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const { data, error } = await supabase
    .from('usage')
    .select('count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = row not found, which is fine
    return false
  }

  const currentCount = data?.count ?? 0
  if (currentCount >= DAILY_LIMIT) return false

  await supabase
    .from('usage')
    .upsert({ user_id: userId, date: today, count: currentCount + 1 })

  return true
}

export async function POST(req: Request) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Rate limit check
  const allowed = await checkAndIncrementUsage(user.id)
  if (!allowed) {
    return Response.json({ error: 'daily_limit_reached' }, { status: 429 })
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const body = await req.json()

  // Summarize document body: returns JSON
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

  // Summarize writing style instructions
  if (body.mode === 'summarize-style') {
    const messages = buildStyleSummarizePrompt(body.text)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 120,
      messages,
    })
    const summary = completion.choices[0]?.message?.content ?? ''
    return Response.json({ summary })
  }

  // Summarize plan
  if (body.mode === 'summarize-plan') {
    const messages = buildPlanSummarizePrompt(body.text)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 120,
      messages,
    })
    const summary = completion.choices[0]?.message?.content ?? ''
    return Response.json({ summary })
  }

  // Autocomplete mode: streams plain text
  const { context, level } = body as { context: AutocompleteContext; level: number }
  const cappedLevel = Math.min(level, MAX_LEVEL)
  const { maxTokens, stopSequences } = getLevelConfig(cappedLevel)
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
