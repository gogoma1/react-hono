import { useState, useMemo, useCallback } from 'react';
import { useGroupedProblemSetsQuery, useCurriculumViewQuery } from '../../../entities/problem-set/model/useProblemSetQuery';
import {
    useDeleteSubtitleFromSetMutation,
    useDeleteProblemSetMutation,
    useCreateFolderMutation,
    useDeleteFolderMutation,
    useUpdateFolderMutation,
    useMoveSubtitleMutation
} from '../../../entities/problem-set/model/useProblemSetMutations';
import type { GroupedProblemSet } from '../../../entities/problem-set/model/types';
import type { DragEndEvent } from '@dnd-kit/core';
import { useToast } from '../../../shared/store/toastStore';

export type ViewMode = 'problemSet' | 'grade' | 'curriculum';

export type DeleteTarget = {
    type: 'problemSet' | 'subtitle' | 'folder';
    id: string;
    parentId?: string;
    name: string;
} | null;

export function useMyLibrary() {
    const [viewMode, setViewMode] = useState<ViewMode>('problemSet');
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
    const toast = useToast();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<DeleteTarget>(null);

    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [folderCreationContext, setFolderCreationContext] = useState<{ problemSetId: string; gradeId: string } | null>(null);

    const { data: groupedProblemSetData, isLoading: isLoadingProblemSet, isError: isErrorProblemSet } = useGroupedProblemSetsQuery();
    const { data: curriculumData, isLoading: isLoadingCurriculum, isError: isErrorCurriculum } = useCurriculumViewQuery();

    const { mutate: deleteSubtitle, isPending: isDeletingSubtitle } = useDeleteSubtitleFromSetMutation();
    const { mutate: deleteProblemSet, isPending: isDeletingProblemSet } = useDeleteProblemSetMutation();
    const { mutate: createFolder, isPending: isCreatingFolder } = useCreateFolderMutation();
    const { mutate: deleteFolder, isPending: isDeletingFolder } = useDeleteFolderMutation();
    const { mutate: moveSubtitle, isPending: isMovingSubtitle } = useMoveSubtitleMutation();

    const isDeleting = isDeletingSubtitle || isDeletingProblemSet || isDeletingFolder;
    const isLoading = isLoadingProblemSet || isLoadingCurriculum || isMovingSubtitle;
    const isError = isErrorProblemSet || isErrorCurriculum;

    const handleToggle = useCallback((key: string) => {
        setExpandedKeys(prev => {
            const newSet = new Set(prev);
            newSet.has(key) ? newSet.delete(key) : newSet.add(key);
            return newSet;
        });
    }, []);

    const handleOpenDeleteModal = useCallback((target: DeleteTarget) => {
        setItemToDelete(target);
        setIsDeleteModalOpen(true);
    }, []);

    const handleCloseDeleteModal = useCallback(() => {
        setItemToDelete(null);
        setIsDeleteModalOpen(false);
    }, []);

    const handleConfirmDelete = useCallback(() => {
        if (!itemToDelete) return;
        const options = { onSuccess: handleCloseDeleteModal };

        if (itemToDelete.type === 'problemSet') deleteProblemSet(itemToDelete.id, options);
        else if (itemToDelete.type === 'subtitle' && itemToDelete.parentId) deleteSubtitle({ problemSetId: itemToDelete.parentId, subtitleId: itemToDelete.id }, options);
        else if (itemToDelete.type === 'folder') deleteFolder(itemToDelete.id, options);
    }, [itemToDelete, deleteProblemSet, deleteSubtitle, deleteFolder, handleCloseDeleteModal]);

    const handleOpenCreateFolderModal = useCallback((problemSetId: string, gradeId: string) => {
        setFolderCreationContext({ problemSetId, gradeId });
        setIsCreateFolderModalOpen(true);
    }, []);

    const handleCloseCreateFolderModal = useCallback(() => {
        setIsCreateFolderModalOpen(false);
        setNewFolderName('');
        setFolderCreationContext(null);
    }, []);

    const handleConfirmCreateFolder = useCallback(() => {
        if (newFolderName.trim() && folderCreationContext) {
            createFolder({
                name: newFolderName.trim(),
                problemSetId: folderCreationContext.problemSetId,
                gradeId: folderCreationContext.gradeId,
            }, {
                onSuccess: handleCloseCreateFolderModal
            });
        }
    }, [newFolderName, folderCreationContext, createFolder, handleCloseCreateFolderModal]);
    
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            return;
        }

        const draggedId = active.id as string;
        const droppedOnId = over.id as string;

        if (draggedId === droppedOnId) {
            return;
        }

        if (!draggedId.includes('-subtitle-')) {
            toast.info('그룹으로 이동할 수 있는 항목은 소제목만 가능합니다.');
            return;
        }
        
        const subtitleId = draggedId.split('-subtitle-')[1];

        let targetFolderId: string | null = null;
        
        // [핵심 수정] 드롭 대상에 따라 targetFolderId 결정
        if (droppedOnId.includes('-folder-')) {
            // 폴더 위로 드롭된 경우
            targetFolderId = droppedOnId.split('-folder-')[1];
        } else if (droppedOnId.includes('-grade-')) {
            // 학년 영역 위로 드롭된 경우 (폴더에서 빼내기)
            targetFolderId = null;
        } else {
            // 그 외의 경우 (다른 소제목, 문제집 등)는 이동하지 않음
            return;
        }
        
        // 현재 소제목이 이미 해당 폴더에 있는지 확인 (불필요한 API 호출 방지)
        const currentFolderId = (active.data.current?.folderId as string | null) ?? null;
        if (currentFolderId === targetFolderId) {
            return;
        }

        moveSubtitle({ subtitleId, targetFolderId });

    }, [moveSubtitle, toast]);

    const dataForGradeView = useMemo(() => {
        const byGrade: Record<string, { grade_id: string; grade_order: number; items: any[] }> = {};
        (groupedProblemSetData || []).forEach(ps => {
            ps.grades.forEach(grade => {
                const gradeKey = grade.grade_id || grade.grade_name;
                if (!byGrade[gradeKey]) {
                    byGrade[gradeKey] = { grade_id: gradeKey, grade_order: grade.grade_order, items: [] };
                }
                byGrade[gradeKey].items.push({
                    ...ps,
                    grades: [grade]
                });
            });
        });
        return Object.values(byGrade).sort((a, b) => a.grade_order - b.grade_order);
    }, [groupedProblemSetData]);

    return {
        viewMode,
        expandedKeys,
        isDeleteModalOpen,
        itemToDelete,
        isCreateFolderModalOpen,
        newFolderName,
        groupedProblemSetData,
        curriculumData,
        isLoading,
        isError,
        isDeleting,
        isCreatingFolder,
        dataForGradeView,
        setViewMode,
        handleToggle,
        handleOpenDeleteModal,
        handleCloseDeleteModal,
        handleConfirmDelete,
        handleOpenCreateFolderModal,
        handleCloseCreateFolderModal,
        handleConfirmCreateFolder,
        setNewFolderName,
        handleDragEnd,
    };
}