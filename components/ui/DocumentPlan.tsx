'use client'

import { useState } from 'react'

const MAX_CHARS = 500

interface DocumentPlanProps {
  value: string
  onChange: (value: string) => void
}

export function DocumentPlan({ value, onChange }: DocumentPlanProps) {
  const [expanded, setExpanded] = useState(true)
  const remaining = MAX_CHARS - value.length
  const isNearLimit = remaining < 100

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Document Plan</span>
          {!expanded && value && (
            <span className="text-xs text-gray-400 truncate max-w-xs">{value}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {value && (
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
            onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Describe what you want to write — topic, structure, key arguments, tone. The AI will use this as context for every suggestion."
            className="w-full text-sm text-gray-700 placeholder-gray-400 resize-none outline-none leading-relaxed min-h-[80px]"
            rows={3}
          />
          <div className="flex justify-end mt-1">
            <span className={`text-xs ${isNearLimit ? 'text-orange-500' : 'text-gray-400'}`}>
              {remaining} chars remaining
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
