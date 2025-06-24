// react/shared/ui/MathpixRenderer.tsx

import React, { useState, useEffect, useMemo } from 'react';

// 타입 정의
declare global {
  interface Window {
    markdownToHTML: (text: string, options?: object) => string;
    mathpixReady: Promise<boolean>;
    loadMathJax: () => boolean;
  }
}

interface MathpixRendererProps {
  text: string;
  options?: object;
  // [수정 1] onRenderComplete prop을 타입에 추가합니다.
  onRenderComplete?: () => void;
}

const MathpixRenderer: React.FC<MathpixRendererProps> = ({ text, options = {}, onRenderComplete }) => {
  const [html, setHtml] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const memoizedOptions = useMemo(() => ({
    htmlTags: true,
    width: 800,
    ...options,
  }), [options]);

  useEffect(() => {
    let isCancelled = false;
    
    const initialize = async () => {
      try {
        await window.mathpixReady;
        if (isCancelled) return;
        
        if (typeof window.markdownToHTML === 'function') {
          setStatus('ready');
        } else {
          setStatus('error');
          console.error('[MathpixRenderer] Error: window.markdownToHTML function not found.');
        }
      } catch (err) {
        if (!isCancelled) {
          setStatus('error');
          console.error('[MathpixRenderer] Error: The mathpixReady Promise was rejected.', err);
        }
      }
    };
    
    initialize();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status === 'ready') {
      try {
        const renderedHtml = window.markdownToHTML(text, memoizedOptions);
        setHtml(renderedHtml);
      } catch (err) {
        console.error("Markdown rendering error:", err);
        setHtml('<p style="color: red;">콘텐츠를 렌더링하는 중 오류가 발생했습니다.</p>');
      } finally {
        // [수정 2] 렌더링 시도가 끝나면(성공이든 실패든) onRenderComplete 콜백을 호출합니다.
        // requestAnimationFrame을 사용하여 DOM 업데이트가 반영된 후에 호출되도록 합니다.
        if (onRenderComplete) {
            requestAnimationFrame(() => {
                onRenderComplete();
            });
        }
      }
    }
  }, [status, text, memoizedOptions, onRenderComplete]); // [수정 3] 의존성 배열에 onRenderComplete 추가

  
  if (status === 'error') {
    return <p style={{ color: 'red' }}>미리보기 라이브러리를 로드할 수 없습니다.</p>;
  }

  if (status === 'loading') {
    return <p>미리보기 라이브러리 로딩 중...</p>;
  }

  // dangerouslySetInnerHTML를 사용하므로, 래퍼 div를 사용하여 이 컴포넌트의 루트 요소를 만듭니다.
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export default MathpixRenderer;