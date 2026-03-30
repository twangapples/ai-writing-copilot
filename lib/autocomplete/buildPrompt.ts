import type { AutocompleteContext } from '@/types/autocomplete'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

const SYSTEM_PROMPT = `You are an inline writing assistant. Your sole job is to complete the writer's current thought.

Rules:
- Output ONLY the completion text, nothing else — no preamble, no explanation, no quotes
- Begin immediately where the writer's text ends (do not repeat any existing text)
- Study the [Style examples] closely and match the writer's sentence length, rhythm, vocabulary level, and tone exactly
- Never start with a capital letter unless the text ended before a proper noun or at a sentence boundary
- Stop at a natural boundary (word, phrase, sentence, or paragraph end) based on the requested length
- Never add headers, bullet points, or structural formatting unless the writer was already using them`

export function buildPrompt(context: AutocompleteContext): ChatCompletionMessageParam[] {
  const parts: string[] = []

  // User's intent comes first — highest-level context
  if (context.planText) {
    parts.push(`[Document plan:\n${context.planText}]`)
  }

  // User's explicit style instructions
  if (context.styleText) {
    parts.push(`[Writing style instructions from the user:\n${context.styleText}]`)
  }

  // Style examples sampled from the writer's own sentences
  if (context.styleExamples) {
    parts.push(`[Style examples from this writer:\n${context.styleExamples}]`)
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
      content: 'Summarize the following document in max 150 words. Include the main thesis, key arguments or points made, tone and style, and where the document is headed. Output only the summary, nothing else.',
    },
    { role: 'user', content: text },
  ]
}

export function buildStyleSummarizePrompt(style: string): ChatCompletionMessageParam[] {
  return [
    {
      role: 'system',
      content: 'Distill the following writing style instructions into concise bullet points under 80 words. Preserve all behavioral directives, tone requirements, and constraints exactly. Output only the bullet points, no preamble.',
    },
    { role: 'user', content: style },
  ]
}

export function buildPlanSummarizePrompt(plan: string): ChatCompletionMessageParam[] {
  return [
    {
      role: 'system',
      content: 'Distill the following writing plan into concise bullet points under 150 words. Preserve all goals, topics, structure, arguments, and tone requirements. Output only the bullet points, no preamble.',
    },
    { role: 'user', content: plan },
  ]
}
