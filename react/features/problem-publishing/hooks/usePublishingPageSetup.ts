// ./react/features/problem-publishing/hooks/usePublishingPageSetup.ts
import { useEffect, useCallback, useMemo } from 'react';
import { useLayoutStore } from '../../../shared/store/layoutStore';
import { useUIStore } from '../../../shared/store/uiStore';
import { useColumnPermissions } from '../../../shared/hooks/useColumnPermissions';
import { useProblemPublishing } from '../model/useProblemPublishing';
import type { ProcessedProblem } from '../model/problemPublishingStore';

interface PublishingPageSetupProps {
    selectedProblems: ProcessedProblem[];
    allProblems: ProcessedProblem[];
}

export function usePublishingPageSetup({ selectedProblems, allProblems }: PublishingPageSetupProps) {
    const { setRightSidebarConfig, setSearchBoxProps, registerPageActions } = useLayoutStore.getState();
    const { setRightSidebarExpanded, setColumnVisibility } = useUIStore.getState();
    const { permittedColumnsConfig } = useColumnPermissions();
    const { isSavingProblem } = useProblemPublishing();

    // 1. 컬럼 가시성 초기화
    useEffect(() => {
        const initialVisibility: Record<string, boolean> = {};
        permittedColumnsConfig.forEach(col => {
            initialVisibility[col.key] = !col.defaultHidden;
        });
        setColumnVisibility(initialVisibility);
    }, [permittedColumnsConfig, setColumnVisibility]);
    
    const handleCloseSidebar = useCallback(() => {
        setRightSidebarConfig({ contentConfig: { type: null } });
        setRightSidebarExpanded(false);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    // 2. 사이드바 액션 핸들러 정의
    const handleOpenLatexHelpSidebar = useCallback(() => {
        setRightSidebarConfig({ contentConfig: { type: 'latexHelp' } });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    const handleOpenSettingsSidebar = useCallback(() => {
        setRightSidebarConfig({ contentConfig: { type: 'settings' } });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    const jsonStringToCombine = useMemo(() => {
        const problemsToConvert = selectedProblems.length > 0 ? selectedProblems : allProblems.slice(0, 1);
        if (problemsToConvert.length === 0) return '';

        const problemsForJson = problemsToConvert.map(p => ({
            problem_id: p.problem_id, question_number: p.question_number, problem_type: p.problem_type,
            question_text: p.question_text, answer: p.answer, solution_text: p.solution_text,
            page: p.page, grade: p.grade, semester: p.semester, source: p.source,
            major_chapter_id: p.major_chapter_id, middle_chapter_id: p.middle_chapter_id,
            core_concept_id: p.core_concept_id, problem_category: p.problem_category,
            difficulty: p.difficulty, score: p.score,
        }));
        return JSON.stringify({ problems: problemsForJson }, null, 2);
    }, [selectedProblems, allProblems]);

    const handleOpenPromptSidebar = useCallback(() => {
        setRightSidebarConfig({
            contentConfig: { type: 'prompt', props: { workbenchContent: jsonStringToCombine } },
            isExtraWide: false
        });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded, jsonStringToCombine]);

    // 3. 페이지 액션 등록 및 클린업
    useEffect(() => {
        registerPageActions({
            onClose: handleCloseSidebar,
            openLatexHelpSidebar: handleOpenLatexHelpSidebar,
            openSearchSidebar: () => { /* No-op for this page */ },
            openSettingsSidebar: handleOpenSettingsSidebar,
            openPromptSidebar: handleOpenPromptSidebar,
        });
        return () => {
            setRightSidebarConfig({ contentConfig: { type: null } });
            setSearchBoxProps(null);
        };
    }, [handleCloseSidebar, setRightSidebarConfig, handleOpenLatexHelpSidebar, registerPageActions, setSearchBoxProps, handleOpenSettingsSidebar, handleOpenPromptSidebar]);

    // 4. 문제 저장 상태에 따른 사이드바 prop 업데이트
    useEffect(() => {
        const { contentConfig } = useLayoutStore.getState().rightSidebar;
        if (contentConfig.type === 'problemEditor' && contentConfig.props) {
            setRightSidebarConfig({
                contentConfig: { ...contentConfig, props: { ...contentConfig.props, isSaving: isSavingProblem } },
                isExtraWide: true
            });
        }
    }, [isSavingProblem, setRightSidebarConfig]);
}