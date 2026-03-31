import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDocument } from '@/lib/documents/queries'
import WritingApp from '@/components/WritingApp'

export default async function DocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const doc = await getDocument(supabase, id)
  if (!doc) notFound()
  return <WritingApp initialDoc={doc} />
}
