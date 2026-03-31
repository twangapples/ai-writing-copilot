'use client'

export type SaveStatus = 'saved' | 'saving' | 'error'

interface SaveIndicatorProps {
  status: SaveStatus
}

export function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === 'saving') {
    return (
      <span className="text-xs text-gray-400 flex items-center gap-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
        Saving...
      </span>
    )
  }
  if (status === 'error') {
    return <span className="text-xs text-red-500">Failed to save</span>
  }
  return null
}
