'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createDocument, deleteDocument } from '@/lib/documents/queries'
import { DocCard } from './DocCard'
import type { Document } from '@/lib/documents/queries'

interface DocGridProps {
  initialDocs: Document[]
}

export function DocGrid({ initialDocs }: DocGridProps) {
  const router = useRouter()
  const [docs, setDocs] = useState(initialDocs)
  const [creating, setCreating] = useState(false)

  async function handleNew() {
    setCreating(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const doc = await createDocument(supabase, user.id)
      router.push(`/doc/${doc.id}`)
    } catch {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id))
    try {
      const supabase = createClient()
      await deleteDocument(supabase, id)
    } catch {
      // Revert optimistic delete on error
      setDocs(initialDocs)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">AI Writing Copilot</h1>
          <button
            onClick={handleNew}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {creating ? 'Creating...' : 'New document'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {docs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm mb-4">No documents yet</p>
            <button
              onClick={handleNew}
              disabled={creating}
              className="text-blue-600 text-sm font-medium hover:underline disabled:opacity-50"
            >
              Create your first document
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-sm font-medium text-gray-500 mb-4">Recent documents</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {docs.map((doc) => (
                <DocCard key={doc.id} doc={doc} onDelete={handleDelete} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
