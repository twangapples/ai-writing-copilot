'use client'

import { useState } from 'react'

interface WritingStyleProps {
  value: string
  onChange: (value: string) => void
  isSummarizing: boolean
}

export function WritingStyle({ value, onChange, isSummarizing }: WritingStyleProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Writing Style</span>
          {!expanded && value && (
            <span className="text-xs text-gray-400 truncate max-w-[140px]">{value}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isSummarizing && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
              Summarizing...
            </span>
          )}
          {!isSummarizing && value && (
            <span className="text-xs text-blue-500 font-medium">Active</span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="p-3 bg-white">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Tell the AI how to write — e.g. 'use concrete examples', 'avoid passive voice', 'be more direct'."
            className="w-full text-sm text-gray-700 placeholder-gray-400 resize-none outline-none leading-relaxed min-h-[80px]"
            rows={3}
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-400">
              {value.length} chars
              {value.length > 300 && ' · will be summarized'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
