'use client'

import type { SuggestionStatus } from '@/types/autocomplete'

interface StatusBarProps {
  status: SuggestionStatus
}

export function StatusBar({ status }: StatusBarProps) {
  return (
    <div className="h-5 flex items-center">
      {status === 'loading' && (
        <span className="text-xs text-gray-400 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
          Thinking...
        </span>
      )}
      {status === 'ready' && (
        <span className="text-xs text-gray-400">
          Press <kbd className="px-1 py-0.5 rounded bg-gray-100 border border-gray-300 text-gray-600 font-mono text-[10px]">Tab</kbd> to accept
        </span>
      )}
      {status === 'limit' && (
        <span className="text-xs text-amber-500">
          Daily limit reached — come back tomorrow
        </span>
      )}
    </div>
  )
}
