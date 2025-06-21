import React, { useRef, useEffect } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from './codemirror-setup/basic-setup';
import configureMmdAutoCompleteForCodeMirror from './codemirror-setup/auto-complete/configure';
import './editor-style.scss';

interface EditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

const Editor: React.FC<EditorProps> = ({ initialContent = '', onContentChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  
  // onContentChange 함수가 재렌더링으로 인해 바뀌더라도 최신 함수를 참조하기 위한 ref
  const onContentChangeRef = useRef(onContentChange);
  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);


  useEffect(() => {
    if (!editorRef.current) return;

    // 이미 인스턴스가 생성되어 있다면, 아무것도 하지 않고 종료.
    // 이렇게 하면 실수로 여러 번 실행되는 것을 완벽히 방지합니다.
    if (viewRef.current) return;
    
    const extensions = [
      basicSetup({
        lineNumbers: true,
        foldGutter: true,
        lineWrapping: true,
        darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
        onSave: () => {
          alert('Content saved!');
          console.log(viewRef.current?.state.doc.toString());
        },
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          // ref에 저장된 최신 콜백 함수를 호출합니다.
          onContentChangeRef.current?.(update.state.doc.toString());
        }
      })
    ];

    configureMmdAutoCompleteForCodeMirror(extensions);

    const startState = EditorState.create({
      doc: initialContent, // 초기값으로만 사용
      extensions: extensions,
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    
    // ✅ [핵심 수정] 의존성 배열을 비워서 컴포넌트가 처음 마운트될 때 "단 한 번만" 실행되도록 합니다.
  }, []); 

  return <div ref={editorRef} className="editor-wrapper" />;
};

// React.memo로 감싸서 불필요한 렌더링을 한 번 더 방지합니다.
export default React.memo(Editor);