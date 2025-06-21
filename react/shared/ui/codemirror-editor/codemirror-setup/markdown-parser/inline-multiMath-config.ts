// filepath: src/codemirror-setup/markdown-parser/inline-multiMath-config.ts
// FINAL FIXED VERSION

import { type MarkdownConfig, type InlineContext } from "@lezer/markdown";
import { wrappedTeXParser } from "./wrapped-TeXParser";
import {
  INLINE_MATH,
  INLINE_MULTI_MATH,
  INLINE_MULTI_MATH_CONTENT_TAG,
  INLINE_MULTI_MATH_START_DELIMITER,
  INLINE_MULTI_MATH_STOP_DELIMITER,
  inlineMathTagDelimiter,
  inlineMathTag,
  REFERENCE_NOTE,
  INLINE_DISPLAY_MATH
} from "./consts";

import {
  findOpenCloseTagsMathEnvironment,
  beginTag,
  endTag
} from "../helpers";

export const InlineMultiMathConfig: MarkdownConfig = {
  defineNodes: [
    { name: INLINE_MULTI_MATH, style: inlineMathTag },
    { name: INLINE_MULTI_MATH_CONTENT_TAG, style: inlineMathTag },
    { name: INLINE_MULTI_MATH_START_DELIMITER, style: inlineMathTagDelimiter },
    { name: INLINE_MULTI_MATH_STOP_DELIMITER, style: inlineMathTagDelimiter },
  ],
  parseInline: [{
    name: INLINE_MULTI_MATH,
    after: 'InlineCode',
    parse(cx: InlineContext, next: number, pos: number): number {
      const prevCharCode = pos - 1 >= 0 ? cx.char(pos - 1) : -1;
      const prevPrevCharCode = pos - 2 >= 0 ? cx.char(pos - 2) : -1;
      if ((prevPrevCharCode === 92) && (prevCharCode === 40 || prevCharCode === 91)) {
        pos = pos - 2;
        next = 92;
      }
      if (next !== 92) {
        return -1;
      }
      const src = cx.text.slice(pos - cx.offset);
      if (!src) {
        return -1;
      }
      
      const match = src.match(/^(?:\\\[|\[|\\\(|\(|\\begin\{([^}]*)\}|\\eqref\{([^}]*)\}|\\ref\{([^}]*)\})/);
      if (!match) {
        return -1;
      }

      // 💡 BUG FIX: 변수 선언 시 기본값 할당
      let type: string = '';
      let endMarker: string = '';
      let endMarkerPos = -1;

      const matchIndex = match.index || 0;
      const startMathPos = matchIndex + match[0].length;
      
      if (match[0] === "\\\\[") {
        type = INLINE_DISPLAY_MATH;
        endMarker = "\\\\]";
      } else if (match[0] === "\\[") {
        type = INLINE_DISPLAY_MATH;
        endMarker = "\\]";
      } else if (match[0] === "\\\\(") {
        type = INLINE_MATH;
        endMarker = "\\\\)";
      } else if (match[0] === "\\(") {
        type = INLINE_MATH;
        endMarker = "\\)";
      } else if (match[0].includes("eqref")) {
        type = REFERENCE_NOTE;
        endMarker = "}"; // 💡 eqref도 닫는 괄호가 필요합니다.
      } else if (match[0].includes("ref")) {
        type = REFERENCE_NOTE;
        endMarker = "}"; // 💡 ref도 닫는 괄호가 필요합니다.
      } else if (match[1] && match[1] !== 'abstract') {
        if (match[1].indexOf('*') > 0) {
          type = "equation_math_not_number";
        } else {
          type = "equation_math";
        }
        endMarker = `\\end{${match[1]}}`;
        const environment = match[1].trim();
        const openTag: RegExp = beginTag(environment, true);
        const closeTag: RegExp = endTag(environment, true);
        const data = findOpenCloseTagsMathEnvironment(src, openTag, closeTag);
        
        if (data?.arrClose?.length) {
          const lastCloseTag = data.arrClose[data.arrClose.length - 1];
          if (lastCloseTag && typeof lastCloseTag.posStart === 'number') {
            endMarkerPos = lastCloseTag.posStart;
          }
        }
      }

      // 💡 모든 조건에 해당하지 않으면 파싱 실패로 간주합니다.
      if (!type || !endMarker) {
        return -1;
      }

      if (endMarkerPos === -1) {
        endMarkerPos = src.indexOf(endMarker, startMathPos);
      }
      
      if (endMarkerPos === -1) {
        return -1;
      }

      const nextPos = endMarkerPos + endMarker.length;
      const absoluteEndPos = pos + nextPos; 

      if (type === REFERENCE_NOTE) {
        // eqref나 ref의 경우, `{`로 시작했으므로 `}`로 끝나야 합니다.
        // `findEndMarker` 같은 더 정교한 헬퍼를 사용하는 것이 좋지만,
        // 일단은 indexOf로 간단히 처리합니다.
        const closingBracePos = src.indexOf("}", startMathPos);
        if (closingBracePos === -1) return -1;
        const refEndPos = pos + closingBracePos + 1;
        
        const contentElem = cx.elt("inlineLatexContent", pos, refEndPos);
        return cx.addElement(cx.elt(REFERENCE_NOTE, pos, refEndPos, [
          contentElem
        ]));
      }

      const startDelimiterEnd = pos + match[0].length;
      const endDelimiterStart = pos + endMarkerPos;

      if (type === INLINE_MATH) {
        const delimiterStartElem = cx.elt(INLINE_MULTI_MATH_START_DELIMITER, pos, startDelimiterEnd);
        const contentElem = cx.elt(INLINE_MULTI_MATH_CONTENT_TAG, startDelimiterEnd, endDelimiterStart);
        const delimiterStopElem = cx.elt(INLINE_MULTI_MATH_STOP_DELIMITER, endDelimiterStart, absoluteEndPos);
        return cx.addElement(cx.elt(INLINE_MULTI_MATH, pos, absoluteEndPos, [
          delimiterStartElem,
          contentElem,
          delimiterStopElem
        ]));
      }

      const contentElem = cx.elt(INLINE_MULTI_MATH, pos, absoluteEndPos);
      return cx.addElement(
        cx.elt(INLINE_MULTI_MATH_CONTENT_TAG, pos, absoluteEndPos, [contentElem])
      );
    },
  }],
  wrap: wrappedTeXParser(INLINE_MULTI_MATH_CONTENT_TAG),
};