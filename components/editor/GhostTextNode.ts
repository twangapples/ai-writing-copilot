import {
  DecoratorNode,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical'
import { createElement } from 'react'

export type SerializedGhostTextNode = Spread<
  { suggestion: string },
  SerializedLexicalNode
>

export class GhostTextNode extends DecoratorNode<React.ReactElement> {
  __suggestion: string

  static getType(): string {
    return 'ghost-text'
  }

  static clone(node: GhostTextNode): GhostTextNode {
    return new GhostTextNode(node.__suggestion, node.__key)
  }

  constructor(suggestion: string, key?: NodeKey) {
    super(key)
    this.__suggestion = suggestion
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span')
    span.setAttribute('data-ghost-text', 'true')
    return span
  }

  updateDOM(): boolean {
    return false
  }

  isInline(): boolean {
    return true
  }

  isKeyboardSelectable(): boolean {
    return false
  }

  getTextContent(): string {
    return ''
  }

  exportJSON(): SerializedGhostTextNode {
    return {
      type: 'ghost-text',
      version: 1,
      suggestion: '',
    }
  }

  static importJSON(): GhostTextNode {
    return new GhostTextNode('')
  }

  setSuggestion(suggestion: string): this {
    const writable = this.getWritable()
    writable.__suggestion = suggestion
    return writable
  }

  decorate(): React.ReactElement {
    return createElement(
      'span',
      {
        style: {
          color: '#9ca3af',
          pointerEvents: 'none',
          userSelect: 'none',
        },
        'aria-hidden': 'true',
        'data-ghost-suggestion': 'true',
      },
      this.__suggestion,
    )
  }
}

export function $createGhostTextNode(suggestion: string): GhostTextNode {
  return new GhostTextNode(suggestion)
}

export function $isGhostTextNode(node: LexicalNode | null | undefined): node is GhostTextNode {
  return node instanceof GhostTextNode
}
