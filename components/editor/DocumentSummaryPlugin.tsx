'use client'

import { useEffect, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'

const MIN_CHARS = 200
const COOLDOWN_MS = 30_000
const IDLE_MS = 5_000

interface DocumentSummaryPluginProps {
  summaryRef: React.RefObject<string>
}

export function DocumentSummaryPlugin({ summaryRef }: DocumentSummaryPluginProps) {
  const [editor] = useLexicalComposerContext()
  const lastGeneratedRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      if (timerRef.current) clearTimeout(timerRef.current)

      const now = Date.now()
      if (now - lastGeneratedRef.current < COOLDOWN_MS) return

      timerRef.current = setTimeout(async () => {
        const fullText = editor.getEditorState().read(() => $getRoot().getTextContent())
        if (fullText.length < MIN_CHARS) return

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
          // Best-effort; ignore errors
        }
      }, IDLE_MS)
    })
  }, [editor, summaryRef])

  return null
}
