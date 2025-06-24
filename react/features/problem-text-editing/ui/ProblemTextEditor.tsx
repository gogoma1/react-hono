import React, { useCallback } from 'react';
import type { Problem } from '../../../entities/problem/model/types';
import Editor from '../../../shared/ui/codemirror-editor/Editor';
import ActionButton from '../../../shared/ui/actionbutton/ActionButton';
import { LuCheck, LuX } from 'react-icons/lu';
import ProblemMetadataEditor from './ProblemMetadataEditor';
import './ProblemTextEditor.css';

const EDITABLE_METADATA_FIELDS: (keyof Problem)[] = [
    'question_number', 'source', 'grade', 'semester', 'major_chapter_id', 
    'middle_chapter_id', 'core_concept_id', 'problem_category', 
    'difficulty', 'score', 'answer', 'page', 'problem_type'
];

type ProcessedProblem = Problem & { uniqueId: string; display_question_number: string; };

const ProblemTextEditor: React.FC<{
    problem: ProcessedProblem;
    onSave: (problemId: number | string, updatedProblem: Partial<Problem>) => void;
    onClose: () => void;
    onProblemChange: (updatedProblem: ProcessedProblem) => void;
}> = ({ problem, onSave, onClose, onProblemChange }) => {

    // [수정] 이 콜백은 이제 필드 이름을 인자로 받지 않습니다.
    const handleContentChange = useCallback((field: 'question_text' | 'solution_text', newContent: string) => {
        onProblemChange({ ...problem, [field]: newContent });
    }, [problem, onProblemChange]);

    const handleMetadataChange = useCallback((field: keyof Problem, value: string | number) => {
        onProblemChange({ ...problem, [field]: value });
    }, [problem, onProblemChange]);

    const handleSave = () => {
        onSave(problem.question_number, problem);
        onClose();
    };

    return (
        <div className="problem-text-editor-container">
            <div className="editor-header">
                <h4 className="editor-title">{problem.display_question_number}번 문제 수정</h4>
                <div className="editor-actions">
                    <ActionButton onClick={onClose} aria-label="취소">
                        <LuX size={14} style={{ marginRight: '4px' }} />
                        취소
                    </ActionButton>
                    <ActionButton onClick={handleSave} className="primary" aria-label="저장">
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
                            initialContent={problem.question_text}
                            // [최종 수정] Editor가 요구하는 (content: string) => void 시그니처에 맞게 함수를 전달합니다.
                            onContentChange={(content) => handleContentChange('question_text', content)}
                        />
                    </div>
                </div>

                <ProblemMetadataEditor
                    fields={EDITABLE_METADATA_FIELDS}
                    problemData={problem}
                    onDataChange={handleMetadataChange}
                />

                <div className="editor-section">
                    <h5 className="editor-section-title">해설</h5>
                    <div className="editor-wrapper-body">
                        <Editor
                            initialContent={problem.solution_text ?? ''}
                            // [최종 수정] 여기도 마찬가지로 시그니처에 맞게 함수를 전달합니다.
                            onContentChange={(content) => handleContentChange('solution_text', content)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProblemTextEditor;