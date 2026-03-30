# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Editor**: Lexical (`lexical`, `@lexical/react`)
- **AI**: OpenAI GPT-4o mini via `openai` SDK
- **Styles**: Tailwind CSS v4

## Commands
```bash
npm run dev          # start dev server
npm run build        # production build
npm run type-check   # tsc --noEmit
npm run lint         # next lint
```

## Architecture

The app is a single-page writing editor with real-time inline ghost-text autocomplete (like GitHub Copilot). The core data flow is:

1. User types → `AutocompletePlugin` debounces (420ms) at word boundaries → calls `/api/autocomplete` → streams tokens back → inserts a `GhostTextNode` inline
2. Tab accepts the ghost text (replaces with real `TextNode`), Escape dismisses it
3. Context for each completion is layered: Document Plan → auto-summary of the full doc → preceding 2 paragraphs → current sentence up to cursor

### API route (`app/api/autocomplete/route.ts`)
Edge runtime. Three modes dispatched by `body.mode`:
- Default (omitted): streaming autocomplete — returns a `ReadableStream` of raw text tokens
- `summarize`: one-sentence summary of the full document body (JSON)
- `summarize-plan`: compress a long Document Plan to <80-word bullets (JSON)

**Important**: `new OpenAI()` is instantiated inside the handler, not at module level — avoids build-time errors when the env var isn't available during static page collection.

### Ghost text lifecycle
`GhostTextNode` (`components/editor/GhostTextNode.ts`) is a Lexical `DecoratorNode` that renders inline as a grey `<span>`. Critical properties:
- `getTextContent()` returns `''` — ghost text is invisible to the document model (copy/paste, export, serialization)
- `contentEditable="false"` on the DOM span — prevents the browser caret from appearing inside/after the ghost
- `$insertNodes` advances the selection past the inserted node, so `AutocompletePlugin` explicitly restores the cursor to `prevSibling.selectEnd()` after insertion

`GhostTextPlugin` (`components/editor/GhostTextPlugin.tsx`) registers `COMMAND_PRIORITY_HIGH` handlers:
- **Tab**: replaces the ghost node with a real `TextNode`, moves cursor to end
- **Escape**: removes the ghost node entirely

### Plan auto-summarization (`WritingApp.tsx`)
If the Document Plan exceeds 300 chars, `WritingApp` debounces 1500ms then calls `/api/autocomplete` with `mode: 'summarize-plan'` and stores the result in `planRef`. Plans ≤ 300 chars are passed through directly. This keeps prompt context compact without truncating the user's plan.

### Document auto-summary (`DocumentSummaryPlugin.tsx`)
Triggers 5s after the editor settles (once doc ≥ 200 chars), with a 30s cooldown between API calls. Calls `mode: 'summarize'` and writes the result to `summaryRef` for use by `AutocompletePlugin`. Silently ignores errors.

### Prefix matching in `AutocompletePlugin`
When the user types 1–3 chars that match the start of the current ghost suggestion (and it's not a paste), the plugin trims the ghost text rather than dismissing and re-requesting. This lets users "type through" suggestions seamlessly.

### Preventing feedback loops
Two guards in `AutocompletePlugin`:
- **`isInsertingGhostRef`**: set `true` before `editor.update()` for ghost ops, cleared in `onUpdate` — stops the update listener from treating ghost insertion as a user keystroke
- **`cursorVersionRef`**: increments on every real keystroke; streaming chunks check `cursorVersionRef.current === capturedVersion` before mutating the editor, discarding stale responses

### Refs over state for plugin data
`planRef`, `documentSummaryRef`, `ghostKeyRef`, `suggestionRef` are all `useRef` — Lexical plugins always read the latest value without re-registering listeners or triggering re-renders. These are passed down from `WritingApp` and synced from state via `useEffect`.

### Level config (`lib/autocomplete/levelConfig.ts`)
Stop sequences are the primary control. Levels 4–6 use `.!?` (guaranteed one sentence). Levels 7–9 use no stop sequences with tight token caps (~25–50). Level 10 uses `\n\n` for a paragraph.

## Environment
```
OPENAI_API_KEY=...   # in .env.local
```