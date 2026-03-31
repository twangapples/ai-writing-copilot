import type { SupabaseClient } from '@supabase/supabase-js'

export interface Document {
  id: string
  user_id: string
  title: string
  content: object | null
  plan: string
  writing_style: string
  level: number
  created_at: string
  updated_at: string
}

export async function listDocuments(supabase: SupabaseClient, userId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getDocument(supabase: SupabaseClient, id: string): Promise<Document | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function createDocument(supabase: SupabaseClient, userId: string): Promise<Document> {
  const { data, error } = await supabase
    .from('documents')
    .insert({ user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateDocument(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Pick<Document, 'title' | 'content' | 'plan' | 'writing_style' | 'level'>>
): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update(patch)
    .eq('id', id)
  if (error) throw error
}

export async function deleteDocument(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
  if (error) throw error
}
