import { MarkdownConfig, InlineContext } from "@lezer/markdown";
import { wrappedTeXParser } from "./wrapped-TeXParser";
import {
  BACKSLASH_CHAR_CODE,
  DOLLAR_SIGN_CHAR_CODE,
  INLINE_MATH,
  INLINE_MATH_CONTENT_TAG,
  INLINE_MATH_START_DELIMITER,
  INLINE_MATH_STOP_DELIMITER,
  inlineMathTag,
  inlineMathTagDelimiter
} from "./consts";

/**
 *
 * parseInline - The parse function. Gets the next character and its position as arguments.
 * Should return -1 if it doesn't handle the character, or add some element or delimiter
 * and return the end position of the content it parsed if it can.
 * */
export const InlineMathConfig: MarkdownConfig = {
  defineNodes: [
    {
      name: INLINE_MATH,
      style: inlineMathTag,
    },
    {
      name: INLINE_MATH_CONTENT_TAG,
      style: inlineMathTag,
    },
    {
      name: INLINE_MATH_START_DELIMITER,
      style: inlineMathTagDelimiter,
    },
    {
      name: INLINE_MATH_STOP_DELIMITER,
      style: inlineMathTagDelimiter,
    },
  ],
  parseInline: [{
    name: INLINE_MATH,
    after: 'InlineCode',

    parse(cx: InlineContext, next: number, pos: number): number {
      const prevCharCode = pos - 1 >= 0 ? cx.char(pos - 1) : -1;
      const nextCharCode = cx.char(pos + 1);
      if (next !== DOLLAR_SIGN_CHAR_CODE
        || prevCharCode === DOLLAR_SIGN_CHAR_CODE
        || nextCharCode === DOLLAR_SIGN_CHAR_CODE) {
        return -1;
      }
      let escaped = false;
      const start = pos;
      const end = cx.end;
      pos++;
      // Scan ahead for the next '$' symbol
      for (; pos < end && (escaped || cx.char(pos) !== DOLLAR_SIGN_CHAR_CODE); pos++) {
        if (!escaped && cx.char(pos) === BACKSLASH_CHAR_CODE) {
          escaped = true;
        } else {
          escaped = false;
        }
      }
      // Advance to just after the ending '$'
      pos++;
      // Add a wraping INLINE_MATH_TAG node that contains an INLINE_MATH_CONTENT_TAG.
      // The INLINE_MATH_CONTENT_TAG node can thus be safely removed and the region
      // will still be marked as a math region.
      const delimiterStartElem = cx.elt(INLINE_MATH_START_DELIMITER, start, start + 1);
      const contentElem = cx.elt(INLINE_MATH_CONTENT_TAG, start + 1, pos - 1);
      const delimiterStopElem = cx.elt(INLINE_MATH_STOP_DELIMITER, pos - 1, pos);
      const mathElement = cx.elt(INLINE_MATH, start, pos, [
        delimiterStartElem,
        contentElem,
        delimiterStopElem
      ]);
      return cx.addElement(mathElement);
    },
  }],
  wrap: wrappedTeXParser(INLINE_MATH_CONTENT_TAG)
};
