// filepath: src/codemirror-setup/basic-setup.ts
// 코드 하이라이팅 기능 완전 삭제 버전

import {
  EditorView, KeyBinding, lineNumbers, highlightActiveLineGutter,
  highlightSpecialChars, drawSelection, dropCursor, rectangularSelection,
  crosshairCursor, highlightActiveLine, keymap
} from "@codemirror/view";
import { EditorState, Extension } from "@codemirror/state";
import { history, defaultKeymap, historyKeymap, indentWithTab } from "@codemirror/commands";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap, Completion } from "@codemirror/autocomplete";
import { foldGutter, codeFolding, indentOnInput, syntaxHighlighting, defaultHighlightStyle, HighlightStyle, bracketMatching, foldKeymap, indentUnit } from "@codemirror/language";
import { lintKeymap } from "@codemirror/lint";
import { tags } from "@lezer/highlight";
import { markdown } from "@codemirror/lang-markdown";
import { GFM } from "@lezer/markdown";
import { vim } from "@replit/codemirror-vim";

import { MarkdownMathExtension } from "./markdown-parser";
// 🔽 codeLanguages import가 삭제되었습니다.
import { defaultThemeOption, defaultLightThemeOption, defaultDarkThemeOption } from "./theme";
import { decorationsExtension } from "./decorations";
import { type BasicSetupOptions } from "./interfaces";

const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

export const customLineNumbers = lineNumbers();
export const customCodeFolding = [foldGutter({ openText: "▾", closedText: "▸" }), codeFolding({ placeholderText: "* click to edit *" })] as const;

// 🔽 이 부분이 수정되었습니다. codeLanguages 옵션이 삭제되었습니다.
export const customMarkdown = markdown({ extensions: [GFM, ...MarkdownMathExtension] });
// 🔼 수정 완료

export const customSyntaxHighlighting = (darkMode: boolean) => {
  const extension1 = syntaxHighlighting(defaultHighlightStyle, { fallback: false });
  const highlightStyle = HighlightStyle.define([{ tag: [tags.atom, tags.bool, tags.url, tags.contentSeparator, tags.labelName], color: darkMode ? "#8080FF" : "#4960FF" }]);
  const extension2 = syntaxHighlighting(highlightStyle, { fallback: false });
  return [extension1, extension2] as const;
};
export const customSpellCheck = EditorView.contentAttributes.of({ spellcheck: "true" });

export const basicSetupOptionsDef: BasicSetupOptions = {
  readOnly: false, lineNumbers: false, lineWrapping: true, darkMode: false,
  keyMap: "sublime", foldGutter: false, autocapitalize: true,
  highlightActiveLineGutter: false, highlightSpecialChars: true, history: true,
  drawSelection: true, dropCursor: true, allowMultipleSelections: false,
  indentOnInput: false, syntaxHighlighting: true, bracketMatching: false,
  closeBrackets: true, autocompletion: true, rectangularSelection: true,
  crosshairCursor: true, highlightActiveLine: false, highlightSelectionMatches: true,
  closeBracketsKeymap: true, defaultKeymap: true, searchKeymap: true,
  historyKeymap: true, foldKeymap: true, completionKeymap: true,
  lintKeymap: true, inlineRenderingActive: true, batchChangesActive: false,
  spellcheck: true,
};

export const basicSetup = (options: Partial<BasicSetupOptions> = {}): Extension[] => {
  const finalOptions = { ...basicSetupOptionsDef, ...options };
  const extensions: Extension[] = [];
  const keymaps: KeyBinding[][] = [];

  if (finalOptions.keyMap === "vim") {
    extensions.push(vim());
  } else {
    if (finalOptions.closeBracketsKeymap) keymaps.push([...closeBracketsKeymap]);
    if (finalOptions.defaultKeymap) keymaps.push([...defaultKeymap]);
    if (finalOptions.searchKeymap) keymaps.push([...searchKeymap]);
    if (finalOptions.historyKeymap) keymaps.push([...historyKeymap]);
    if (finalOptions.foldKeymap) keymaps.push([...foldKeymap]);
    if (finalOptions.completionKeymap) keymaps.push([...completionKeymap]);
    if (finalOptions.lintKeymap) keymaps.push([...lintKeymap]);
    
    if (finalOptions.onSave) {
      keymaps.push([
        { 
          key: "Mod-s", 
          preventDefault: true, 
          run: () => { 
            finalOptions.onSave?.();
            return true; 
          } 
        },
      ]);
    }

    extensions.push(keymap.of([indentWithTab, ...keymaps.flat()]));
  }

  const fontSize: string = isIOS ? "16px" : "14px";
  const paddingTop = typeof finalOptions.cmContentPaddingTop === 'number' ? finalOptions.cmContentPaddingTop : 50;
  extensions.push(defaultThemeOption(paddingTop, fontSize));

  if (finalOptions.darkMode) {
    extensions.push(defaultDarkThemeOption);
  } else {
    extensions.push(defaultLightThemeOption);
  }

  if (finalOptions.lineNumbers) extensions.push(customLineNumbers);
  if (finalOptions.highlightActiveLineGutter) extensions.push(highlightActiveLineGutter());
  if (finalOptions.highlightSpecialChars) extensions.push(highlightSpecialChars());
  if (finalOptions.history) extensions.push(history());
  if (finalOptions.foldGutter) extensions.push(customCodeFolding as unknown as Extension);
  if (finalOptions.drawSelection) extensions.push(drawSelection());
  if (finalOptions.dropCursor) extensions.push(dropCursor());
  if (finalOptions.allowMultipleSelections) extensions.push(EditorState.allowMultipleSelections.of(true));
  if (finalOptions.indentOnInput) extensions.push(indentOnInput());
  if (finalOptions.syntaxHighlighting) extensions.push(customSyntaxHighlighting(finalOptions.darkMode) as unknown as Extension);
  if (finalOptions.bracketMatching) extensions.push(bracketMatching());
  if (finalOptions.closeBrackets) extensions.push(closeBrackets());
  if (finalOptions.autocompletion) extensions.push(autocompletion({ optionClass: (c: Completion) => c.type ? "" : "auto-complete-option-noicon" }));
  if (finalOptions.rectangularSelection) extensions.push(rectangularSelection());
  if (finalOptions.crosshairCursor) extensions.push(crosshairCursor());
  if (finalOptions.highlightActiveLine) extensions.push(highlightActiveLine());
  if (finalOptions.highlightSelectionMatches) extensions.push(highlightSelectionMatches());
  if (finalOptions.readOnly) extensions.push(EditorState.readOnly.of(true));
  if (finalOptions.autocapitalize) extensions.push(EditorView.contentAttributes.of({ autocapitalize: "on" }));
  if (finalOptions.spellcheck) extensions.push(customSpellCheck);
  if (finalOptions.tabSize) extensions.push(indentUnit.of("".padEnd(finalOptions.tabSize, " ")));
  
  extensions.push(customMarkdown);
  extensions.push(decorationsExtension);

  if (finalOptions.lineWrapping) {
    extensions.push(EditorView.lineWrapping);
  }
  
  return extensions.filter(Boolean);
};