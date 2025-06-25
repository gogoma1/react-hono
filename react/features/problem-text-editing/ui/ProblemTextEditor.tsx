import React, { useCallback } from 'react';
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
    onRevert: (problemId: string) => void; // 이름 변경
    onClose: () => void;
    onProblemChange: (updatedProblem: ProcessedProblem) => void;
}

const ProblemTextEditor: React.FC<ProblemTextEditorProps> = ({ 
    problem, 
    onSave, 
    onRevert, // 이름 변경
    onClose,
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

    const handleRevert = () => {
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
                            initialContent={problem.question_text ?? ''}
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