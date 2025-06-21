// filepath: src/codemirror-setup/markdown-parser/markdown.ts
// 코드 하이라이팅 기능 완전 삭제 버전

import { Tag, styleTags } from "@lezer/highlight";
export { markdownLanguage } from "@codemirror/lang-markdown";

export const tags = {
  codeinfo: Tag.define(),
  hardbreak: Tag.define(),
  taskmarker: Tag.define(),
};

export const markdownHighlight = {
  props: [
    styleTags({
      "CodeInfo": tags.codeinfo, // FencedCode 블록의 언어 이름 부분 (예: ```javascript)
      "HardBreak": tags.hardbreak, // 강제 줄바꿈
      "TaskMarker": tags.taskmarker, // - [x]
    })
  ],
};

// 🔽 codeLanguages 변수와 관련된 모든 코드가 삭제되었습니다.