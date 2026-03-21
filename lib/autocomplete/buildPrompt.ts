import type { AutocompleteContext } from '@/types/autocomplete'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

const SYSTEM_PROMPT = `You are an inline writing assistant. Your sole job is to complete the writer's current thought.

Rules:
- Output ONLY the completion text, nothing else — no preamble, no explanation, no quotes
- Begin immediately where the writer's text ends (do not repeat any existing text)
- Match the writer's tone, style, voice, and vocabulary exactly
- Never start with a capital letter unless the text ended before a proper noun or at a sentence boundary
- Stop at a natural boundary (word, phrase, sentence, or paragraph end) based on the requested length
- Never add headers, bullet points, or structural formatting unless the writer was already using them`

export function buildPrompt(context: AutocompleteContext): ChatCompletionMessageParam[] {
  const parts: string[] = []

  // User's intent comes first — highest-level context
  if (context.planText) {
    parts.push(`[Document plan:\n${context.planText}]`)
  }

  // Auto-generated summary of what's been written so far
  if (context.documentSummary) {
    parts.push(`[What's been written so far: ${context.documentSummary}]`)
  }

  // Recent surrounding paragraphs for local context
  if (context.precedingParagraphs) {
    parts.push(`[Recent text:\n${context.precedingParagraphs}]`)
  }

  parts.push(`[Complete this text, starting immediately after the cursor ▌]`)
  parts.push(context.currentSentence + '▌')

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: parts.join('\n\n') },
  ]
}

export function buildSummarizePrompt(text: string): ChatCompletionMessageParam[] {
  return [
    {
      role: 'system',
      content: 'Summarize the following document in one sentence (max 30 words). Output only the summary, nothing else.',
    },
    { role: 'user', content: text },
  ]
}
