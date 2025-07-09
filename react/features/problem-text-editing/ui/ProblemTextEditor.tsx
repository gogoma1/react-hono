import React, { useCallback, useEffect, useState, useRef } from 'react';
import type { Problem } from '../../../entities/problem/model/types';
import Editor from '../../../shared/ui/codemirror-editor/Editor';
import LoadingButton from '../../../shared/ui/loadingbutton/LoadingButton';
import ActionButton from '../../../shared/ui/actionbutton/ActionButton';
import { LuCheck, LuUndo2, LuTrash2 } from 'react-icons/lu';
import ProblemMetadataEditor from './ProblemMetadataEditor';
import Modal from '../../../shared/ui/modal/Modal';
import { useDeleteProblemsMutation } from '../../../entities/problem/model/useProblemMutations';
import './ProblemTextEditor.css';

// [수정] problem_type과 answer를 배열의 맨 앞으로 이동
const EDITABLE_METADATA_FIELDS: (keyof Problem)[] = [
    'problem_type', 'answer', 'question_number', 'source', 'grade', 'semester', 
    'major_chapter_id', 'middle_chapter_id', 'core_concept_id', 'problem_category', 
    'difficulty', 'score', 'page'
];

type ProcessedProblem = Problem & { uniqueId: string; display_question_number: string; };

interface ProblemTextEditorProps {
    problem: ProcessedProblem;
    isSaving?: boolean;
    onSave: (updatedProblem: ProcessedProblem) => void;
    onRevert: (problemId: string) => void; 
    onClose: () => void;
    onProblemChange: (updatedProblem: ProcessedProblem) => void;
}

const ProblemTextEditor: React.FC<ProblemTextEditorProps> = ({ 
    problem, 
    isSaving = false,
    onSave, 
    onRevert,
    onClose,
    onProblemChange,
}) => {
    const [localQuestionText, setLocalQuestionText] = useState(problem.question_text ?? '');
    const [localSolutionText, setLocalSolutionText] = useState(problem.solution_text ?? '');
    const [localProblemData, setLocalProblemData] = useState(problem);
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const { mutate: deleteProblem, isPending: isDeleting } = useDeleteProblemsMutation();

    // [수정] 초기 높이를 300px로 변경
    const [questionEditorHeight, setQuestionEditorHeight] = useState(300);
    const [solutionEditorHeight, setSolutionEditorHeight] = useState(300);
    const [draggingResizer, setDraggingResizer] = useState<'question' | 'solution' | null>(null);
    const dragStartRef = useRef({ y: 0, initialHeight: 0 });

    useEffect(() => {
        setLocalQuestionText(problem.question_text ?? '');
        setLocalSolutionText(problem.solution_text ?? '');
        setLocalProblemData(problem);
    }, [problem]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (problem.question_text !== localQuestionText || problem.solution_text !== localSolutionText) {
                onProblemChange({ 
                    ...localProblemData, 
                    question_text: localQuestionText,
                    solution_text: localSolutionText
                });
            }
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [localQuestionText, localSolutionText, onProblemChange, problem, localProblemData]);
    
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, type: 'question' | 'solution') => {
        e.preventDefault();
        setDraggingResizer(type);
        dragStartRef.current = {
            y: e.clientY,
            initialHeight: type === 'question' ? questionEditorHeight : solutionEditorHeight,
        };
    }, [questionEditorHeight, solutionEditorHeight]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!draggingResizer) return;

        const deltaY = e.clientY - dragStartRef.current.y;
        const newHeight = dragStartRef.current.initialHeight + deltaY;
        const clampedHeight = Math.max(50, newHeight);

        if (draggingResizer === 'question') {
            setQuestionEditorHeight(clampedHeight);
        } else if (draggingResizer === 'solution') {
            setSolutionEditorHeight(clampedHeight);
        }
    }, [draggingResizer]);

    const handleMouseUp = useCallback(() => {
        setDraggingResizer(null);
    }, []);

    useEffect(() => {
        if (draggingResizer) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'ns-resize';
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
        };
    }, [draggingResizer, handleMouseMove, handleMouseUp]);

    const handleMetadataChange = useCallback((field: keyof Problem, value: string | number) => {
        const updatedProblem = { ...localProblemData, [field]: value };
        setLocalProblemData(updatedProblem);
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
            <div className={`problem-text-editor-container ${draggingResizer ? 'is-dragging' : ''}`}>
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
                    <div className="editor-section" style={{ height: `${questionEditorHeight}px` }}>
                        <h5 className="editor-section-title">문제 본문</h5>
                        <div className="editor-wrapper-body">
                            <Editor 
                                initialContent={localQuestionText}
                                onContentChange={setLocalQuestionText}
                            />
                        </div>
                    </div>
                    
                    <div 
                        className="editor-resizer" 
                        onMouseDown={(e) => handleMouseDown(e, 'question')}
                        aria-label="문제 본문 에디터 크기 조절"
                        role="separator"
                        tabIndex={0}
                    />
                    
                    <div className="editor-section" style={{ height: `${solutionEditorHeight}px` }}>
                        <h5 className="editor-section-title">해설</h5>
                        <div className="editor-wrapper-body">
                            <Editor
                                initialContent={localSolutionText}
                                onContentChange={setLocalSolutionText}
                            />
                        </div>
                    </div>

                    <div 
                        className="editor-resizer" 
                        onMouseDown={(e) => handleMouseDown(e, 'solution')}
                        aria-label="해설 에디터 크기 조절"
                        role="separator"
                        tabIndex={0}
                    />

                    <ProblemMetadataEditor
                        fields={EDITABLE_METADATA_FIELDS}
                        problemData={localProblemData}
                        onDataChange={handleMetadataChange}
                    />
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