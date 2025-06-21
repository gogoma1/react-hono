import { foldNodeProp } from "@codemirror/language";
import {
  MarkdownConfig,
  BlockContext, Line, LeafBlock,
} from '@lezer/markdown';
import { wrappedTeXParser } from "./wrapped-TeXParser";
import {
  FOLDE_BLOCKS,
  BLOCK_MATH,
  BLOCK_MATH_CONTENT_TAG, 
  MATH_BLOCK_START_REGEX,
  MATH_BLOCK_STOP_REGEX,
  mathTag
} from "./consts";

export const BlockMathConfig: MarkdownConfig = {
  props: [
    foldNodeProp.add({
      Block: (node) => {
        if (FOLDE_BLOCKS.indexOf(node.name) === -1) {
          return null;
        }
      },
      BlockMath: (node) => ({ from: node.from + 2, to: node.to - 2 }),
      BlockMathContent: () => null
    })
  ],
  defineNodes: [
    {
      name: BLOCK_MATH,
      block: true,
      style: mathTag,
    },
    {
      name: BLOCK_MATH_CONTENT_TAG,
    },

  ],
  parseBlock: [{
    name: BLOCK_MATH,
    before: 'HorizontalRule',
    // before: 'Blockquote',

    parse(cx: BlockContext, line: Line): boolean {
      const lineLength = line.text.length;
      const delimLen = 2;
      // $$ delimiter? Start math!
      const mathStartMatch = MATH_BLOCK_START_REGEX.exec(line.text);
      if (mathStartMatch) {
        const start = cx.lineStart + mathStartMatch[0].length;
        let stop: number;
        let endMatch = MATH_BLOCK_STOP_REGEX.exec(
          line.text.substring(mathStartMatch[0].length)
        );
        // If the math region ends immediately (on the same line),
        if (endMatch) {
          stop = cx.lineStart + lineLength - endMatch[0].length;
        } else {
          let hadNextLine = false;
          // Otherwise, it's a multi-line block display.
          // Consume lines until we reach the end.
          do {
            hadNextLine = cx.nextLine();
            if (!line.text) {
              break;
            }
            endMatch = hadNextLine ? MATH_BLOCK_STOP_REGEX.exec(line.text) : null;
          }
          while (hadNextLine && endMatch == null);
          
          if (!endMatch) {
            return false;
          }
          if (hadNextLine && endMatch) {
            // Remove the ending delimiter
            stop = cx.lineStart + line.text.length - endMatch[0].length;
          } else {
            stop = cx.lineStart;
          }
        }
        // Label the region. Add two labels so that one can be removed.
        const contentElem = cx.elt(BLOCK_MATH_CONTENT_TAG, start, stop);
        cx.addElement(
          cx.elt(BLOCK_MATH, start - delimLen, stop + delimLen, [contentElem])
        );
        // Don't re-process the ending delimiter (it may look the same
        // as the starting delimiter).
        cx.nextLine();
        return true;
      }
      return false;
    },
    // End paragraph-like blocks
    endLeaf(_cx: BlockContext, line: Line, _leaf: LeafBlock): boolean {
      // Leaf blocks (e.g. block quotes) end early if math starts.
      return MATH_BLOCK_START_REGEX.exec(line.text) != null;
    },
  }],
  wrap: wrappedTeXParser(BLOCK_MATH_CONTENT_TAG),
};
