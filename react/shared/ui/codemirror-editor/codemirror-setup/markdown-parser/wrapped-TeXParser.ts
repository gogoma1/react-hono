import { parseMixed, SyntaxNodeRef, Input } from "@lezer/common";
import {
  TEX_LANGUAGE,
  BLOCK_MULTI_MATH_CONTENT_TAG,
  BLOCK_MATH_CONTENT_TAG
} from "./consts";

/**
 * Wraps a TeX math-mode parser. This removes [nodeTag] from the syntax tree
 * and replaces it with a region handled by the sTeXMath parser.
 * */
export const wrappedTeXParser = (nodeTag: string) =>
  parseMixed((node: SyntaxNodeRef, input: Input) => {
    if (node.name !== nodeTag) return null;
    let overlay = undefined;
    if (nodeTag === BLOCK_MULTI_MATH_CONTENT_TAG || nodeTag === BLOCK_MATH_CONTENT_TAG) {
      const from = input.read(node.from, node.from + 1) === "\n" ? node.from + 1 : node.from;
      const to = input.read(node.to - 1, node.to) === "\n" ? node.to - 1 : node.to;
      if (from < to) {
        overlay = [{ from, to }];
      }
    }
    return {
      parser: TEX_LANGUAGE.parser,
      overlay
    };
  });
