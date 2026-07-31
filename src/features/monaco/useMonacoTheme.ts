import type * as Monaco from 'monaco-editor';

export function registerMosaicTheme(monaco: typeof Monaco) {
  monaco.editor.defineTheme('mosaic-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      // JSON keys → accent purple
      { token: 'string.key.json',       foreground: 'a78bfa', fontStyle: 'bold' },
      // String values → soft green
      { token: 'string.value.json',     foreground: '86efac' },
      // Numbers → amber
      { token: 'number',                foreground: 'fbbf24' },
      // Booleans (true/false) → cyan
      { token: 'keyword.json',          foreground: '67e8f9' },
      // null → rose
      { token: 'keyword.null.json',     foreground: 'fda4af' },
      // Brackets / delimiters → slate
      { token: 'delimiter.bracket.json', foreground: '64748b' },
      { token: 'delimiter.comma.json',   foreground: '64748b' },
      { token: 'delimiter.colon.json',   foreground: '64748b' },
    ],
    colors: {
      'editor.background':               '#070a12',
      'editor.foreground':               '#e2e8f0',
      'editorLineNumber.foreground':     '#334155',
      'editorLineNumber.activeForeground': '#a78bfa',
      'editor.lineHighlightBackground':  '#172033',
      'editorCursor.foreground':         '#a78bfa',
      'editor.selectionBackground':      '#8b5cf640',
      'editor.inactiveSelectionBackground': '#8b5cf620',
      'editorIndentGuide.background1':   '#172033',
      'editorIndentGuide.activeBackground1': '#334155',
      'editorBracketMatch.background':   '#a78bfa30',
      'editorBracketMatch.border':       '#a78bfa',
      'scrollbarSlider.background':      '#33414d60',
      'scrollbarSlider.hoverBackground': '#4b5e7080',
      'minimap.background':              '#070a12',
      'editorWidget.background':         '#0d1320',
      'editorSuggestWidget.background':  '#0d1320',
      'editorSuggestWidget.border':      '#1e2a3d',
      'editorSuggestWidget.selectedBackground': '#a78bfa30',
      'editorHoverWidget.background':    '#0d1320',
      'editorHoverWidget.border':        '#1e2a3d',
      'input.background':                '#0d1320',
    },
  });
}
