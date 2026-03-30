'use client'

import { useState, useRef, useEffect } from 'react'
import { LevelSlider } from './ui/LevelSlider'
import { StatusBar } from './ui/StatusBar'
import { DocumentPlan } from './ui/DocumentPlan'
import { WritingStyle } from './ui/WritingStyle'
import Editor from './editor/Editor'
import type { SuggestionStatus } from '@/types/autocomplete'

const PLAN_SUMMARIZE_THRESHOLD = 300
const PLAN_DEBOUNCE_MS = 1500
const STYLE_SUMMARIZE_THRESHOLD = 300
const STYLE_DEBOUNCE_MS = 1500

export default function WritingApp() {
  const [level, setLevel] = useState(5)
  const [status, setStatus] = useState<SuggestionStatus>('idle')
  const [plan, setPlan] = useState('')
  const [isSummarizingPlan, setIsSummarizingPlan] = useState(false)
  const [writingStyle, setWritingStyle] = useState('')
  const [isSummarizingStyle, setIsSummarizingStyle] = useState(false)

  const documentSummaryRef = useRef<string>('')
  const planRef = useRef<string>('')
  const planDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const writingStyleRef = useRef<string>('')
  const styleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (plan.length <= PLAN_SUMMARIZE_THRESHOLD) {
      // Short plan: pass through directly, no API call
      planRef.current = plan
      setIsSummarizingPlan(false)
      if (planDebounceRef.current) clearTimeout(planDebounceRef.current)
      return
    }

    // Long plan: debounce then summarize
    if (planDebounceRef.current) clearTimeout(planDebounceRef.current)
    planDebounceRef.current = setTimeout(async () => {
      setIsSummarizingPlan(true)
      try {
        const res = await fetch('/api/autocomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'summarize-plan', text: plan }),
        })
        if (res.ok) {
          const { summary } = await res.json()
          if (summary) planRef.current = summary
        }
      } finally {
        setIsSummarizingPlan(false)
      }
    }, PLAN_DEBOUNCE_MS)
  }, [plan])

  useEffect(() => {
    if (writingStyle.length <= STYLE_SUMMARIZE_THRESHOLD) {
      writingStyleRef.current = writingStyle
      setIsSummarizingStyle(false)
      if (styleDebounceRef.current) clearTimeout(styleDebounceRef.current)
      return
    }

    if (styleDebounceRef.current) clearTimeout(styleDebounceRef.current)
    styleDebounceRef.current = setTimeout(async () => {
      setIsSummarizingStyle(true)
      try {
        const res = await fetch('/api/autocomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'summarize-style', text: writingStyle }),
        })
        if (res.ok) {
          const { summary } = await res.json()
          if (summary) writingStyleRef.current = summary
        }
      } finally {
        setIsSummarizingStyle(false)
      }
    }, STYLE_DEBOUNCE_MS)
  }, [writingStyle])

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">AI Writing Copilot</span>
          <LevelSlider level={level} onChange={setLevel} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <DocumentPlan
            value={plan}
            onChange={setPlan}
            isSummarizing={isSummarizingPlan}
          />
          <Editor
            level={level}
            documentSummaryRef={documentSummaryRef}
            planRef={planRef}
            writingStyleRef={writingStyleRef}
            onStatusChange={setStatus}
          />
        </div>
        <div className="w-64 shrink-0 sticky top-20">
          <WritingStyle
            value={writingStyle}
            onChange={setWritingStyle}
            isSummarizing={isSummarizingStyle}
          />
        </div>
      </main>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <StatusBar status={status} />
      </div>
    </div>
  )
}
