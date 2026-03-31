'use client'

interface DocTitleProps {
  value: string
  onChange: (value: string) => void
}

export function DocTitle({ value, onChange }: DocTitleProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm font-medium text-gray-900 bg-transparent border-none outline-none w-64 truncate focus:ring-1 focus:ring-blue-200 rounded px-1 -mx-1"
      aria-label="Document title"
    />
  )
}
