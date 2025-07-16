import React from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import {
    LuLoader, LuCircleAlert, LuChevronDown, LuChevronRight,
    LuBookCopy, LuGraduationCap, LuComponent, LuFolder, LuBook, LuFileText,
    LuSquarePlus, LuTrash2, LuFolderPlus
} from 'react-icons/lu';
import { DndContext, useDraggable, useDroppable, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import SegmentedControl from '../../../shared/ui/segmented-control/SegmentedControl';
import Modal from '../../../shared/ui/modal/Modal';
import './MyLibrary.css';
import type { LibrarySelection, GroupedProblemSet, GroupedGrade, SubtitleGroup, GroupedSubtitle } from '../model/types';
import { useMyLibrary } from '../../../features/my-library-manager/model/useMyLibrary';
import type { ViewMode, DeleteTarget } from '../../../features/my-library-manager/model/useMyLibrary';

const viewOptions = [
    { value: 'problemSet' as ViewMode, label: '문제집별', icon: <LuBookCopy /> },
    { value: 'grade' as ViewMode, label: '학년별', icon: <LuGraduationCap /> },
    { value: 'curriculum' as ViewMode, label: '단원별', icon: <LuComponent /> },
];

interface TreeItemProps {
    label: string;
    nodeKey: string;
    itemType: 'problemSet' | 'grade' | 'folder' | 'subtitle' | 'new' | 'curriculum';
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
    onAddFolder?: () => void;
    folderId?: string | null;
}

const TreeItem: React.FC<TreeItemProps> = React.memo(({
    label, nodeKey, itemType, count, level, icon, isExpanded, isSelected, isAncestorOfSelected, onToggle, onSelect, onDelete, children, onAddFolder, folderId
}) => {
    
    const isDraggable = itemType === 'subtitle';
    // [수정] 드래그 핸들이 아닌, 행 전체를 드래그할 수 있도록 listeners와 attributes를 최상위 div에 적용
    const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
        id: nodeKey,
        disabled: !isDraggable,
        data: { folderId }
    });

    const isDroppable = itemType === 'folder' || itemType === 'grade';
    const { isOver, setNodeRef: setDroppableRef } = useDroppable({
        id: nodeKey,
        disabled: !isDroppable,
    });
    
    const style = transform ? {
        transform: CSS.Translate.toString(transform),
        zIndex: 10, // 드래그 중 다른 요소 위로 올라오도록
    } : undefined;

    const isLeaf = !children;
    const itemClassName = `tree-item ${isLeaf ? 'leaf' : 'branch'} ${isDragging ? 'dragging' : ''}`;
    
    let contentClassName = `tree-item-content ${onSelect ? 'clickable' : ''} ${isSelected ? 'selected' : ''} ${isAncestorOfSelected ? 'ancestor-selected' : ''}`;
    if(isOver && isDroppable) contentClassName += ' drop-over';
    
    // [핵심 수정] 행 클릭 로직
    const handleRowClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onSelect) {
            onSelect();
        } 
        else if (!isLeaf) {
            onToggle(nodeKey); // branch 노드는 토글
        }
    };

    const handleToggleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isLeaf) {
            onToggle(nodeKey);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) onDelete();
    };

    const handleAddFolderClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onAddFolder) onAddFolder();
    };

    const indentStyle = { paddingLeft: `${(level - 1) * 16}px` };

    return (
        <li className={itemClassName} ref={setDroppableRef} style={style}>
            {/* [수정] 드래그 리스너와 ref를 content div에 통합 */}
            <div 
                ref={setDraggableRef} 
                className={contentClassName} 
                onClick={handleRowClick} 
                style={indentStyle}
                {...listeners} 
                {...attributes}
            >
                <span className="expand-icon-wrapper" onClick={handleToggleClick} aria-hidden="true">
                    {!children ? <span className="icon-placeholder" /> : (isExpanded ? <LuChevronDown className="expand-icon" /> : <LuChevronRight className="expand-icon" />)}
                </span>
                {icon && <span className="item-type-icon">{icon}</span>}
                <span className="tree-item-label">{label}</span>
                {count !== undefined && <span className="tree-item-count">({count})</span>}
                <div className="action-buttons-group">
                    {onAddFolder && (
                        <Tippy content="소제목 그룹 추가" placement="top" theme="custom-glass" delay={[300, 0]}>
                            <button onClick={handleAddFolderClick} className="add-subfolder-button" aria-label={`${label}에 소제목 그룹 추가`}>
                                <LuFolderPlus size={14} />
                            </button>
                        </Tippy>
                    )}
                    {onDelete && (
                         <Tippy content="삭제" placement="top" theme="custom-glass" delay={[300, 0]}>
                            <button onClick={handleDeleteClick} className="delete-item-button" aria-label={`${label} 삭제`}>
                                <LuTrash2 size={14} />
                            </button>
                        </Tippy>
                    )}
                </div>
            </div>
            {isExpanded && children && <ul className="tree-group">{children}</ul>}
        </li>
    );
});
TreeItem.displayName = 'TreeItem';


const isAncestor = (key: string | null, ancestorKey: string) => {
    return !!(key && key.startsWith(ancestorKey) && key !== ancestorKey);
};

interface MyLibraryProps {
    onSelectionChange: (selection: LibrarySelection) => void;
    selectedKey: string | null;
}

const MyLibrary: React.FC<MyLibraryProps> = ({ onSelectionChange, selectedKey }) => {
    const {
        viewMode, setViewMode, expandedKeys, handleToggle,
        isDeleteModalOpen, itemToDelete, handleOpenDeleteModal, handleCloseDeleteModal, handleConfirmDelete,
        isCreateFolderModalOpen, newFolderName, setNewFolderName, handleOpenCreateFolderModal, handleCloseCreateFolderModal, handleConfirmCreateFolder,
        groupedProblemSetData, curriculumData, isLoading, isError, isDeleting, isCreatingFolder,
        handleDragEnd,
    } = useMyLibrary();
    
    // [수정] 드래그 민감도를 낮춰서 일반 클릭과 구분
    const sensors = useSensors(useSensor(PointerSensor, { 
        activationConstraint: { distance: 8 }
    }));

    const getDeleteModalContent = () => {
        if (!itemToDelete) return null;
        if (itemToDelete.type === 'folder') return <><p>정말로 그룹 <strong>'{itemToDelete.name}'</strong>을(를) 삭제하시겠습니까?</p><p className="modal-warning">이 작업은 되돌릴 수 없습니다. 그룹 안의 소제목들은 '그룹 없음'으로 이동합니다.</p></>;
        if (itemToDelete.type === 'problemSet') return <><p>정말로 문제집 <strong>'{itemToDelete.name}'</strong>을(를) <strong>영구적으로 삭제</strong>하시겠습니까?</p><p className="modal-warning">이 작업은 되돌릴 수 없으며, 이 문제집에 포함된 모든 문제와 데이터가 함께 삭제됩니다.</p></>;
        if (itemToDelete.type === 'subtitle') return <><p>정말로 <strong>'{itemToDelete.name}'</strong> 소제목과 관련된 모든 문제를 <strong>영구적으로 삭제</strong>하시겠습니까?</p><p className="modal-warning">이 작업은 되돌릴 수 없으며, 문제 라이브러리에서 해당 문제의 원본 데이터가 사라집니다.</p></>;
        return null;
    };

    const renderProblemSetView = () => {
        if (!groupedProblemSetData) return null;
        if (groupedProblemSetData.length === 0) {
            return (
                <ul className="tree-group">
                    <TreeItem itemType="new" nodeKey="new" label="새 문제집 만들기" level={1} icon={<LuSquarePlus />} isSelected={selectedKey === 'new'} isExpanded={false} onToggle={() => { }} onSelect={() => onSelectionChange({ type: 'new', key: 'new' })} isAncestorOfSelected={false} />
                </ul>
            );
        }

        return (
            <ul className="tree-group">
                <TreeItem itemType="new" nodeKey="new" label="새 문제집 만들기" level={1} icon={<LuSquarePlus />} isSelected={selectedKey === 'new'} isExpanded={false} onToggle={() => { }} onSelect={() => onSelectionChange({ type: 'new', key: 'new' })} isAncestorOfSelected={false} />
                {groupedProblemSetData.map((ps: GroupedProblemSet) => {
                    const psKey = `ps-${ps.problem_set_id}`;
                    return (
                        <TreeItem
                            key={psKey} nodeKey={psKey} itemType="problemSet" label={ps.problem_set_name} level={1} icon={<LuBook />}
                            isExpanded={expandedKeys.has(psKey)} onToggle={handleToggle} isSelected={selectedKey === psKey}
                            isAncestorOfSelected={isAncestor(selectedKey, psKey)}
                            onSelect={() => onSelectionChange({ type: 'problemSet', key: psKey, problemSetId: ps.problem_set_id, problemSetName: ps.problem_set_name })}
                            onDelete={() => handleOpenDeleteModal({ type: 'problemSet', id: ps.problem_set_id, name: ps.problem_set_name })}
                        >
                            {ps.grades.map((grade: GroupedGrade) => {
                                const gradeKey = `${psKey}-grade-${grade.grade_id}`;
                                return (
                                    <TreeItem
                                        key={gradeKey} nodeKey={gradeKey} itemType="grade" label={grade.grade_name} level={2}
                                        isExpanded={expandedKeys.has(gradeKey)} onToggle={handleToggle} isSelected={selectedKey === gradeKey}
                                        isAncestorOfSelected={isAncestor(selectedKey, gradeKey)}
                                        onSelect={() => onSelectionChange({ type: 'grade', key: gradeKey, problemSetId: ps.problem_set_id, problemSetName: ps.problem_set_name, gradeId: grade.grade_id, gradeName: grade.grade_name })}
                                        onAddFolder={() => handleOpenCreateFolderModal(ps.problem_set_id, grade.grade_id)}
                                    >
                                        {grade.folders.map((folder: SubtitleGroup) => {
                                            const folderKey = `${gradeKey}-folder-${folder.id}`;
                                            return (
                                                <TreeItem
                                                    key={folderKey} nodeKey={folderKey} itemType="folder" label={folder.name} level={3} icon={<LuFolder />}
                                                    isExpanded={expandedKeys.has(folderKey)} onToggle={handleToggle} isSelected={selectedKey === folderKey}
                                                    isAncestorOfSelected={isAncestor(selectedKey, folderKey)}
                                                    onSelect={() => onSelectionChange({
                                                        type: 'folder', key: folderKey, problemSetId: ps.problem_set_id, problemSetName: ps.problem_set_name,
                                                        gradeId: grade.grade_id, gradeName: grade.grade_name, folderId: folder.id, folderName: folder.name,
                                                    })}
                                                    onDelete={() => handleOpenDeleteModal({ type: 'folder', id: folder.id, name: folder.name })}
                                                >
                                                    {folder.subtitles.map((subtitle: GroupedSubtitle) => {
                                                        const subtitleKey = `${folderKey}-subtitle-${subtitle.subtitle_id}`;
                                                        return <TreeItem
                                                            key={subtitleKey} nodeKey={subtitleKey} itemType="subtitle" label={subtitle.subtitle_name} count={subtitle.problem_count}
                                                            level={4} icon={<LuFileText />} isExpanded={false} onToggle={() => { }}
                                                            isSelected={selectedKey === subtitleKey} isAncestorOfSelected={false} folderId={folder.id}
                                                            onSelect={() => onSelectionChange({ type: 'subtitle', key: subtitleKey, problemSetId: ps.problem_set_id, problemSetName: ps.problem_set_name, gradeId: grade.grade_id, gradeName: grade.grade_name, subtitleId: subtitle.subtitle_id, subtitleName: subtitle.subtitle_name })}
                                                            onDelete={() => handleOpenDeleteModal({ type: 'subtitle', id: subtitle.subtitle_id, parentId: ps.problem_set_id, name: subtitle.subtitle_name })}
                                                        />
                                                    })}
                                                </TreeItem>
                                            )
                                        })}
                                        {grade.subtitles.map((subtitle: GroupedSubtitle) => {
                                            const subtitleKey = `${gradeKey}-subtitle-${subtitle.subtitle_id}`;
                                            return <TreeItem
                                                key={subtitleKey} nodeKey={subtitleKey} itemType="subtitle" label={subtitle.subtitle_name} count={subtitle.problem_count}
                                                level={3} icon={<LuFileText />} isExpanded={false} onToggle={() => { }}
                                                isSelected={selectedKey === subtitleKey} isAncestorOfSelected={false} folderId={null}
                                                onSelect={() => onSelectionChange({ type: 'subtitle', key: subtitleKey, problemSetId: ps.problem_set_id, problemSetName: ps.problem_set_name, gradeId: grade.grade_id, gradeName: grade.grade_name, subtitleId: subtitle.subtitle_id, subtitleName: subtitle.subtitle_name })}
                                                onDelete={() => handleOpenDeleteModal({ type: 'subtitle', id: subtitle.subtitle_id, parentId: ps.problem_set_id, name: subtitle.subtitle_name })}
                                            />
                                        })}
                                    </TreeItem>
                                );
                            })}
                        </TreeItem>
                    );
                })}
            </ul>
        );
    }

    const renderContent = () => {
        if (isLoading) return <div className="my-library-status"><LuLoader className="spinner" /> <span>데이터 로딩 중...</span></div>;
        if (isError) return <div className="my-library-status error"><LuCircleAlert /> <span>오류가 발생했습니다.</span></div>;

        let content;
        switch (viewMode) {
            case 'problemSet': content = renderProblemSetView(); break;
            case 'grade': content = <div>학년별 보기 준비 중...</div>; break;
            case 'curriculum':
                if (!curriculumData || curriculumData.length === 0) {
                    content = <div className="my-library-status"><p>등록된 문제가 없습니다.</p></div>;
                } else {
                    content = (
                         <ul className="tree-group">
                            {curriculumData.map(grade => {
                                const gradeKey = `curriculum-grade-${grade.grade_id}`;
                                return (
                                    <TreeItem key={gradeKey} nodeKey={gradeKey} itemType="grade" label={grade.grade_name} level={1} icon={<LuFolder />} isExpanded={expandedKeys.has(gradeKey)} onToggle={handleToggle} isSelected={false} isAncestorOfSelected={isAncestor(selectedKey, gradeKey)}>
                                        {grade.majorChapters.map(major => {
                                            const majorKey = `${gradeKey}-major-${major.major_chapter_id}`;
                                            return (
                                                <TreeItem key={majorKey} nodeKey={majorKey} itemType="curriculum" label={major.major_chapter_name} level={2} icon={<LuFolder />} isExpanded={expandedKeys.has(majorKey)} onToggle={handleToggle} isSelected={false} isAncestorOfSelected={isAncestor(selectedKey, majorKey)}>
                                                    {major.middleChapters.map(middle => {
                                                        const middleKey = `${majorKey}-middle-${middle.middle_chapter_id}`;
                                                        return <TreeItem key={middleKey} nodeKey={middleKey} itemType="curriculum" label={middle.middle_chapter_name} count={middle.problem_count} level={3} icon={<LuFileText />} isExpanded={false} onToggle={()=>{}} isSelected={selectedKey === middleKey} isAncestorOfSelected={false} onSelect={() => onSelectionChange({type: 'curriculum', key: middleKey, gradeId: grade.grade_id, majorChapterId: major.major_chapter_id, middleChapterId: middle.middle_chapter_id})} />
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
                break;
            default: content = null;
        }

        return (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                {content}
            </DndContext>
        );
    };

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
            <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} onConfirm={handleConfirmDelete} isConfirming={isDeleting} title="삭제 확인" confirmText="확인" size="small" isConfirmDestructive={true}>
                {getDeleteModalContent()}
            </Modal>
            <Modal isOpen={isCreateFolderModalOpen} onClose={handleCloseCreateFolderModal} onConfirm={handleConfirmCreateFolder} isConfirming={isCreatingFolder} title="새 소제목 그룹 만들기" confirmText="생성">
                <div className="form-group" style={{ padding: '1rem' }}>
                    <label htmlFor="new-folder-name" style={{ marginBottom: '8px', display: 'block' }}>그룹 이름</label>
                    <input id="new-folder-name" type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} className="form-input" placeholder="그룹 이름을 입력하세요" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmCreateFolder(); }} />
                </div>
            </Modal>
        </div>
    );
};

export default MyLibrary;