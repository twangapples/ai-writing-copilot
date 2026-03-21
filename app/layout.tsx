import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Writing Copilot',
  description: 'Write faster with AI-powered inline autocomplete',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
