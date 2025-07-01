import React, { useState, useEffect, useMemo } from 'react';

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
}

// [핵심 수정] 컴포넌트를 React.memo로 감싸서 props가 변경되지 않으면 재렌더링을 방지합니다.
const MathpixRenderer: React.FC<MathpixRendererProps> = React.memo(({ text, options = {} }) => {
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
      }
    }
  }, [status, text, memoizedOptions]);

  
  if (status === 'error') {
    return <p style={{ color: 'red' }}>미리보기 라이브러리를 로드할 수 없습니다.</p>;
  }

  if (status === 'loading') {
    return <p>미리보기 라이브러리 로딩 중...</p>;
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
});

// [핵심 수정] displayName 추가 (디버깅 용이)
MathpixRenderer.displayName = 'MathpixRenderer';

export default MathpixRenderer;