import React, { useCallback, useEffect, useState } from 'react'; // useState 추가
import type { Problem } from '../../../entities/problem/model/types';
import Editor from '../../../shared/ui/codemirror-editor/Editor';
import ActionButton from '../../../shared/ui/actionbutton/ActionButton';
import { LuCheck, LuUndo2 } from 'react-icons/lu';
import ProblemMetadataEditor from './ProblemMetadataEditor';
import './ProblemTextEditor.css';

const EDITABLE_METADATA_FIELDS: (keyof Problem)[] = [
    'question_number', 'source', 'grade', 'semester', 'major_chapter_id', 
    'middle_chapter_id', 'core_concept_id', 'problem_category', 
    'difficulty', 'score', 'answer', 'page', 'problem_type'
];

type ProcessedProblem = Problem & { uniqueId: string; display_question_number: string; };

interface ProblemTextEditorProps {
    problem: ProcessedProblem;
    onSave: (updatedProblem: ProcessedProblem) => void;
    onRevert: (problemId: string) => void; 
    onClose: () => void;
    onProblemChange: (updatedProblem: ProcessedProblem) => void;
}

// [핵심 1] 디바운싱을 적용할 텍스트 필드를 위한 별도 상태 관리
const ProblemTextEditor: React.FC<ProblemTextEditorProps> = ({ 
    problem, 
    onSave, 
    onRevert,
    onProblemChange,
}) => {
    // console.log(`[LOG] ProblemTextEditor: 🎨 렌더링 시작. 문제 ID: ${problem.uniqueId}`);

    // 로컬 상태: question_text와 solution_text를 위한 별도 상태를 만듭니다.
    const [localQuestionText, setLocalQuestionText] = useState(problem.question_text ?? '');
    const [localSolutionText, setLocalSolutionText] = useState(problem.solution_text ?? '');
    const [localProblemData, setLocalProblemData] = useState(problem);

    // prop으로 받은 problem이 변경되면 로컬 상태를 동기화합니다.
    // (예: '초기화' 버튼을 눌렀을 때)
    useEffect(() => {
        setLocalQuestionText(problem.question_text ?? '');
        setLocalSolutionText(problem.solution_text ?? '');
        setLocalProblemData(problem);
    }, [problem]);

    // [핵심 2] useEffect를 사용한 디바운싱 구현
    useEffect(() => {
        // 타이핑이 멈춘 후 300ms 뒤에 onProblemChange를 호출합니다.
        const handler = setTimeout(() => {
            // 로컬 상태가 부모로부터 받은 상태와 다를 때만 업데이트를 전파합니다.
            if (problem.question_text !== localQuestionText || problem.solution_text !== localSolutionText) {
                console.log('[LOG] Debounced update 실행! 상위 컴포넌트로 변경사항 전파');
                onProblemChange({ 
                    ...localProblemData, 
                    question_text: localQuestionText,
                    solution_text: localSolutionText
                });
            }
        }, 300); // 300ms 디바운스

        // 다음 effect가 실행되기 전, 또는 컴포넌트가 언마운트될 때 타이머를 정리합니다.
        return () => {
            clearTimeout(handler);
        };
    }, [localQuestionText, localSolutionText, onProblemChange, problem, localProblemData]);
    

    const handleMetadataChange = useCallback((field: keyof Problem, value: string | number) => {
        // 메타데이터는 즉시 반영합니다. (디바운싱 없음)
        const updatedProblem = { ...localProblemData, [field]: value };
        setLocalProblemData(updatedProblem);
        onProblemChange(updatedProblem);
    }, [localProblemData, onProblemChange]);

    const handleSave = () => {
        // 저장 시에는 현재 로컬 상태를 기준으로 저장합니다.
        onSave({ 
            ...localProblemData, 
            question_text: localQuestionText,
            solution_text: localSolutionText 
        });
    };

    const handleRevert = () => {
        // 초기화는 상위 컴포넌트의 revert 액션을 그대로 사용합니다.
        onRevert(problem.uniqueId);
    };

    return (
        <div className="problem-text-editor-container">
            <div className="editor-header">
                <h4 className="editor-title">{problem.display_question_number}번 문제 수정</h4>
                <div className="editor-actions">
                    <ActionButton onClick={handleRevert} aria-label="변경사항 초기화">
                        <LuUndo2 size={14} style={{ marginRight: '4px' }} />
                        초기화
                    </ActionButton>
                    <ActionButton onClick={handleSave} className="primary" aria-label="변경사항 저장">
                        <LuCheck size={14} style={{ marginRight: '4px' }} />
                        저장
                    </ActionButton>
                </div>
            </div>
            
            <div className="editor-body-wrapper">
                <div className="editor-section">
                    <h5 className="editor-section-title">문제 본문</h5>
                    <div className="editor-wrapper-body">
                        <Editor 
                            // Editor의 내용은 로컬 상태와 동기화됩니다.
                            initialContent={localQuestionText}
                            // Editor의 변경은 onProblemChange가 아닌 로컬 상태를 업데이트합니다.
                            onContentChange={setLocalQuestionText}
                        />
                    </div>
                </div>

                <ProblemMetadataEditor
                    fields={EDITABLE_METADATA_FIELDS}
                    // 메타데이터는 problem 객체에서 직접 가져옵니다.
                    problemData={localProblemData}
                    onDataChange={handleMetadataChange}
                />

                <div className="editor-section">
                    <h5 className="editor-section-title">해설</h5>
                    <div className="editor-wrapper-body">
                        <Editor
                            initialContent={localSolutionText}
                            onContentChange={setLocalSolutionText}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ProblemTextEditor);