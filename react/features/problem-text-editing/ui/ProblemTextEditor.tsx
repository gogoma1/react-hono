import React, { useCallback, useEffect, useState } from 'react';
import type { Problem } from '../../../entities/problem/model/types';
import Editor from '../../../shared/ui/codemirror-editor/Editor';
import LoadingButton from '../../../shared/ui/loadingbutton/LoadingButton';
import ActionButton from '../../../shared/ui/actionbutton/ActionButton';
import { LuCheck, LuUndo2, LuTrash2 } from 'react-icons/lu';
import ProblemMetadataEditor from './ProblemMetadataEditor';
import Modal from '../../../shared/ui/modal/Modal';
import { useDeleteProblemsMutation } from '../../../entities/problem/model/useProblemMutations';
import './ProblemTextEditor.css';

const EDITABLE_METADATA_FIELDS: (keyof Problem)[] = [
    'question_number', 'source', 'grade', 'semester', 'major_chapter_id', 
    'middle_chapter_id', 'core_concept_id', 'problem_category', 
    'difficulty', 'score', 'answer', 'page', 'problem_type'
];

type ProcessedProblem = Problem & { uniqueId: string; display_question_number: string; };

interface ProblemTextEditorProps {
    problem: ProcessedProblem;
    isSaving?: boolean;
    onSave: (updatedProblem: ProcessedProblem) => void;
    onRevert: (problemId: string) => void; 
    onClose: () => void;
    // [수정] 실시간 업데이트를 위해 onProblemChange prop을 다시 추가합니다.
    onProblemChange: (updatedProblem: ProcessedProblem) => void;
}

const ProblemTextEditor: React.FC<ProblemTextEditorProps> = ({ 
    problem, 
    isSaving = false,
    onSave, 
    onRevert,
    onClose,
    // [수정] prop을 다시 받습니다.
    onProblemChange,
}) => {
    const [localQuestionText, setLocalQuestionText] = useState(problem.question_text ?? '');
    const [localSolutionText, setLocalSolutionText] = useState(problem.solution_text ?? '');
    const [localProblemData, setLocalProblemData] = useState(problem);
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const { mutate: deleteProblem, isPending: isDeleting } = useDeleteProblemsMutation();

    useEffect(() => {
        setLocalQuestionText(problem.question_text ?? '');
        setLocalSolutionText(problem.solution_text ?? '');
        setLocalProblemData(problem);
    }, [problem]);

    // [수정] 실시간 미리보기를 위해 debounce 처리된 useEffect를 다시 복원합니다.
    useEffect(() => {
        const handler = setTimeout(() => {
            // 텍스트가 실제로 변경되었을 때만 상위로 전파
            if (problem.question_text !== localQuestionText || problem.solution_text !== localSolutionText) {
                onProblemChange({ 
                    ...localProblemData, 
                    question_text: localQuestionText,
                    solution_text: localSolutionText
                });
            }
        }, 300); // 300ms 디바운스

        return () => {
            clearTimeout(handler);
        };
    }, [localQuestionText, localSolutionText, onProblemChange, problem, localProblemData]);
    
    const handleMetadataChange = useCallback((field: keyof Problem, value: string | number) => {
        const updatedProblem = { ...localProblemData, [field]: value };
        setLocalProblemData(updatedProblem);
        // 메타데이터 변경은 즉시 상위로 전파하여 미리보기(예: 헤더)에 반영
        onProblemChange(updatedProblem);
    }, [localProblemData, onProblemChange]);

    const handleSave = () => {
        onSave({ 
            ...localProblemData, 
            question_text: localQuestionText,
            solution_text: localSolutionText 
        });
    };

    const handleRevert = () => {
        onRevert(problem.uniqueId);
    };

    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        deleteProblem([problem.problem_id], {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                onClose(); 
            },
            onError: () => {
                setIsDeleteModalOpen(true); 
            }
        });
    };

    return (
        <>
            <div className="problem-text-editor-container">
                <div className="editor-header">
                    <h4 className="editor-title">{problem.display_question_number}번 문제 수정</h4>
                    <div className="editor-actions">
                        <ActionButton onClick={handleRevert} aria-label="변경사항 초기화" disabled={isSaving || isDeleting}>
                            <LuUndo2 size={14} className="action-icon" />
                            초기화
                        </ActionButton>
                        
                        <LoadingButton
                            onClick={handleDeleteClick}
                            className="destructive"
                            aria-label="문제 영구 삭제"
                            isLoading={isDeleting}
                            disabled={isSaving}
                            loadingText="삭제중..."
                        >
                            <LuTrash2 size={14} className="action-icon" />
                            영구 삭제
                        </LoadingButton>

                        <LoadingButton 
                            onClick={handleSave} 
                            className="primary" 
                            aria-label="변경사항 저장"
                            isLoading={isSaving}
                            disabled={isDeleting}
                            loadingText="저장중..."
                        >
                            <LuCheck size={14} className="action-icon" />
                            저장
                        </LoadingButton>
                    </div>
                </div>
                
                <div className="editor-body-wrapper">
                    <div className="editor-section">
                        <h5 className="editor-section-title">문제 본문</h5>
                        <div className="editor-wrapper-body">
                            <Editor 
                                initialContent={localQuestionText}
                                onContentChange={setLocalQuestionText}
                            />
                        </div>
                    </div>

                    <ProblemMetadataEditor
                        fields={EDITABLE_METADATA_FIELDS}
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

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                isConfirming={isDeleting}
                title="문제 영구 삭제 확인"
                confirmText="삭제"
                size="small"
            >
                <p>
                    정말로 이 문제를 영구적으로 삭제하시겠습니까?
                    <br />
                    이 작업은 되돌릴 수 없습니다.
                </p>
            </Modal>
        </>
    );
};

export default React.memo(ProblemTextEditor);