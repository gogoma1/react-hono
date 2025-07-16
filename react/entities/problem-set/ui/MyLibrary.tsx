import React, { useState } from 'react';
import { useGroupedProblemSetsQuery, useCurriculumViewQuery } from '../model/useProblemSetQuery';
import { useDeleteSubtitleFromSetMutation, useDeleteProblemSetMutation } from '../model/useProblemSetMutations'; // [수정] 문제집 삭제 훅 import
import { 
    LuLoader, LuCircleAlert, LuChevronDown, LuChevronRight, 
    LuBookCopy, LuGraduationCap, LuComponent, LuFolder, LuBook, LuFileText,
    LuSquarePlus, LuTrash2
} from 'react-icons/lu';
import SegmentedControl from '../../../shared/ui/segmented-control/SegmentedControl';
import Modal from '../../../shared/ui/modal/Modal';
import './MyLibrary.css';
import type { LibrarySelection } from '../../../pages/ProblemSetCreationPage';

type ViewMode = 'problemSet' | 'grade' | 'curriculum';

const viewOptions = [
    { value: 'problemSet' as ViewMode, label: '문제집별', icon: <LuBookCopy /> },
    { value: 'grade' as ViewMode, label: '학년별', icon: <LuGraduationCap /> },
    { value: 'curriculum' as ViewMode, label: '단원별', icon: <LuComponent /> },
];

// [수정] 삭제 대상 타입을 더 명확하게 구분
type DeleteTarget = {
    type: 'problemSet' | 'subtitle';
    id: string;
    parentId?: string; // 소제목의 경우 부모인 problemSetId를 저장
    name: string;
} | null;


interface TreeItemProps {
    label: string;
    nodeKey: string;
    count?: number;
    level: number;
    icon?: React.ReactNode;
    isExpanded: boolean;
    isSelected: boolean;
    isAncestorOfSelected: boolean;
    onToggle: (key: string) => void;
    onSelect?: () => void;
    onDelete?: () => void;
    children?: React.ReactNode;
}

const TreeItem: React.FC<TreeItemProps> = React.memo(({ 
    label, nodeKey, count, level, icon, isExpanded, isSelected, isAncestorOfSelected, onToggle, onSelect, onDelete, children 
}) => {
    const isLeaf = !children;
    const itemClassName = `tree-item ${isLeaf ? 'leaf' : 'branch'}`;
    const contentClassName = `tree-item-content ${onSelect ? 'clickable' : ''} ${isSelected ? 'selected' : ''} ${isAncestorOfSelected ? 'ancestor-selected' : ''}`;
    
    const handleRowClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onSelect) {
            onSelect();
        }
        if (!isLeaf) {
            onToggle(nodeKey);
        }
    };
    
    const handleToggleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if(!isLeaf) {
            onToggle(nodeKey);
        }
    }
    
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete();
        }
    }

    const indentStyle = { paddingLeft: `${(level - 1) * 16}px` };

    return (
        <li className={itemClassName}>
            <div className={contentClassName} onClick={handleRowClick} style={indentStyle}>
                <div className="expand-icon-wrapper" onClick={handleToggleClick}>
                    {isLeaf && !onDelete ? <span className="icon-placeholder"/> : (isExpanded ? <LuChevronDown className="expand-icon"/> : <LuChevronRight className="expand-icon" />)}
                </div>
                {icon && <span className="item-type-icon">{icon}</span>}
                <span className="tree-item-label">{label}</span>
                {count !== undefined && <span className="tree-item-count">({count})</span>}
                {onDelete && (
                    <button onClick={handleDeleteClick} className="delete-item-button" aria-label={`${label} 삭제`}>
                        <LuTrash2 size={14} />
                    </button>
                )}
            </div>
            {isExpanded && children && <ul className="tree-group">{children}</ul>}
        </li>
    );
});
TreeItem.displayName = 'TreeItem';


interface MyLibraryProps {
    onSelectionChange: (selection: LibrarySelection) => void;
    selectedKey: string | null;
}

const MyLibrary: React.FC<MyLibraryProps> = ({ onSelectionChange, selectedKey }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('problemSet');
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<DeleteTarget>(null);

    const { data: groupedProblemSetData, isLoading: isLoadingProblemSet, isError: isErrorProblemSet } = useGroupedProblemSetsQuery();
    const { data: curriculumData, isLoading: isLoadingCurriculum, isError: isErrorCurriculum } = useCurriculumViewQuery();
    
    const { mutate: deleteSubtitle, isPending: isDeletingSubtitle } = useDeleteSubtitleFromSetMutation();
    const { mutate: deleteProblemSet, isPending: isDeletingProblemSet } = useDeleteProblemSetMutation();
    const isDeleting = isDeletingSubtitle || isDeletingProblemSet;
    
    const handleToggle = (key: string) => {
        setExpandedKeys(prev => {
            const newSet = new Set(prev);
            newSet.has(key) ? newSet.delete(key) : newSet.add(key);
            return newSet;
        });
    };
    
    const handleOpenDeleteModal = (target: DeleteTarget) => {
        setItemToDelete(target);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setItemToDelete(null);
        setIsDeleteModalOpen(false);
    };
    
    const handleConfirmDelete = () => {
        if (!itemToDelete) return;

        if (itemToDelete.type === 'problemSet') {
            deleteProblemSet(itemToDelete.id, { onSuccess: handleCloseDeleteModal });
        } else if (itemToDelete.type === 'subtitle' && itemToDelete.parentId) {
            deleteSubtitle(
                { problemSetId: itemToDelete.parentId, subtitleId: itemToDelete.id },
                { onSuccess: handleCloseDeleteModal }
            );
        }
    };
    
    const isAncestor = (key: string | null, ancestorKey: string) => {
        return !!(key && key.startsWith(ancestorKey) && key !== ancestorKey);
    }
    
    const getDeleteModalContent = () => {
        if (!itemToDelete) return null;
        if (itemToDelete.type === 'problemSet') {
            return (
                <>
                    <p>정말로 문제집 <strong>'{itemToDelete.name}'</strong>을(를) <strong>영구적으로 삭제</strong>하시겠습니까?</p>
                    <p className="modal-warning">이 작업은 되돌릴 수 없으며, 이 문제집에 포함된 모든 문제와 소제목 정보가 함께 삭제됩니다.</p>
                </>
            );
        }
        if (itemToDelete.type === 'subtitle') {
            return (
                <>
                    <p>정말로 <strong>'{itemToDelete.name}'</strong> 소제목과 관련된 모든 문제를 <strong>영구적으로 삭제</strong>하시겠습니까?</p>
                    <p className="modal-warning">이 작업은 되돌릴 수 없으며, 문제 라이브러리에서 해당 문제의 원본 데이터가 사라집니다.</p>
                </>
            );
        }
        return null;
    }

    const renderContent = () => {
        if (viewMode === 'problemSet' || viewMode === 'grade') {
            if (isLoadingProblemSet) return <div className="my-library-status"><LuLoader className="spinner" /> <span>데이터 로딩 중...</span></div>;
            if (isErrorProblemSet) return <div className="my-library-status error"><LuCircleAlert /> <span>오류가 발생했습니다.</span></div>;
            if (!groupedProblemSetData) return <div className="my-library-status"><p>생성된 문제집(브랜드)이 없습니다.</p></div>;

            if (viewMode === 'problemSet') {
                return (
                    <ul className="tree-group">
                        <TreeItem 
                            nodeKey="new"
                            label="새 문제집 만들기"
                            level={1}
                            icon={<LuSquarePlus />}
                            isSelected={selectedKey === 'new'}
                            isExpanded={false}
                            isAncestorOfSelected={false}
                            onToggle={() => {}}
                            onSelect={() => onSelectionChange({ type: 'new', key: 'new' })}
                        />
                        {groupedProblemSetData.map(ps => {
                            const psKey = `ps-${ps.problem_set_id}`;
                            return (
                                <TreeItem 
                                    key={psKey} 
                                    nodeKey={psKey} 
                                    label={ps.problem_set_name} 
                                    level={1} 
                                    icon={<LuBook />} 
                                    isExpanded={expandedKeys.has(psKey)} 
                                    onToggle={handleToggle} 
                                    isSelected={selectedKey === psKey} 
                                    isAncestorOfSelected={isAncestor(selectedKey, psKey)} 
                                    onSelect={() => onSelectionChange({ type: 'problemSet', key: psKey, problemSetId: ps.problem_set_id, problemSetName: ps.problem_set_name })}
                                    // [핵심 추가] 문제집 노드에 삭제 핸들러 연결
                                    onDelete={() => handleOpenDeleteModal({ type: 'problemSet', id: ps.problem_set_id, name: ps.problem_set_name })}
                                >
                                    {ps.grades.map(grade => {
                                        const gradeKey = `${psKey}-grade-${grade.grade_id}`;
                                        return (
                                            <TreeItem 
                                                key={gradeKey} 
                                                nodeKey={gradeKey} 
                                                label={grade.grade_name} 
                                                level={2} 
                                                icon={<LuFolder />} 
                                                isExpanded={expandedKeys.has(gradeKey)} 
                                                onToggle={handleToggle} 
                                                isSelected={selectedKey === gradeKey} 
                                                isAncestorOfSelected={isAncestor(selectedKey, gradeKey)} 
                                                onSelect={() => onSelectionChange({ type: 'grade', key: gradeKey, problemSetId: ps.problem_set_id, problemSetName: ps.problem_set_name, gradeId: grade.grade_id, gradeName: grade.grade_name })}
                                            >
                                                {grade.subtitles.map(subtitle => {
                                                    const subtitleKey = `${gradeKey}-subtitle-${subtitle.subtitle_id}`;
                                                    return <TreeItem 
                                                        key={subtitleKey} 
                                                        nodeKey={subtitleKey} 
                                                        label={subtitle.subtitle_name} 
                                                        count={subtitle.problem_count} 
                                                        level={3} 
                                                        icon={<LuFileText />} 
                                                        isExpanded={false} 
                                                        onToggle={()=>{}} 
                                                        isSelected={selectedKey === subtitleKey} 
                                                        isAncestorOfSelected={false}
                                                        onSelect={() => onSelectionChange({type: 'subtitle', key: subtitleKey, problemSetId: ps.problem_set_id, problemSetName: ps.problem_set_name, gradeId: grade.grade_id, gradeName: grade.grade_name, subtitleId: subtitle.subtitle_id, subtitleName: subtitle.subtitle_name})} 
                                                        onDelete={() => handleOpenDeleteModal({ type: 'subtitle', id: subtitle.subtitle_id, parentId: ps.problem_set_id, name: subtitle.subtitle_name })}
                                                    />
                                                })}
                                            </TreeItem>
                                        )
                                    })}
                                </TreeItem>
                            )
                        })}
                    </ul>
                );
            }
            
            if (viewMode === 'grade') {
                const byGrade = groupedProblemSetData.reduce<Record<string, { grade_id: string; grade_order: number; items: any[] }>>((acc, ps) => {
                    ps.grades.forEach(grade => {
                        if (!acc[grade.grade_name]) acc[grade.grade_name] = { grade_id: grade.grade_id, grade_order: grade.grade_order, items: [] };
                        acc[grade.grade_name].items.push({ ...ps, grade });
                    });
                    return acc;
                }, {});
                const sortedGrades = Object.values(byGrade).sort((a, b) => a.grade_order - b.grade_order);
                
                return (
                     <ul className="tree-group">
                        <TreeItem 
                            nodeKey="new-in-grade-view"
                            label="새 문제집 만들기"
                            level={1}
                            icon={<LuSquarePlus />}
                            isSelected={selectedKey === 'new'}
                            isExpanded={false}
                            isAncestorOfSelected={false}
                            onToggle={() => {}}
                            onSelect={() => onSelectionChange({ type: 'new', key: 'new' })}
                        />
                        {sortedGrades.map(({grade_id, items}) => {
                             const gradeName = items[0].grade.grade_name;
                             const gradeKey = `grade-${grade_id}`;
                             return (
                                <TreeItem 
                                    key={gradeKey} 
                                    nodeKey={gradeKey} 
                                    label={gradeName} 
                                    level={1} 
                                    icon={<LuFolder />} 
                                    isExpanded={expandedKeys.has(gradeKey)} 
                                    onToggle={handleToggle} 
                                    isSelected={selectedKey === gradeKey} 
                                    isAncestorOfSelected={isAncestor(selectedKey, gradeKey)} 
                                    onSelect={() => onSelectionChange({ type: 'grade', key: gradeKey, gradeId: grade_id, gradeName: gradeName})}
                                >
                                   {items.map((item: any) => {
                                       const psKey = `${gradeKey}-ps-${item.problem_set_id}`;
                                       return (
                                           <TreeItem 
                                                key={psKey} 
                                                nodeKey={psKey} 
                                                label={item.problem_set_name} 
                                                level={2} 
                                                icon={<LuBook />} 
                                                isExpanded={expandedKeys.has(psKey)} 
                                                onToggle={handleToggle} 
                                                isSelected={selectedKey === psKey} 
                                                isAncestorOfSelected={isAncestor(selectedKey, psKey)} 
                                                onSelect={() => onSelectionChange({ type: 'problemSet', key: psKey, problemSetId: item.problem_set_id, problemSetName: item.problem_set_name })}
                                                // [핵심 추가] 문제집 노드에 삭제 핸들러 연결
                                                onDelete={() => handleOpenDeleteModal({ type: 'problemSet', id: item.problem_set_id, name: item.problem_set_name })}
                                            >
                                               {item.grade.subtitles.map((subtitle: any) => {
                                                    const subtitleKey = `${psKey}-subtitle-${subtitle.subtitle_id}`;
                                                    return <TreeItem 
                                                        key={subtitleKey} 
                                                        nodeKey={subtitleKey} 
                                                        label={subtitle.subtitle_name} 
                                                        count={subtitle.problem_count} 
                                                        level={3} icon={<LuFileText />} 
                                                        isExpanded={false} 
                                                        onToggle={()=>{}} 
                                                        isSelected={selectedKey === subtitleKey} 
                                                        isAncestorOfSelected={false}
                                                        onSelect={() => onSelectionChange({type: 'subtitle', key: subtitleKey, problemSetId: item.problem_set_id, problemSetName: item.problem_set_name, gradeId: item.grade.grade_id, gradeName: item.grade.grade_name, subtitleId: subtitle.subtitle_id, subtitleName: subtitle.subtitle_name})} 
                                                        onDelete={() => handleOpenDeleteModal({ type: 'subtitle', id: subtitle.subtitle_id, parentId: item.problem_set_id, name: subtitle.subtitle_name })}
                                                    />
                                               })}
                                           </TreeItem>
                                       )
                                   })}
                                </TreeItem>
                            )
                        })}
                    </ul>
                );
            }
        }

        if (viewMode === 'curriculum') {
            if (isLoadingCurriculum) return <div className="my-library-status"><LuLoader className="spinner" /> <span>데이터 로딩 중...</span></div>;
            if (isErrorCurriculum) return <div className="my-library-status error"><LuCircleAlert /> <span>오류가 발생했습니다.</span></div>;
            if (!curriculumData || curriculumData.length === 0) return <div className="my-library-status"><p>등록된 문제가 없습니다.</p></div>;

            return (
                <ul className="tree-group">
                    {curriculumData.map(grade => {
                        const gradeKey = `curriculum-grade-${grade.grade_id}`;
                        return (
                            <TreeItem 
                                key={gradeKey} 
                                nodeKey={gradeKey} 
                                label={grade.grade_name} 
                                level={1} 
                                icon={<LuFolder />} 
                                isExpanded={expandedKeys.has(gradeKey)} 
                                onToggle={handleToggle} 
                                isSelected={false} 
                                isAncestorOfSelected={isAncestor(selectedKey, gradeKey)}
                            >
                                {grade.majorChapters.map(major => {
                                    const majorKey = `${gradeKey}-major-${major.major_chapter_id}`;
                                    return (
                                        <TreeItem 
                                            key={majorKey} 
                                            nodeKey={majorKey} 
                                            label={major.major_chapter_name} 
                                            level={2} 
                                            icon={<LuFolder />} 
                                            isExpanded={expandedKeys.has(majorKey)} 
                                            onToggle={handleToggle} 
                                            isSelected={false} 
                                            isAncestorOfSelected={isAncestor(selectedKey, majorKey)}
                                        >
                                            {major.middleChapters.map(middle => {
                                                const middleKey = `${majorKey}-middle-${middle.middle_chapter_id}`;
                                                return <TreeItem 
                                                            key={middleKey} 
                                                            nodeKey={middleKey} 
                                                            label={middle.middle_chapter_name} 
                                                            count={middle.problem_count} 
                                                            level={3} icon={<LuFileText />} 
                                                            isExpanded={false} 
                                                            onToggle={()=>{}} 
                                                            isSelected={selectedKey === middleKey} 
                                                            isAncestorOfSelected={false}
                                                            onSelect={() => onSelectionChange({type: 'curriculum', key: middleKey, gradeId: grade.grade_id, majorChapterId: major.major_chapter_id, middleChapterId: middle.middle_chapter_id})} 
                                                        />
                                            })}
                                        </TreeItem>
                                    )
                                })}
                            </TreeItem>
                        )
                    })}
                </ul>
            );
        }
        return null;
    }

    return (
        <div className="my-library-widget self-contained">
            <div className="widget-content">
                <div className="view-mode-selector">
                    <SegmentedControl options={viewOptions} value={viewMode} onChange={setViewMode} />
                </div>
                <div className="library-list-wrapper">
                    {renderContent()}
                </div>
            </div>
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                isConfirming={isDeleting}
                title={`${itemToDelete?.type === 'problemSet' ? '문제집' : '소제목'} 삭제 확인`}
                confirmText="영구 삭제"
                size="small"
                isConfirmDestructive={true}
            >
                {getDeleteModalContent()}
            </Modal>
        </div>
    );
};

export default MyLibrary;