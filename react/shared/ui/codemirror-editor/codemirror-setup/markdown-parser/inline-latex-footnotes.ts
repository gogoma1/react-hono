// filepath: src/codemirror-setup/markdown-parser/inline-latex-footnotes.ts

import { MarkdownConfig, InlineContext } from "@lezer/markdown";
import {
  inlineMathTag,
  reLatexFootnotes,
  reNumber
} from "./consts";
import { wrappedTeXParser } from "./wrapped-TeXParser";
// 🔽 이 부분이 수정되었습니다.
import { findEndMarker, isSpace } from "../helpers";
// 🔼 이 부분이 수정되었습니다.

export const inlineLatexFootnotesConfig: MarkdownConfig = {
  defineNodes: [
    {
      name: "latexFootnotesContent",
      style: inlineMathTag
    },
    {
      name: 'latexFootnotes',
      style: inlineMathTag
    }
  ],
  parseInline: [
    {
      name: "latexFootnotes",
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
        let nextPos: number = pos;
        let max: number = src.length;
        const match = src
          .match(reLatexFootnotes);
        if (!match) {
          return -1;
        }
        nextPos = match[0].length;
        // \footnote {text}
        //          ^^ skipping these spaces
        for (; nextPos < max; nextPos++) {
          const code = src.charCodeAt(nextPos);
          if (!isSpace(code) && code !== 0x0A) { break; }
        }
        if (nextPos >= max) {
          if (nextPos === max && match[0] === "\\footnotemark") {
            const endMarkerPos = startMathPos + match[0].length;
            const contentElem = cx.elt("latexFootnotesContent", startMathPos, endMarkerPos);
            return cx.addElement(cx.elt("latexFootnotes", startMathPos, endMarkerPos, [
              contentElem
            ]));
          }
          return -1;
        }
        // \footnote{text} or \footnote[number]{text}
        //          ^^ should be {     ^^ should be [
        if (src.charCodeAt(nextPos) !== 123 /* { */
          && src.charCodeAt(nextPos) !== 0x5B/* [ */) {
          if (match[0] === "\\footnotemark") {
            const endMarkerPos = startMathPos + match[0].length;
            const contentElem = cx.elt("latexFootnotesContent", startMathPos, endMarkerPos);
            return cx.addElement(cx.elt("latexFootnotes", startMathPos, endMarkerPos, [
              contentElem
            ]));
          }
          return -1;
        }
        let data = null;
        let numbered = undefined;
        if (src.charCodeAt(nextPos) === 123 /* { */) {
          data = findEndMarker(src, nextPos);
        } else {
          data = null;
          let dataNumbered = findEndMarker(src, nextPos, "[", "]");
          if (!dataNumbered || !dataNumbered.res) {
            return -1; /** can not find end marker */
          }
          numbered = dataNumbered.content;
          if (numbered?.trim() && !reNumber.test(numbered)) {
            return -1;
          }
          nextPos = dataNumbered.nextPos;
          if (nextPos < max) {
            // \footnote[numbered]  {text}
            //                    ^^ skipping these spaces
            for (; nextPos < max; nextPos++) {
              const code = src.charCodeAt(nextPos);
              if (!isSpace(code) && code !== 0x0A) { break; }
            }
          }
          if (nextPos < max && src.charCodeAt(nextPos) === 123/* { */) {
            // \footnote[numbered]{text}
            //                    ^^ get print
            data = findEndMarker(src, nextPos);
            if (!data || !data.res) {
              return -1; /** can not find end marker */
            }
          } else {
            if (nextPos < max && match[0] === "\\footnotemark") {
              const endMarkerPos = startMathPos + dataNumbered.nextPos;
              const contentElem = cx.elt("latexFootnotesContent", startMathPos, endMarkerPos);
              return cx.addElement(cx.elt("latexFootnotes", startMathPos, endMarkerPos, [
                contentElem
              ]));
            }
          }
        }
        if (!data || !data.res) {
          return -1; /** can not find end marker */
        }
        const endMarkerPos = startMathPos + data.nextPos;
        const contentElem = cx.elt("latexFootnotesContent", startMathPos, endMarkerPos);
        return cx.addElement(cx.elt("latexFootnotes", startMathPos, endMarkerPos, [
          contentElem
        ]));
      }
    },
  ],
  wrap: wrappedTeXParser("latexFootnotesContent")
};