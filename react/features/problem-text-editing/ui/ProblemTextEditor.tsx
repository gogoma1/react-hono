import React, { useCallback } from 'react';
import type { Problem } from '../../../entities/problem/model/types';
import Editor from '../../../shared/ui/codemirror-editor/Editor';
import ActionButton from '../../../shared/ui/actionbutton/ActionButton';
// [수정] LuX 아이콘 import 제거, LuUndo2는 유지
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
    onCancel: (problemId: string) => void;
    onClose: () => void; // 이 prop은 GlassSidebarRight의 닫기 버튼과 연결됩니다.
    onProblemChange: (updatedProblem: ProcessedProblem) => void;
}

const ProblemTextEditor: React.FC<ProblemTextEditorProps> = ({ 
    problem, 
    onSave, 
    onCancel,
    onClose, // prop은 받지만 컴포넌트 내에서 직접 사용하지는 않습니다.
    onProblemChange 
}) => {

    const handleContentChange = useCallback((field: 'question_text' | 'solution_text', newContent: string) => {
        onProblemChange({ ...problem, [field]: newContent });
    }, [problem, onProblemChange]);

    const handleMetadataChange = useCallback((field: keyof Problem, value: string | number) => {
        onProblemChange({ ...problem, [field]: value });
    }, [problem, onProblemChange]);

    const handleSave = () => {
        onSave(problem);
    };

    const handleCancel = () => {
        onCancel(problem.uniqueId);
    };

    return (
        <div className="problem-text-editor-container">
            <div className="editor-header">
                <h4 className="editor-title">{problem.display_question_number}번 문제 수정</h4>
                <div className="editor-actions">
                    {/* '취소' 버튼: 변경사항을 되돌리고 닫음 */}
                    <ActionButton onClick={handleCancel} aria-label="변경사항 취소">
                        <LuUndo2 size={14} style={{ marginRight: '4px' }} />
                        취소
                    </ActionButton>
                    {/* '저장' 버튼: 변경사항을 DB에 저장하고 닫음 */}
                    <ActionButton onClick={handleSave} className="primary" aria-label="변경사항 저장">
                        <LuCheck size={14} style={{ marginRight: '4px' }} />
                        저장
                    </ActionButton>
                    {/* [삭제] 컴포넌트 내의 'X' 닫기 버튼을 제거합니다. */}
                </div>
            </div>
            
            <div className="editor-body-wrapper">
                <div className="editor-section">
                    <h5 className="editor-section-title">문제 본문</h5>
                    <div className="editor-wrapper-body">
                        <Editor 
                            initialContent={problem.question_text}
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
                            onContentChange={(content) => handleContentChange('solution_text', content)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProblemTextEditor;