'use client'

import { useEffect, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'

const MIN_CHARS_TO_SUMMARIZE = 200
const SUMMARY_COOLDOWN_MS = 30_000
const IDLE_DELAY_MS = 5_000

export function useDocumentSummary(): React.RefObject<string> {
  const [editor] = useLexicalComposerContext()
  const summaryRef = useRef<string>('')
  const lastGeneratedRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      if (timerRef.current) clearTimeout(timerRef.current)

      const now = Date.now()
      if (now - lastGeneratedRef.current < SUMMARY_COOLDOWN_MS) return

      timerRef.current = setTimeout(async () => {
        const fullText = editor.getEditorState().read(() => $getRoot().getTextContent())
        if (fullText.length < MIN_CHARS_TO_SUMMARIZE) return

        try {
          const res = await fetch('/api/autocomplete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'summarize', text: fullText }),
          })
          if (!res.ok) return
          const { summary } = await res.json()
          if (summary) {
            summaryRef.current = summary
            lastGeneratedRef.current = Date.now()
          }
        } catch {
          // Summarization is best-effort; silently ignore errors
        }
      }, IDLE_DELAY_MS)
    })
  }, [editor])

  return summaryRef
}
