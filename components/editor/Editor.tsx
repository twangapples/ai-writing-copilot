'use client'

import { useRef, useCallback } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { GhostTextNode } from './GhostTextNode'
import { GhostTextPlugin } from './GhostTextPlugin'
import { AutocompletePlugin } from './AutocompletePlugin'
import { DocumentSummaryPlugin } from './DocumentSummaryPlugin'
import EditorTheme from './EditorTheme'
import type { SuggestionStatus } from '@/types/autocomplete'

interface EditorProps {
  level: number
  documentSummaryRef: React.RefObject<string>
  planRef: React.RefObject<string>
  writingStyleRef: React.RefObject<string>
  onStatusChange: (status: SuggestionStatus) => void
}

const initialConfig = {
  namespace: 'WritingCopilot',
  theme: EditorTheme,
  nodes: [GhostTextNode],
  onError: (error: Error) => {
    console.error('Lexical error:', error)
  },
}

export default function Editor({ level, documentSummaryRef, planRef, writingStyleRef, onStatusChange }: EditorProps) {
  const ghostKeyRef = useRef<string | null>(null)
  const suggestionRef = useRef<string>('')

  const handleAccepted = useCallback(() => {
    onStatusChange('idle')
  }, [onStatusChange])

  const handleDismissed = useCallback(() => {
    onStatusChange('idle')
  }, [onStatusChange])

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="min-h-[500px] outline-none text-gray-900 text-lg leading-relaxed caret-gray-900"
              aria-label="Document editor"
            />
          }
          placeholder={
            <div className="absolute top-0 left-0 text-gray-400 text-lg leading-relaxed pointer-events-none select-none">
              Start writing your document...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <AutoFocusPlugin />
        <GhostTextPlugin
          ghostKeyRef={ghostKeyRef}
          suggestionRef={suggestionRef}
          onAccepted={handleAccepted}
          onDismissed={handleDismissed}
        />
        <AutocompletePlugin
          level={level}
          documentSummaryRef={documentSummaryRef}
          planRef={planRef}
          writingStyleRef={writingStyleRef}
          ghostKeyRef={ghostKeyRef}
          suggestionRef={suggestionRef}
          onStatusChange={onStatusChange}
        />
        <DocumentSummaryPlugin summaryRef={documentSummaryRef} />
      </div>
    </LexicalComposer>
  )
}
