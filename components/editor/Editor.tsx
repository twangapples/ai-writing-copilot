'use client'

import { useRef, useCallback, useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
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
import type { LexicalEditor } from 'lexical'
import type { SuggestionStatus } from '@/types/autocomplete'

// Internal plugin that fires onEditorReady once the editor is mounted
function EditorReadyPlugin({ onEditorReady }: { onEditorReady: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    onEditorReady(editor)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

interface EditorProps {
  level: number
  documentSummaryRef: React.RefObject<string>
  planRef: React.RefObject<string>
  writingStyleRef: React.RefObject<string>
  initialEditorState?: string | null
  onEditorReady?: (editor: LexicalEditor) => void
  onStatusChange: (status: SuggestionStatus) => void
}

export default function Editor({ level, documentSummaryRef, planRef, writingStyleRef, initialEditorState, onEditorReady, onStatusChange }: EditorProps) {
  const ghostKeyRef = useRef<string | null>(null)
  const suggestionRef = useRef<string>('')

  const initialConfig = {
    namespace: 'WritingCopilot',
    theme: EditorTheme,
    nodes: [GhostTextNode],
    editorState: initialEditorState ?? undefined,
    onError: (error: Error) => {
      console.error('Lexical error:', error)
    },
  }

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
        {onEditorReady && <EditorReadyPlugin onEditorReady={onEditorReady} />}
      </div>
    </LexicalComposer>
  )
}
