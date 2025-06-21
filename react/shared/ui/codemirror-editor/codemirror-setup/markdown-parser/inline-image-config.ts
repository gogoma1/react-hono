import { MarkdownConfig } from "@lezer/markdown";
import { INLINE_IMAGE_PARAMS, inlineMathTag } from "./consts";

export const InlineImageConfig: MarkdownConfig = {
  defineNodes: [
    {
      name: INLINE_IMAGE_PARAMS,
      style: inlineMathTag,
    },
  ],
  parseInline: [
    {
      name: INLINE_IMAGE_PARAMS,
      after: "LinkEnd",

      parse(cx: any, next: number, pos: number): number {
        if (next !== 123 /* '{' */) {
          return -1;
        }
        if (!cx.parts?.length) {
          return -1;
        }
        const elBefore = cx.parts.length - 1 >= 0 ? cx.parts[cx.parts.length - 1] : null;
        if (!elBefore || elBefore.type !== 28 /* Image */) {
          return - 1;
        }
        const start = pos;
        const end = cx.end;
        pos++;
        // Scan ahead for the '}' symbol
        for (; pos < end && cx.char(pos) !== 125; pos++) {
          if (cx.char(pos) === 125) {
            break;
          }
        }
        pos++;
        const el = cx.elt(INLINE_IMAGE_PARAMS, start, pos);
        elBefore.children.push(el);
        elBefore.to = pos;
        return pos;
      }
    },
  ]
}; 
