// filepath: src/codemirror-setup/helpers.ts
// FINAL - 함수 인자 개수 오류 및 로직 강화 버전



/**
 * mathpix-markdown-it/lib/markdown/common 의 isSpace 함수를 대체합니다.
 * @param code 문자 코드
 */
export const isSpace = (code: number): boolean => {
  switch (code) {
    case 0x09: // \t
    case 0x0a: // \n
    case 0x0b:
    case 0x0c: // \f
    case 0x0d: // \r
    case 0x20: // ' '
    case 0xa0:
    case 0x1680:
    case 0x2000:
    case 0x2001:
    case 0x2002:
    case 0x2003:
    case 0x2004:
    case 0x2005:
    case 0x2006:
    case 0x2007:
    case 0x2008:
    case 0x2009:
    case 0x200a:
    case 0x202f:
    case 0x205f:
    case 0x3000:
      return true;
  }
  return false;
}

/**
 * mathpix-markdown-it/lib/markdown/utils의 헬퍼 함수들을 대체합니다.
 */
export const beginTag = (ch: string, encode = false) => {
  const c = encode ? `\\\\${ch}` : ch; // 💡 정규식에 사용되므로 백슬래시 이스케이프
  return new RegExp(`\\\\begin\\s*{${c}}`);
};

export const endTag = (ch: string, encode = false) => {
  const c = encode ? `\\\\${ch}` : ch; // 💡 정규식에 사용되므로 백슬래시 이스케이프
  return new RegExp(`\\\\end\\s*{${c}}`);
};

/**
 * 💡💡💡 BUG FIX: 이 함수가 문제의 핵심이었습니다. 
 * 4번째 인자를 받도록 하고, 인라인 코드 블록(```) 상태를 추적하는 로직으로 강화합니다.
 */
export const findOpenCloseTags = (str: string, openTag: RegExp, closeTag: RegExp, pending: string = '') => {
    const arrOpen: { posStart: number, posEnd: number }[] = [];
    const arrClose: { posStart: number, posEnd: number }[] = [];
    
    // 이전 라인에서 인라인 코드가 끝나지 않았으면 1, 아니면 0
    let openCode = pending ? 1 : 0; 
    
    for (let i = 0; i < str.length; i++) {
        // 인라인 코드 마커(`)를 만나면 상태를 토글
        if (str[i] === '`') {
            openCode = 1 - openCode;
            continue; 
        }

        // 인라인 코드 블록 안에서는 태그를 찾지 않음
        if (openCode) {
            continue;
        }
        
        const sub = str.substring(i);
        const matchOpen = sub.match(openTag);
        if (matchOpen && matchOpen.index === 0) {
            const end = i + matchOpen[0].length;
            arrOpen.push({ posStart: i, posEnd: end });
            i = end - 1; 
            continue;
        }

        const matchClose = sub.match(closeTag);
        if (matchClose && matchClose.index === 0) {
            const end = i + matchClose[0].length;
            arrClose.push({ posStart: i, posEnd: end });
            i = end - 1;
            continue;
        }
    }

    // 현재 라인이 끝난 후의 인라인 코드 상태를 반환
    return { arrOpen, arrClose, pending: openCode ? '`' : '' };
};


export const findOpenCloseTagsMathEnvironment = (str: string, openTag: RegExp, closeTag: RegExp) => {
    // 이 함수는 findOpenCloseTags의 단순한 래퍼(wrapper)이므로, 강화된 findOpenCloseTags를 호출합니다.
    return findOpenCloseTags(str, openTag, closeTag);
}

/**
 * 짝이 맞는 괄호를 찾아 그 사이의 내용을 반환합니다.
 */
export const findEndMarker = (str: string, startPos: number = 0, beginMarker: string = "{", endMarker: string = "}", onlyEnd = false) => {
  if (startPos >= str.length) return { res: false, content: '' };
  
  if (str[startPos] !== beginMarker && !onlyEnd) {
    return { res: false, content: '' };
  }
  
  let content: string = '';
  let nextPos: number = startPos;
  let openBrackets = 1;
  let openCode = 0;

  for (let i = startPos + 1; i < str.length; i++) {
    const chr = str[i];
    nextPos = i;
    if (chr === '`') {
      openCode = 1 - openCode;
    }
    if (openCode === 0) {
      if (chr === beginMarker) {
        openBrackets++;
      } else if (chr === endMarker) {
        openBrackets--;
        if (openBrackets === 0) {
          break;
        }
      }
    }
    content += chr;
  }

  if (openBrackets > 0) {
    return { res: false, content: content };
  }

  return {
    res: true,
    content: content,
    nextPos: nextPos + endMarker.length
  };
};