// filepath: src/codemirror-setup/interfaces.ts

export interface BasicSetupOptions {
  readOnly: boolean;
  lineNumbers: boolean;
  lineWrapping: boolean;
  darkMode: boolean;
  keyMap: 'sublime' | 'vim';
  foldGutter: boolean;
  autocapitalize: boolean;
  highlightActiveLineGutter: boolean;
  highlightSpecialChars: boolean;
  history: boolean;
  drawSelection: boolean;
  dropCursor: boolean;
  allowMultipleSelections: boolean;
  indentOnInput: boolean;
  syntaxHighlighting: boolean;
  bracketMatching: boolean;
  closeBrackets: boolean;
  autocompletion: boolean;
  rectangularSelection: boolean;
  crosshairCursor: boolean;
  highlightActiveLine: boolean;
  highlightSelectionMatches: boolean;
  closeBracketsKeymap: boolean;
  defaultKeymap: boolean;
  searchKeymap: boolean;
  historyKeymap: boolean;
  foldKeymap: boolean;
  completionKeymap: boolean;
  lintKeymap: boolean;
  inlineRenderingActive: boolean;
  batchChangesActive: boolean;
  spellcheck: boolean;
  tabSize?: number;
  cmContentPaddingTop?: number;
  onSave?: () => void;
}