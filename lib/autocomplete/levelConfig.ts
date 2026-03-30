import type { LevelConfig } from '@/types/autocomplete'

const LEVEL_CONFIG: Record<number, LevelConfig> = {
  1:  { maxTokens: 4,   stopSequences: [' ', ',', '.'],       label: 'Word' },
  2:  { maxTokens: 6,   stopSequences: [',', '.'],            label: 'Word+' },
  3:  { maxTokens: 10,  stopSequences: ['.', '!', '?'],       label: 'Phrase' },
  4:  { maxTokens: 15,  stopSequences: ['.', '!', '?'],       label: 'Sentence finish' },
  5:  { maxTokens: 20,  stopSequences: ['.', '!', '?'],       label: 'Sentence' },
  6:  { maxTokens: 28,  stopSequences: ['.', '!', '?'],       label: 'Full sentence' },
  7:  { maxTokens: 25,  stopSequences: [],                    label: '1 sentence' },
  8:  { maxTokens: 38,  stopSequences: [],                    label: '1–2 sentences' },
  9:  { maxTokens: 50,  stopSequences: [],                    label: '2 sentences' },
  10: { maxTokens: 100, stopSequences: ['\n\n'],              label: 'Paragraph' },
}

export function getLevelConfig(level: number): LevelConfig {
  const clamped = Math.max(1, Math.min(10, Math.round(level)))
  return LEVEL_CONFIG[clamped]
}
