'use client'

import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getNodeByKey,
  $createTextNode,
  COMMAND_PRIORITY_HIGH,
  KEY_TAB_COMMAND,
  KEY_ESCAPE_COMMAND,
} from 'lexical'
import { $isGhostTextNode } from './GhostTextNode'

interface GhostTextPluginProps {
  ghostKeyRef: React.RefObject<string | null>
  suggestionRef: React.RefObject<string>
  onAccepted: () => void
  onDismissed: () => void
}

export function GhostTextPlugin({
  ghostKeyRef,
  suggestionRef,
  onAccepted,
  onDismissed,
}: GhostTextPluginProps) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // Tab → accept suggestion
    const unregisterTab = editor.registerCommand(
      KEY_TAB_COMMAND,
      (e: KeyboardEvent) => {
        const key = ghostKeyRef.current
        if (!key) return false
        e.preventDefault()
        const suggestion = suggestionRef.current
        editor.update(() => {
          const ghostNode = $getNodeByKey(key)
          if (!ghostNode || !$isGhostTextNode(ghostNode)) return
          const textNode = $createTextNode(suggestion)
          ghostNode.replace(textNode)
          textNode.selectEnd()
        })
        ghostKeyRef.current = null
        suggestionRef.current = ''
        onAccepted()
        return true
      },
      COMMAND_PRIORITY_HIGH,
    )

    // Escape → dismiss suggestion
    const unregisterEsc = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        const key = ghostKeyRef.current
        if (!key) return false
        editor.update(() => {
          const ghostNode = $getNodeByKey(key)
          if (ghostNode && $isGhostTextNode(ghostNode)) ghostNode.remove()
        })
        ghostKeyRef.current = null
        suggestionRef.current = ''
        onDismissed()
        return true
      },
      COMMAND_PRIORITY_HIGH,
    )

    return () => {
      unregisterTab()
      unregisterEsc()
    }
  }, [editor, ghostKeyRef, suggestionRef, onAccepted, onDismissed])

  return null
}
