'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $getNodeByKey,
  $insertNodes,
} from 'lexical'
import type { EditorState } from 'lexical'
import { $isGhostTextNode, $createGhostTextNode } from './GhostTextNode'
import type { AutocompleteContext, SuggestionStatus } from '@/types/autocomplete'

const DEBOUNCE_MS = 420
// Only trigger after the user has paused at a word boundary
const WORD_BOUNDARY_CHARS = new Set([' ', ',', '.', '!', '?', '\n', ':', ';', '—'])

interface AutocompletePluginProps {
  level: number
  documentSummaryRef: React.RefObject<string>
  planRef: React.RefObject<string>
  ghostKeyRef: React.RefObject<string | null>
  suggestionRef: React.RefObject<string>
  onStatusChange: (status: SuggestionStatus) => void
}

function extractContext(
  editorState: EditorState,
  summaryRef: React.RefObject<string>,
  planRef: React.RefObject<string>,
): AutocompleteContext | null {
  return editorState.read(() => {
    const root = $getRoot()
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return null

    const children = root.getChildren()
    const anchorNode = selection.anchor.getNode()
    const topLevel = anchorNode.getTopLevelElement()
    if (!topLevel) return null

    const cursorParagraphIndex = children.indexOf(topLevel)
    if (cursorParagraphIndex === -1) return null

    const fullText = topLevel.getTextContent()
    const anchorOffset = selection.anchor.offset
    const anchorNodeText = anchorNode.getTextContent()
    const anchorNodeInParagraph = fullText.indexOf(anchorNodeText)
    const cursorPos = anchorNodeInParagraph >= 0
      ? anchorNodeInParagraph + anchorOffset
      : anchorOffset
    const currentSentence = fullText.slice(0, cursorPos)

    if (currentSentence.trim().length < 8) return null

    const startIndex = Math.max(0, cursorParagraphIndex - 2)
    const precedingParagraphs = children
      .slice(startIndex, cursorParagraphIndex)
      .map((n) => n.getTextContent())
      .filter(Boolean)
      .join('\n\n')

    return {
      currentSentence,
      precedingParagraphs,
      documentSummary: summaryRef.current,
      planText: planRef.current,
    }
  })
}

function dismissGhostNode(
  editor: ReturnType<typeof useLexicalComposerContext>[0],
  ghostKeyRef: React.RefObject<string | null>,
) {
  const key = ghostKeyRef.current
  if (!key) return
  editor.update(() => {
    const node = $getNodeByKey(key)
    if (node && $isGhostTextNode(node)) node.remove()
  })
  ghostKeyRef.current = null
}

export function AutocompletePlugin({
  level,
  documentSummaryRef,
  planRef,
  ghostKeyRef,
  suggestionRef,
  onStatusChange,
}: AutocompletePluginProps) {
  const [editor] = useLexicalComposerContext()
  const abortRef = useRef<AbortController | null>(null)
  const cursorVersionRef = useRef(0)
  const isInsertingGhostRef = useRef(false)
  const levelRef = useRef(level)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Tracks the current sentence before each update, used for prefix matching
  const prevCurrentSentenceRef = useRef('')

  useEffect(() => {
    levelRef.current = level
  }, [level])

  const triggerAutocomplete = useCallback(
    async (context: AutocompleteContext, capturedVersion: number) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      onStatusChange('loading')

      try {
        const res = await fetch('/api/autocomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context, level: levelRef.current }),
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          onStatusChange('idle')
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''
        let ghostInserted = false

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (controller.signal.aborted) break
          if (cursorVersionRef.current !== capturedVersion) {
            reader.cancel()
            break
          }

          accumulated += decoder.decode(value, { stream: true })
          if (!accumulated.trim()) continue

          if (!ghostInserted) {
            isInsertingGhostRef.current = true
            editor.update(
              () => {
                const existingKey = ghostKeyRef.current
                if (existingKey) {
                  const existing = $getNodeByKey(existingKey)
                  if (existing && $isGhostTextNode(existing)) existing.remove()
                }
                const selection = $getSelection()
                if (!$isRangeSelection(selection)) return
                const ghostNode = $createGhostTextNode(accumulated)
                $insertNodes([ghostNode])
                ghostKeyRef.current = ghostNode.getKey()
                suggestionRef.current = accumulated
              },
              { onUpdate: () => { isInsertingGhostRef.current = false } },
            )
            ghostInserted = true
          } else {
            const key = ghostKeyRef.current
            if (key) {
              isInsertingGhostRef.current = true
              editor.update(
                () => {
                  const node = $getNodeByKey(key)
                  if (node && $isGhostTextNode(node)) {
                    node.setSuggestion(accumulated)
                    suggestionRef.current = accumulated
                  }
                },
                { onUpdate: () => { isInsertingGhostRef.current = false } },
              )
            }
          }
        }

        if (cursorVersionRef.current === capturedVersion && accumulated.trim()) {
          onStatusChange('ready')
        } else {
          onStatusChange('idle')
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Autocomplete error:', err)
        }
        onStatusChange('idle')
      }
    },
    [editor, ghostKeyRef, suggestionRef, onStatusChange],
  )

  useEffect(() => {
    return editor.registerUpdateListener(({ dirtyLeaves, dirtyElements }) => {
      if (isInsertingGhostRef.current) return
      if (dirtyLeaves.size === 0 && dirtyElements.size === 0) return

      const editorState = editor.getEditorState()
      const newContext = extractContext(editorState, documentSummaryRef, planRef)

      // ── Prefix matching ──────────────────────────────────────────────────
      // If the user typed a character that matches the start of the current
      // suggestion, advance the ghost text instead of dismissing it.
      const currentSuggestion = suggestionRef.current
      if (currentSuggestion && ghostKeyRef.current && newContext) {
        const typed = newContext.currentSentence.slice(prevCurrentSentenceRef.current.length)
        // Only attempt prefix match for short typed strings (1-3 chars, not paste)
        if (typed.length > 0 && typed.length <= 3 && currentSuggestion.startsWith(typed)) {
          const remaining = currentSuggestion.slice(typed.length)
          prevCurrentSentenceRef.current = newContext.currentSentence

          if (remaining) {
            // Update ghost node to show only the remaining suggestion
            const key = ghostKeyRef.current
            isInsertingGhostRef.current = true
            editor.update(
              () => {
                const node = $getNodeByKey(key)
                if (node && $isGhostTextNode(node)) {
                  node.setSuggestion(remaining)
                  suggestionRef.current = remaining
                }
              },
              { onUpdate: () => { isInsertingGhostRef.current = false } },
            )
            return // Don't dismiss, don't debounce
          } else {
            // User typed the entire suggestion — clean up and fall through to debounce
            dismissGhostNode(editor, ghostKeyRef)
            suggestionRef.current = ''
            onStatusChange('idle')
            prevCurrentSentenceRef.current = newContext.currentSentence
            // Let the word-boundary check below decide whether to trigger again
          }
        }
      }
      // ────────────────────────────────────────────────────────────────────

      cursorVersionRef.current++
      const capturedVersion = cursorVersionRef.current

      dismissGhostNode(editor, ghostKeyRef)
      suggestionRef.current = ''
      onStatusChange('idle')

      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()

      prevCurrentSentenceRef.current = newContext?.currentSentence ?? ''

      if (!newContext) return

      // ── Word boundary check ───────────────────────────────────────────────
      // Only trigger autocomplete when the cursor is at a natural word boundary,
      // not mid-word. This avoids suggestions like completing "climat" → "e".
      const lastChar = newContext.currentSentence.at(-1) ?? ''
      if (!WORD_BOUNDARY_CHARS.has(lastChar)) return
      // ────────────────────────────────────────────────────────────────────

      debounceRef.current = setTimeout(() => {
        triggerAutocomplete(newContext, capturedVersion)
      }, DEBOUNCE_MS)
    })
  }, [editor, ghostKeyRef, suggestionRef, documentSummaryRef, planRef, onStatusChange, triggerAutocomplete])

  return null
}
