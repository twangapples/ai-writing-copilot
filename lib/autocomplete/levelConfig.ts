import type { LevelConfig } from '@/types/autocomplete'

const LEVEL_CONFIG: Record<number, LevelConfig> = {
  1:  { maxTokens: 8,   stopSequences: [' ', ',', '.'],           label: 'Word' },
  2:  { maxTokens: 12,  stopSequences: [',', '.'],                label: 'Word+' },
  3:  { maxTokens: 20,  stopSequences: ['.', '!', '?'],           label: 'Phrase' },
  4:  { maxTokens: 35,  stopSequences: ['.', '!', '?'],           label: 'Half sentence' },
  5:  { maxTokens: 50,  stopSequences: ['.', '!', '?', '\n'],     label: 'Sentence' },
  6:  { maxTokens: 75,  stopSequences: ['\n'],                    label: 'Sentence+' },
  7:  { maxTokens: 120, stopSequences: ['\n\n'],                  label: '2 sentences' },
  8:  { maxTokens: 180, stopSequences: ['\n\n'],                  label: '3 sentences' },
  9:  { maxTokens: 250, stopSequences: ['\n\n'],                  label: 'Paragraph' },
  10: { maxTokens: 400, stopSequences: [],                        label: 'Multi-paragraph' },
}

export function getLevelConfig(level: number): LevelConfig {
  const clamped = Math.max(1, Math.min(10, Math.round(level)))
  return LEVEL_CONFIG[clamped]
}
