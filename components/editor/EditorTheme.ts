import type { EditorThemeClasses } from 'lexical'

const theme: EditorThemeClasses = {
  paragraph: 'mb-4 last:mb-0',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
  heading: {
    h1: 'text-3xl font-bold mb-4',
    h2: 'text-2xl font-semibold mb-3',
    h3: 'text-xl font-semibold mb-2',
  },
}

export default theme
