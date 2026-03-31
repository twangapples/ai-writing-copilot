'use client'

import Link from 'next/link'
import type { Document } from '@/lib/documents/queries'

interface DocCardProps {
  doc: Document
  onDelete: (id: string) => void
}

function formatDate(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function DocCard({ doc, onDelete }: DocCardProps) {
  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (confirm(`Delete "${doc.title}"?`)) {
      onDelete(doc.id)
    }
  }

  return (
    <Link
      href={`/doc/${doc.id}`}
      className="group relative flex flex-col border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all bg-white"
    >
      {/* Doc icon */}
      <div className="w-8 h-10 bg-blue-50 border border-blue-100 rounded mb-3 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>

      <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
      <p className="text-xs text-gray-400 mt-1">Edited {formatDate(doc.updated_at)}</p>

      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 text-gray-400 transition-all"
        aria-label="Delete document"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </Link>
  )
}
