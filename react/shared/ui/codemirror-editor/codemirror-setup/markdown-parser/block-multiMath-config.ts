// filepath: src/codemirror-setup/markdown-parser/block-multiMath-config.ts
// 🔥 원본 코드(block-math-config.ts)의 안정적인 로직을 기반으로 재작성한 최종 버전

import {
  type MarkdownConfig,
  type BlockContext, type Line, type LeafBlock,
} from '@lezer/markdown';
import { foldNodeProp } from "@codemirror/language";
import { wrappedTeXParser } from "./wrapped-TeXParser";
import {
  BLOCK_DISPLAY_MATH,
  EQUATION_MATH,
  EQUATION_MATH_NOT_NUMBER,
  MULTI_MATH_START_REGEX,
  BLOCK_TABLE,
  BLOCK_TABULAR,
  BLOCK_FIGURE,
  BLOCK_CENTER,
  BLOCK_LEFT,
  BLOCK_RIGHT,
  BLOCK_LIST,
  BLOCK_TEXT,
  BLOCK_MULTI_MATH,
  BLOCK_MULTI_MATH_CONTENT_TAG,
  BLOCK_TEXT_LATEX_CONTENT_TAG,
  BLOCK_MULTI_MATH_VERBOSE_DELIMITER,
  BLOCK_MULTI_MATH_DELIMITER,
  BLOCK_MULTI_MATH_DELIMITER_COMMAND,
  BLOCK_MULTI_MATH_DELIMITER_BRACE,
  BLOCK_MULTI_MATH_DELIMITER_TYPE,
  mathTag,
  latexTag,
  delimiterBraceTag,
  aquaTag,
  contentTag,
  latexEnvironments,
  mathEnvironments,
  EQUATION_MATH_START_REGEX
} from "./consts";
import { type SyntaxNode } from '@lezer/common';
import { type EditorState } from '@codemirror/state';

const getFoldData = (node: SyntaxNode, state: EditorState) => {
  const content = state.doc.sliceString(node.from, node.to);
  const match = content.match(EQUATION_MATH_START_REGEX);
  
  if (!match || !match[1]) return null;
  
  const endMarker = `\\end{${match[1]}}`;
  const from = match.index !== undefined ? node.from + match.index + match[0].length : node.from;
  const toIndex = content.lastIndexOf(endMarker);
  
  if (toIndex === -1) return null;
  
  const to = node.from + toIndex;
  
  return from < to ? { from, to } : null;
};


export const BlockMultiMathConfig: MarkdownConfig = {
  props: [
    foldNodeProp.add({
      EquationMath: getFoldData,
      EquationMathNotNumber: getFoldData,
      BlockTabular: getFoldData,
      BlockTable: getFoldData,
      BlockFigure: getFoldData,
    }),
  ],
  defineNodes: [
    { name: BLOCK_MULTI_MATH, block: true, style: mathTag },
    { name: BLOCK_DISPLAY_MATH, block: true, style: mathTag },
    { name: EQUATION_MATH_NOT_NUMBER, block: true, style: mathTag },
    { name: EQUATION_MATH, block: true, style: mathTag },
    { name: BLOCK_TABLE, block: true, style: mathTag },
    { name: BLOCK_TABULAR, block: true, style: mathTag },
    { name: BLOCK_FIGURE, block: true, style: mathTag },
    { name: BLOCK_CENTER, block: true, style: mathTag },
    { name: BLOCK_LEFT, block: true, style: mathTag },
    { name: BLOCK_RIGHT, block: true, style: mathTag },
    { name: BLOCK_LIST, block: true, style: mathTag },
    { name: BLOCK_TEXT, block: true, style: mathTag },
    { name: BLOCK_MULTI_MATH_CONTENT_TAG, style: contentTag },
    { name: BLOCK_TEXT_LATEX_CONTENT_TAG, style: contentTag },
    { name: BLOCK_MULTI_MATH_VERBOSE_DELIMITER, style: latexTag },
    { name: BLOCK_MULTI_MATH_DELIMITER, style: latexTag },
    { name: BLOCK_MULTI_MATH_DELIMITER_COMMAND, style: latexTag },
    { name: BLOCK_MULTI_MATH_DELIMITER_BRACE, style: delimiterBraceTag },
    { name: BLOCK_MULTI_MATH_DELIMITER_TYPE, style: aquaTag },
  ],
  parseBlock: [{
    name: "MultiMath",
    parse(cx: BlockContext, line: Line): boolean {
      const startMatch = line.text.slice(line.pos).match(MULTI_MATH_START_REGEX);
      if (!startMatch) return false;

      const environment = startMatch[1] || (startMatch[0] === "\\[" || startMatch[0] === "\\\\[" ? "display" : null);
      if (!environment) return false;

      const endTagStr = environment === 'display' ? (startMatch[0] === "\\[" ? "\\]" : "\\\\]") : `\\end{${environment}}`;
      const endRegex = new RegExp(endTagStr.replace(/\\/g, '\\\\'));

      const startPos = cx.lineStart + line.pos + (startMatch.index || 0);
      const startDelimLen = startMatch[0].length;
      
      let endMatch = line.text.substring(line.pos + (startMatch.index || 0) + startDelimLen).match(endRegex);

      if (!endMatch) {
          let hadNextLine = false;
          do {
            hadNextLine = cx.nextLine();
            if (!hadNextLine) break; // 문서 끝에 도달
            endMatch = line.text.match(endRegex);
          } while (!endMatch);
      }
      
      if (!endMatch) return false; // 문서 끝까지 닫는 태그를 찾지 못함

      const stopPos = cx.lineStart + (endMatch.index || 0);

      let nodeType: string = BLOCK_MULTI_MATH;
       if (environment === 'display') {
        nodeType = BLOCK_DISPLAY_MATH;
      } else if (mathEnvironments.includes(environment)) {
        nodeType = environment.endsWith('*') ? EQUATION_MATH_NOT_NUMBER : EQUATION_MATH;
      } else if (latexEnvironments.includes(environment)) {
          switch(environment) {
              case "table": nodeType = BLOCK_TABLE; break;
              case "tabular": nodeType = BLOCK_TABULAR; break;
              case "figure": nodeType = BLOCK_FIGURE; break;
              case "center": nodeType = BLOCK_CENTER; break;
              case "left": nodeType = BLOCK_LEFT; break;
              case "right": nodeType = BLOCK_RIGHT; break;
              case "itemize": case "enumerate": nodeType = BLOCK_LIST; break;
              default: nodeType = BLOCK_TEXT;
          }
      } else {
        nodeType = BLOCK_TEXT;
      }
      
      const children = [];

      // 1. 시작 구분자 파싱 (\begin{...})
      if (startMatch[1]) {
        const startDelimContent = [];
        startDelimContent.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER_COMMAND, startPos, startPos + 6)); // \begin
        startDelimContent.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER_BRACE, startPos + 6, startPos + 7)); // {
        startDelimContent.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER_TYPE, startPos + 7, startPos + 7 + startMatch[1].length));
        startDelimContent.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER_BRACE, startPos + 7 + startMatch[1].length, startPos + startDelimLen)); // }
        children.push(cx.elt(BLOCK_MULTI_MATH_VERBOSE_DELIMITER, startPos, startPos + startDelimLen, startDelimContent));
      } else {
        children.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER, startPos, startPos + startDelimLen));
      }

      // 2. 콘텐츠 파싱
      const contentTagType = nodeType === BLOCK_TEXT ? BLOCK_TEXT_LATEX_CONTENT_TAG : BLOCK_MULTI_MATH_CONTENT_TAG;
      children.push(cx.elt(contentTagType, startPos + startDelimLen, stopPos));

      // 3. 끝 구분자 파싱 (\end{...})
      const endDelimLen = endMatch[0].length;
      if (startMatch[1]) { // \begin으로 시작했다면 \end로 끝나야 함
        const endDelimContent = [];
        endDelimContent.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER_COMMAND, stopPos, stopPos + 4)); // \end
        endDelimContent.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER_BRACE, stopPos + 4, stopPos + 5)); // {
        endDelimContent.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER_TYPE, stopPos + 5, stopPos + 5 + startMatch[1].length));
        endDelimContent.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER_BRACE, stopPos + 5 + startMatch[1].length, stopPos + endDelimLen)); // }
        children.push(cx.elt(BLOCK_MULTI_MATH_VERBOSE_DELIMITER, stopPos, stopPos + endDelimLen, endDelimContent));
      } else {
        children.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER, stopPos, stopPos + endDelimLen));
      }

      cx.addElement(cx.elt(nodeType, startPos, stopPos + endDelimLen, children));
      
      // `nextLine()`은 루프에서 이미 호출되었으므로, 현재 라인이 닫는 태그를 포함한 라인입니다.
      // 파서가 다음 라인부터 계속 진행하도록 합니다.
      cx.nextLine();
      return true;
    },
    endLeaf(_cx: BlockContext, line: Line, _leaf: LeafBlock): boolean {
      return MULTI_MATH_START_REGEX.test(line.text.slice(line.pos));
    },
  }],
  wrap: wrappedTeXParser(BLOCK_MULTI_MATH_CONTENT_TAG),
};