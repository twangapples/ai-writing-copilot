export interface AutocompleteContext {
  currentSentence: string
  precedingParagraphs: string
  documentSummary: string
  planText: string
  styleExamples: string
  styleText: string
}

export interface LevelConfig {
  maxTokens: number
  stopSequences: string[]
  label: string
}

export type SuggestionStatus = 'idle' | 'loading' | 'ready'
