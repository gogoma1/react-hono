// filepath: src/codemirror-setup/markdown-parser/inline-latex-config.ts

import { MarkdownConfig, InlineContext } from "@lezer/markdown";
import {
  inlineMathTag,
  latexTag,
  contentTag,
  delimiterBraceTag,
  reNewTheorem,
  reNewTheoremNumbered,
  reNewTheoremNumbered2,
  reNewTheoremUnNumbered,
  reTheoremStyle,
  reNewCommandQedSymbol,
  reSetCounter
} from "./consts";
import { wrappedTeXParser } from "./wrapped-TeXParser";
// 🔽 이 부분이 올바르게 되어 있는지 확인합니다.
import { findEndMarker } from "../helpers";
// 🔼 이 부분이 올바르게 되어 있는지 확인합니다.

export const inlineLatexConfig: MarkdownConfig = {
  defineNodes: [
    {
      name: "inlineTitle",
      style: inlineMathTag
    },
    {
      name: "inlineAuthor",
      style: inlineMathTag
    },
    {
      name: "inlineNewTheorem",
      style: inlineMathTag
    },
    {
      name: "inlineTheoremStyle",
      style: inlineMathTag
    },
    {
      name: "inlineSetCounter",
      style: inlineMathTag
    },
    {
      name: "inlineNewCommandQedSymbol",
      style: inlineMathTag
    },
    {
      name: "inlineLatexContent",
      style: inlineMathTag
    },
    {
      name: "inlineTextTypes",
      style: inlineMathTag
    },
    {
      name: "inlineLatexCommand",
      style: latexTag
    },
    {
      name: "inlineLatexBrace",
      style: delimiterBraceTag
    },
    {
      name: "inlineTextContent",
      style: contentTag
    }
  ],
  parseInline: [{
    name: "inlineTitle",
    after: 'InlineCode',
    parse(cx: InlineContext, next: number, pos: number): number {
      if (next !== 92 /* \ */) {
        return -1;
      }
      const src = cx.text.slice(pos - cx.offset);
      if (!src) {
        return -1;
      }
      let startMathPos = pos;
      const pickTag: RegExp = /\\(?:title\{([^}]*)\}|section\*?\{([^}]*)\}|subsection\*?\{([^}]*)\}|subsubsection\*?\{([^}]*)\})/;
      const match = src.match(pickTag);
      const contentMatch = match?.find((submatch, i) => i > 0 && submatch !== undefined);
      if (!match || contentMatch === undefined) {
        return -1;
      }
      const endMarkerPos = startMathPos + match[0].length;
      const contentStartPos = endMarkerPos - contentMatch.length - 1;
      const contentEndPos = endMarkerPos - 1;
      const commandElem = cx.elt('inlineLatexCommand', startMathPos, contentStartPos - 1);
      const brace1Elem = cx.elt('inlineLatexBrace', contentStartPos - 1, contentStartPos);
      const brace2Elem = cx.elt('inlineLatexBrace', contentEndPos, endMarkerPos);
      const contentElem = cx.elt("inlineTextContent", contentStartPos, contentEndPos);
      return cx.addElement(cx.elt("inlineTitle", startMathPos, endMarkerPos, [
        commandElem, brace1Elem, contentElem, brace2Elem
      ]));
    }
  },
  {
    name: "inlineTextTypes",
    after: 'InlineCode',
    parse(cx: InlineContext, next: number, pos: number): number {
      if (next !== 92 /* \ */) {
        return -1;
      }
      const src = cx.text.slice(pos - cx.offset);
      if (!src) {
        return -1;
      }
      let startMathPos = pos;
      const pickTag: RegExp = /\\(?:textit|textbf|texttt|text|underline|uline|uuline|uwave|dashuline|dotuline|sout|xout)/;
      const match = src
        .match(pickTag);
      if (!match) {
        return -1;
      }
      let { res = false, nextPos = 0, content } = findEndMarker(src, match[0].length);
      if (!res) {
        return -1;
      }
      const endMarkerPos = startMathPos + nextPos;
      const contentStartPos = endMarkerPos - content.length - 1;
      const contentEndPos = endMarkerPos - 1;
      const commandElem = cx.elt('inlineLatexCommand', startMathPos, contentStartPos - 1);
      const brace1Elem = cx.elt('inlineLatexBrace', contentStartPos - 1, contentStartPos);
      const brace2Elem = cx.elt('inlineLatexBrace', contentEndPos, endMarkerPos);
      const contentElem = cx.elt("inlineTextContent", contentStartPos, contentEndPos);
      return cx.addElement(cx.elt("inlineTextTypes", startMathPos, endMarkerPos, [
        commandElem, brace1Elem, contentElem, brace2Elem
      ]));
    }
  },
  {
    name: "inlineAuthor",
    after: 'InlineCode',
    parse(cx: InlineContext, next: number, pos: number): number {
      if (next !== 92 /* \ */) {
        return -1;
      }
      const src = cx.text.slice(pos - cx.offset);
      if (!src) {
        return -1;
      }
      let startMathPos = pos;
      const pickTag: RegExp = /\\(?:author)/;
      const match = src
        .match(pickTag);
      if (!match) {
        return -1;
      }
      let { res = false, nextPos = 0, content } = findEndMarker(src, match[0].length);
      if (!res) {
        return -1;
      }
      const endMarkerPos = startMathPos + nextPos;
      const contentStartPos = endMarkerPos - content.length - 1;
      const contentEndPos = endMarkerPos - 1;
      const commandElem = cx.elt('inlineLatexCommand', startMathPos, contentStartPos - 1);
      const brace1Elem = cx.elt('inlineLatexBrace', contentStartPos - 1, contentStartPos);
      const brace2Elem = cx.elt('inlineLatexBrace', contentEndPos, endMarkerPos);
      const contentElem = cx.elt("inlineTextContent", contentStartPos, contentEndPos);
      return cx.addElement(cx.elt("inlineAuthor", startMathPos, endMarkerPos, [
        commandElem, brace1Elem, contentElem, brace2Elem
      ]));
    }
  },
  {
    name: "inlineNewTheorem",
    after: "InlineCode",
    parse(cx: InlineContext, next: number, pos: number): number {
      if (next !== 92 /* \ */) {
        return -1;
      }
      const src = cx.text.slice(pos - cx.offset);
      if (!src) {
        return -1;
      }
      let startMathPos = pos;
      let match = src
        .match(reNewTheoremNumbered);
      if (!match) {
        match = src
          .match(reNewTheoremNumbered2);
      }
      if (!match) {
        match = src
          .match(reNewTheorem);
      }
      if (!match) {
        match = src
          .match(reNewTheoremUnNumbered);
      }
      if (!match) {
        return -1;
      }
      const endMarkerPos = startMathPos + match[0].length;
      const contentElem = cx.elt("inlineLatexContent", startMathPos, endMarkerPos);
      return cx.addElement(cx.elt("inlineNewTheorem", startMathPos, endMarkerPos, [
        contentElem
      ]));
    }
  },
  {
    name: "inlineTheoremStyle",
    after: "InlineCode",
    parse(cx: InlineContext, next: number, pos: number): number {
      if (next !== 92 /* \ */) {
        return -1;
      }
      const src = cx.text.slice(pos - cx.offset);
      if (!src) {
        return -1;
      }
      let startMathPos = pos;
      const match = src
        .match(reTheoremStyle);
      if (!match) {
        return -1;
      }
      const endMarkerPos = startMathPos + match[0].length;
      const contentElem = cx.elt("inlineLatexContent", startMathPos, endMarkerPos);
      return cx.addElement(cx.elt("inlineTheoremStyle", startMathPos, endMarkerPos, [
        contentElem
      ]));
    }
  },
  {
    name: "inlineSetCounter",
    after: "InlineCode",
    parse(cx: InlineContext, next: number, pos: number): number {
      if (next !== 92 /* \ */) {
        return -1;
      }
      const src = cx.text.slice(pos - cx.offset);
      if (!src) {
        return -1;
      }
      let startMathPos = pos;
      const match = src
        .match(reSetCounter);
      if (!match) {
        return -1;
      }
      const endMarkerPos = startMathPos + match[0].length;
      const contentElem = cx.elt("inlineLatexContent", startMathPos, endMarkerPos);
      return cx.addElement(cx.elt("inlineSetCounter", startMathPos, endMarkerPos, [
        contentElem
      ]));
    }
  },
  {
    name: "inlineNewCommandQedSymbol",
    after: "InlineCode",
    parse(cx: InlineContext, next: number, pos: number): number {
      if (next !== 92 /* \ */) {
        return -1;
      }
      const src = cx.text.slice(pos - cx.offset);
      if (!src) {
        return -1;
      }
      let startMathPos = pos;
      const match = src
        .match(reNewCommandQedSymbol);
      if (!match) {
        return -1;
      }
      const endMarkerPos = startMathPos + match[0].length;
      const contentElem = cx.elt("inlineLatexContent", startMathPos, endMarkerPos);
      return cx.addElement(cx.elt("inlineNewCommandQedSymbol", startMathPos, endMarkerPos, [
        contentElem
      ]));
    }
  }],
  wrap: wrappedTeXParser("inlineLatexContent")
};