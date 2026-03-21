export interface AutocompleteContext {
  currentSentence: string
  precedingParagraphs: string
  documentSummary: string
  planText: string
}

export interface LevelConfig {
  maxTokens: number
  stopSequences: string[]
  label: string
}

export type SuggestionStatus = 'idle' | 'loading' | 'ready'
