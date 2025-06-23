// ./react/shared/ui/codemirror-editor/Editor.tsx

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
  
  // onContentChange 함수가 리렌더링되어도 useEffect가 다시 실행되지 않도록 ref에 저장
  const onContentChangeRef = useRef(onContentChange);
  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  // [핵심 수정 1] CodeMirror 인스턴스 생성 로직
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const extensions = [
      basicSetup({
        lineNumbers: true,
        foldGutter: true,
        lineWrapping: true,
        darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
        onSave: () => {
          console.log(viewRef.current?.state.doc.toString());
        },
      }),
      EditorView.updateListener.of((update) => {
        // 사용자가 직접 에디터를 수정했을 때만 부모 컴포넌트에 알림
        if (update.docChanged) {
          onContentChangeRef.current?.(update.state.doc.toString());
        }
      })
    ];

    configureMmdAutoCompleteForCodeMirror(extensions);

    const startState = EditorState.create({
      doc: initialContent,
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
    
  }, []); // 이 useEffect는 마운트 시 한 번만 실행되어야 합니다.

  // [핵심 수정 2] 외부에서 initialContent prop이 변경되었을 때 에디터 내용을 업데이트하는 로직 추가
  useEffect(() => {
    const view = viewRef.current;
    if (view && initialContent !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: initialContent }
      });
    }
  }, [initialContent]); // initialContent가 변경될 때마다 이 효과를 실행합니다.

  return <div ref={editorRef} className="editor-wrapper" />;
};

export default React.memo(Editor);