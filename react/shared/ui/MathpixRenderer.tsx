// ./react/shared/ui/MathpixRenderer.tsx

import React, { useState, useEffect, useMemo } from 'react';

// window 객체에 필요한 타입들을 선언합니다.
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

const MathpixRenderer: React.FC<MathpixRendererProps> = ({ text, options = {} }) => {
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
};

export default MathpixRenderer;