'use client'

import { useState, useRef, useEffect } from 'react'
import { LevelSlider } from './ui/LevelSlider'
import { StatusBar } from './ui/StatusBar'
import { DocumentPlan } from './ui/DocumentPlan'
import Editor from './editor/Editor'
import type { SuggestionStatus } from '@/types/autocomplete'

export default function WritingApp() {
  const [level, setLevel] = useState(5)
  const [status, setStatus] = useState<SuggestionStatus>('idle')
  const [plan, setPlan] = useState('')

  // Refs so plugins always read the latest values without re-registering listeners
  const documentSummaryRef = useRef<string>('')
  const planRef = useRef<string>('')

  useEffect(() => {
    planRef.current = plan
  }, [plan])

  return (
    <div className="min-h-screen bg-white">
      {/* Header / toolbar */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">AI Writing Copilot</span>
          <LevelSlider level={level} onChange={setLevel} />
        </div>
      </header>

      {/* Editor area */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        <DocumentPlan value={plan} onChange={setPlan} />
        <Editor
          level={level}
          documentSummaryRef={documentSummaryRef}
          planRef={planRef}
          onStatusChange={setStatus}
        />
      </main>

      {/* Status bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <StatusBar status={status} />
      </div>
    </div>
  )
}
