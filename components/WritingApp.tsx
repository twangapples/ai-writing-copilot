'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { LevelSlider } from './ui/LevelSlider'
import { StatusBar } from './ui/StatusBar'
import { DocumentPlan } from './ui/DocumentPlan'
import { WritingStyle } from './ui/WritingStyle'
import { DocTitle } from './ui/DocTitle'
import { SaveIndicator, type SaveStatus } from './ui/SaveIndicator'
import Editor from './editor/Editor'
import { createClient } from '@/lib/supabase/client'
import { updateDocument } from '@/lib/documents/queries'
import type { Document } from '@/lib/documents/queries'
import type { LexicalEditor } from 'lexical'
import type { SuggestionStatus } from '@/types/autocomplete'

const PLAN_SUMMARIZE_THRESHOLD = 300
const PLAN_DEBOUNCE_MS = 1500
const STYLE_SUMMARIZE_THRESHOLD = 300
const STYLE_DEBOUNCE_MS = 1500
const AUTOSAVE_INTERVAL_MS = 10_000

interface WritingAppProps {
  initialDoc: Document
}

export default function WritingApp({ initialDoc }: WritingAppProps) {
  const [level, setLevel] = useState(initialDoc.level)
  const [status, setStatus] = useState<SuggestionStatus>('idle')
  const [plan, setPlan] = useState(initialDoc.plan)
  const [isSummarizingPlan, setIsSummarizingPlan] = useState(false)
  const [writingStyle, setWritingStyle] = useState(initialDoc.writing_style)
  const [isSummarizingStyle, setIsSummarizingStyle] = useState(false)
  const [title, setTitle] = useState(initialDoc.title)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')

  const documentSummaryRef = useRef<string>('')
  const planRef = useRef<string>(initialDoc.plan)
  const planDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const writingStyleRef = useRef<string>(initialDoc.writing_style)
  const styleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editorRef = useRef<LexicalEditor | null>(null)

  // Stable refs for auto-save closure
  const titleRef = useRef(title)
  const planStateRef = useRef(plan)
  const writingStyleStateRef = useRef(writingStyle)
  const levelRef = useRef(level)

  useEffect(() => { titleRef.current = title }, [title])
  useEffect(() => { planStateRef.current = plan }, [plan])
  useEffect(() => { writingStyleStateRef.current = writingStyle }, [writingStyle])
  useEffect(() => { levelRef.current = level }, [level])

  // Plan summarization
  useEffect(() => {
    if (plan.length <= PLAN_SUMMARIZE_THRESHOLD) {
      planRef.current = plan
      setIsSummarizingPlan(false)
      if (planDebounceRef.current) clearTimeout(planDebounceRef.current)
      return
    }
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

  // Writing style summarization
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

  // Auto-save every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const editorState = editorRef.current?.getEditorState()
      const content = editorState ? editorState.toJSON() : null
      setSaveStatus('saving')
      try {
        const supabase = createClient()
        await updateDocument(supabase, initialDoc.id, {
          title: titleRef.current,
          content,
          plan: planStateRef.current,
          writing_style: writingStyleStateRef.current,
          level: levelRef.current,
        })
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }, AUTOSAVE_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [initialDoc.id])

  const handleEditorReady = useCallback((editor: LexicalEditor) => {
    editorRef.current = editor
  }, [])

  const initialEditorState = initialDoc.content
    ? JSON.stringify(initialDoc.content)
    : null

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            aria-label="Back to documents"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <DocTitle value={title} onChange={setTitle} />
          <div className="flex items-center gap-3 ml-auto">
            <SaveIndicator status={saveStatus} />
            <LevelSlider level={level} onChange={setLevel} />
          </div>
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
            initialEditorState={initialEditorState}
            onEditorReady={handleEditorReady}
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
