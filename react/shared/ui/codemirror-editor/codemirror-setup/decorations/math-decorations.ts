// filepath: src/codemirror-setup/decorations/math-decorations.ts
// 코드 블록 데코레이션 완전 삭제 버전

import { ensureSyntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView
} from "@codemirror/view";
import { ViewPlugin,  ViewUpdate } from "@codemirror/view";
import {
  BLOCK_MATH,
  BLOCK_MULTI_MATH,
  BLOCK_DISPLAY_MATH,
  BLOCK_MATH_CONTENT_TAG,
  BLOCK_MULTI_MATH_CONTENT_TAG,
  BLOCK_MULTI_MATH_DELIMITER,
  EQUATION_MATH_NOT_NUMBER,
  EQUATION_MATH,
  INLINE_MATH,
  INLINE_MATH_CONTENT_TAG,
  INLINE_MATH_START_DELIMITER,
  INLINE_MATH_STOP_DELIMITER,
  INLINE_MULTI_MATH_CONTENT_TAG,
  INLINE_MULTI_MATH,
  INLINE_MULTI_MATH_START_DELIMITER,
  INLINE_MULTI_MATH_STOP_DELIMITER,
  textLatexCommands, latexEnvironments, mathEnvironments
} from "../markdown-parser/consts";
import { inlineMathLatexCommands } from "../auto-complete/dictionary";

const isLatexCommand = (command: string) => {
  if (textLatexCommands.findIndex(item => item === command) !== -1) {
    return true;
  }
  return inlineMathLatexCommands.findIndex(item => item.label === command) !== -1;
};

const isLatexEnvironment = (command: string) => {
  if (latexEnvironments.findIndex(item => item === command) !== -1) {
    return true;
  }
  return mathEnvironments.findIndex(item => item === command) !== -1;
};

const regionStartDecoration = Decoration.line({
  attributes: { class: 'cm-regionFirstLine' },
});

const regionStopDecoration = Decoration.line({
  attributes: { class: 'cm-regionLastLine' },
});

// 🔽 codeBlockDecoration이 삭제되었습니다.

const inlineCodeDecoration = Decoration.mark({
  attributes: { class: 'cm-inlineCode' },
});

const ignoreSpellCheck = Decoration.mark({
  attributes: { 
    class: 'cm-ignoreSpellCheck', 
    spellcheck: "false",
    style: "display: inline-block"
  },
});

const blockMathDecoration = Decoration.line({
  attributes: { class: 'cm-blockMath' },
});

const blockMathContentDecoration = Decoration.line({
  attributes: { class: 'cm-blockMathContent' },
});

const blockMathtDelimiterDecoration = Decoration.mark({
  attributes: { class: 'cm-blockMathDelimiter' },
});

const inlineMathDecoration = Decoration.mark({
  attributes: { class: 'cm-inlineMath' },
});

const inlineMathContentDecoration = Decoration.mark({
  attributes: { class: 'cm-inlineMathContent' },
});

const inlineMathStartDelimiterDecoration = Decoration.mark({
  attributes: { class: 'cm-inlineMathStartDelimiter' },
});

const inlineMathStopDelimiterDecoration = Decoration.mark({
  attributes: { class: 'cm-inlineMathStopDelimiter' },
});

const inlineMultiMathDecoration = Decoration.mark({
  attributes: { class: 'cm-inlineMultiMath' },
});

const inlineMultiMathContentDecoration = Decoration.line({
  attributes: { class: 'cm-inlineMultiMathContent' },
});

const blockQuoteDecoration = Decoration.line({
  attributes: { class: 'cm-blockQuote' },
});

function computeDecorations(view: EditorView) {
  const decorations: {
    pos: number;
    length?: number;
    decoration: Decoration
  }[] = [];

  const addDecorationToLines = (from: number, to: number, decoration: Decoration, asMark = false) => {
    let pos = from;
    while (pos <= to) {
      const line = view.state.doc.lineAt(pos);
      if (asMark) {
        decorations.push({
          pos: line.from,
          length: line.to - line.from,
          decoration,
        });
      } else {
        decorations.push({
          pos: line.from,
          decoration,
        });
      }
      pos = line.to + 1;
    }
  };

  const addDecorationToRange = (from: number, to: number, decoration: Decoration) => {
    decorations.push({
      pos: from,
      length: to - from,
      decoration,
    });
  };

  for (const { from, to } of view.visibleRanges) {
    ensureSyntaxTree(view.state, to)?.iterate({
      from, to,
      enter: node => {
        let blockDecorated = false;
        const viewFrom = Math.max(from, node.from);
        const viewTo = Math.min(to, node.to);
        let content = '';
        switch (node.name) {
          // 🔽 'FencedCode'와 'CodeBlock' case가 삭제되었습니다.
          
          case BLOCK_MATH:
          case BLOCK_MULTI_MATH:
          case BLOCK_DISPLAY_MATH:
          case EQUATION_MATH_NOT_NUMBER:
          case EQUATION_MATH:
            addDecorationToLines(viewFrom, viewTo, blockMathDecoration);
            blockDecorated = true;
            break;
          case BLOCK_MATH_CONTENT_TAG:
          case BLOCK_MULTI_MATH_CONTENT_TAG:
            addDecorationToLines(viewFrom, viewTo, blockMathContentDecoration);
            blockDecorated = true;
            break;
          
          case BLOCK_MULTI_MATH_DELIMITER:
            addDecorationToRange(viewFrom, viewTo, blockMathtDelimiterDecoration);
            break;
          case "BLOCK_MULTI_MATH_VERBOSE_DELIMITER": // This case name is a string, not a constant
             // Verbose delimiter itself does not get a class, its children do via styleTags
            break;

          case 'Blockquote':
            addDecorationToLines(viewFrom, viewTo, blockQuoteDecoration);
            blockDecorated = true;
            break;
          case INLINE_MULTI_MATH:
            addDecorationToRange(viewFrom, viewTo, inlineMultiMathDecoration);
            break;
          case INLINE_MULTI_MATH_CONTENT_TAG:
            addDecorationToRange(viewFrom, viewTo, inlineMultiMathContentDecoration);
            break;
          case INLINE_MATH:
            addDecorationToRange(viewFrom, viewTo, inlineMathDecoration);
            break;
          case INLINE_MATH_CONTENT_TAG:
            addDecorationToRange(viewFrom, viewTo, inlineMathContentDecoration);
            break;
          case INLINE_MATH_START_DELIMITER:
          case INLINE_MULTI_MATH_START_DELIMITER:
            addDecorationToRange(viewFrom, viewTo, inlineMathStartDelimiterDecoration);
            break;
          case INLINE_MATH_STOP_DELIMITER:
          case INLINE_MULTI_MATH_STOP_DELIMITER:
            addDecorationToRange(viewFrom, viewTo, inlineMathStopDelimiterDecoration);
            break;
          case 'InlineCode':
            addDecorationToRange(viewFrom, viewTo, inlineCodeDecoration);
            break;
          case 'tagName':
            content = view.state.doc.sliceString(viewFrom, viewTo);
            if (isLatexCommand(content)) {
              addDecorationToRange(viewFrom, viewTo, ignoreSpellCheck);
            }
            break;          
          case 'variableName.special':
            content = view.state.doc.sliceString(viewTo, viewTo);
            if (isLatexEnvironment(content)) {
              addDecorationToRange(viewFrom, viewTo, ignoreSpellCheck);
            }
            break;
        }

        if (blockDecorated) {
          if (viewFrom === node.from) {
            addDecorationToLines(viewFrom, viewFrom, regionStartDecoration);
          }
          if (viewTo === node.to) {
            addDecorationToLines(viewTo, viewTo, regionStopDecoration);
          }
        }
      },
    });
  }
  const decorationBuilder = new RangeSetBuilder<Decoration>();
  try {
    decorations.sort((a, b) => a.pos - b.pos);
    for (const { pos, length, decoration } of decorations) {
      if (decoration.spec.line) {
         decorationBuilder.add(pos, pos, decoration);
      } else if (length && length > 0) {
        decorationBuilder.add(pos, pos + length, decoration);
      }
    }
  } catch (err) {
    console.error(err);
  }
  return decorationBuilder.finish();
}

export const mathDecorations = ViewPlugin.fromClass(class {
  public decorations: DecorationSet;

  public constructor(view: EditorView) {
    this.decorations = computeDecorations(view);
  }

  public update(viewUpdate: ViewUpdate) {
    if (viewUpdate.docChanged || viewUpdate.viewportChanged || viewUpdate.geometryChanged) {
      this.decorations = computeDecorations(viewUpdate.view);
    }
  }
}, {
  decorations: pluginVal => pluginVal.decorations,
});