'use client'

import { getLevelConfig } from '@/lib/autocomplete/levelConfig'

interface LevelSliderProps {
  level: number
  onChange: (level: number) => void
}

export function LevelSlider({ level, onChange }: LevelSliderProps) {
  const config = getLevelConfig(level)

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 whitespace-nowrap">Word</span>
      <input
        type="range"
        min={1}
        max={10}
        value={level}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 accent-blue-500"
        aria-label="Autocomplete level"
      />
      <span className="text-xs text-gray-500 whitespace-nowrap">Multi-paragraph</span>
      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded whitespace-nowrap">
        {config.label}
      </span>
    </div>
  )
}
