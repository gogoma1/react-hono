// ./react/entities/problem-set/ui/MyLibrary.tsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMyProblemSetsQuery } from '../model/useProblemSetQuery';
import { 
    useUpdateProblemSetMutation, 
    useDeleteProblemSetMutation,
} from '../model/useProblemSetMutations';
import { LuBook, LuLoader, LuCircleAlert, LuPencil, LuTrash2, LuFilePlus, LuChevronDown, LuChevronRight } from 'react-icons/lu';
import { useToast } from '../../../shared/store/toastStore';
import Modal from '../../../shared/ui/modal/Modal';
import './MyLibrary.css';
import type { MyProblemSet } from '../model/types';

interface ProblemSetItemProps {
    problemSet: MyProblemSet;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onStartEdit: (id: string, currentName: string) => void;
    onDelete: (id: string) => void;
}

const ProblemSetItem: React.FC<ProblemSetItemProps> = ({ problemSet, isSelected, onSelect, onStartEdit, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const headerClassName = `problem-set-header ${isSelected ? 'selected' : ''}`;

    return (
        <li className="problem-set-item">
            <div className={headerClassName} onClick={() => onSelect(problemSet.problem_set_id)} onDoubleClick={() => setIsExpanded(!isExpanded)} aria-expanded={isExpanded}>
                <button className="expand-button" onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
                    {isExpanded ? <LuChevronDown className="expand-icon"/> : <LuChevronRight className="expand-icon" />}
                </button>
                <LuBook size={16} />
                <span className="set-name">
                    {problemSet.name}
                </span>
                <span className="problem-count">({problemSet.problem_count}문제)</span>
                
                <div className="item-actions">
                    <button onClick={(e) => { e.stopPropagation(); onStartEdit(problemSet.problem_set_id, problemSet.name); }} className="action-btn" aria-label="이름 변경">
                        <LuPencil size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(problemSet.problem_set_id); }} className="action-btn destructive" aria-label="삭제">
                        <LuTrash2 size={14} />
                    </button>
                </div>
            </div>
            {isExpanded && (
                <ul className="source-list">
                    {problemSet.sources.length > 0 ? (
                        problemSet.sources.map(source => (
                            <li key={source.source_id} className="source-item">
                                <span className="source-name">{source.name}</span>
                                <span className="source-count">{source.count}개</span>
                            </li>
                        ))
                    ) : (
                        <li className="source-item-empty">포함된 출처 정보가 없습니다.</li>
                    )}
                </ul>
            )}
        </li>
    );
};

interface MyLibraryProps {
    onProblemSetSelect: (id: string) => void;
    selectedId: string;
    onInitiateNew: () => void;
}

const MyLibrary: React.FC<MyLibraryProps> = ({ onProblemSetSelect, selectedId, onInitiateNew }) => {
    const { data: problemSets, isLoading, isError } = useMyProblemSetsQuery();
    const { mutate: updateProblemSet } = useUpdateProblemSetMutation();
    const { mutate: deleteProblemSet, isPending: isDeleting } = useDeleteProblemSetMutation();
    // [제거] 사용하지 않는 createProblemSet 훅 제거
    
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    const sortedProblemSets = useMemo(() => {
        if (!problemSets) return [];
        return [...problemSets].sort((a, b) => {
            if (a.problem_set_id === editingId) return -1;
            if (b.problem_set_id === editingId) return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }, [problemSets, editingId]);

    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingId]);

    const handleStartEdit = (id: string, currentName: string) => {
        setEditingId(id);
        setEditingName(currentName);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName('');
    };

    const handleSaveEdit = () => {
        if (!editingId || !editingName.trim()) {
            handleCancelEdit();
            return;
        }
        updateProblemSet(
            { problemSetId: editingId, payload: { name: editingName.trim() } },
            { onSettled: handleCancelEdit }
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSaveEdit();
        else if (e.key === 'Escape') handleCancelEdit();
    };

    const handleConfirmDelete = () => {
        if (!deletingId) return;
        deleteProblemSet(deletingId, {
            onSettled: () => setDeletingId(null)
        });
    };
    
    const handleCreateNewSet = () => {
        onInitiateNew();
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="my-library-status"><LuLoader className="spinner" /> <span>내 서재를 불러오는 중...</span></div>;
        }
        if (isError) {
            return <div className="my-library-status error"><LuCircleAlert /> <span>오류가 발생했습니다.</span></div>;
        }
        if (sortedProblemSets.length === 0) {
             return <div className="my-library-status"><p>생성된 문제집이 없습니다.</p></div>;
        }
        return (
            <ul className="problem-set-list">
                {sortedProblemSets.map(ps => (
                    editingId === ps.problem_set_id ? (
                        <li key={ps.problem_set_id} className="problem-set-item editing">
                             <div className="problem-set-header">
                                <LuBook size={16} />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onBlur={handleSaveEdit}
                                    onKeyDown={handleKeyDown}
                                    className="name-input"
                                />
                             </div>
                        </li>
                    ) : (
                        <ProblemSetItem
                            key={ps.problem_set_id}
                            problemSet={ps}
                            isSelected={selectedId === ps.problem_set_id}
                            onSelect={onProblemSetSelect}
                            onStartEdit={handleStartEdit}
                            onDelete={() => setDeletingId(ps.problem_set_id)}
                        />
                    )
                ))}
            </ul>
        );
    }

    return (
        <div className="my-library-widget self-contained">
            <header className="widget-header">
                <h4 className="widget-title">작업 대상 선택</h4>
            </header>
            <div className="widget-content">
                <button 
                    className={`new-set-selector ${selectedId === 'new' ? 'selected' : ''}`}
                    onClick={handleCreateNewSet}
                >
                    <LuFilePlus size={18} />
                    <span>새 문제집 만들기</span>
                </button>
                <div className="selection-divider"><span>또는 기존 문제집에 추가</span></div>
                <div className="library-list-wrapper">
                    {renderContent()}
                </div>
            </div>
            
            <Modal
                isOpen={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={handleConfirmDelete}
                title="문제집 삭제 확인"
                confirmText="삭제"
                isConfirming={isDeleting}
                isConfirmDestructive
            >
                <p>
                    정말로 이 문제집을 삭제하시겠습니까?
                    <br />
                    문제집만 삭제되며, 포함된 문제들은 삭제되지 않습니다.
                </p>
            </Modal>
        </div>
    );
};

export default MyLibrary;