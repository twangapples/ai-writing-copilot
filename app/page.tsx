import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listDocuments } from '@/lib/documents/queries'
import { DocGrid } from '@/components/home/DocGrid'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const docs = await listDocuments(supabase, user.id)
  return <DocGrid initialDocs={docs} />
}
