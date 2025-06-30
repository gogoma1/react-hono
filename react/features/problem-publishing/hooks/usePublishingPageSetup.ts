import { useEffect, useCallback, useMemo, useRef } from 'react'; // [수정] useRef 임포트
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

    // --- [핵심 수정 시작] ---
    // 1. useRef를 사용하여 jsonStringToCombine의 최신 값을 추적합니다.
    //    이렇게 하면 jsonStringToCombine이 변경되어도 handleOpenPromptSidebar 함수의 참조는 변경되지 않습니다.
    const jsonStringToCombineRef = useRef(jsonStringToCombine);
    useEffect(() => {
        jsonStringToCombineRef.current = jsonStringToCombine;
    }, [jsonStringToCombine]);

    const handleOpenPromptSidebar = useCallback(() => {
        setRightSidebarConfig({
            // 2. 버튼 클릭 시, ref에 저장된 최신 값을 사용합니다.
            contentConfig: { type: 'prompt', props: { workbenchContent: jsonStringToCombineRef.current } },
            isExtraWide: false
        });
        setRightSidebarExpanded(true);
    // 3. useCallback의 의존성 배열에서 불안정한 jsonStringToCombine을 제거하여 함수 참조를 안정화시킵니다.
    }, [setRightSidebarConfig, setRightSidebarExpanded]);
    // --- [핵심 수정 끝] ---

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
    // [수정] 이제 handleOpenPromptSidebar는 안정적이므로, 이 useEffect는 불필요하게 재실행되지 않습니다.
    }, [handleCloseSidebar, setRightSidebarConfig, handleOpenLatexHelpSidebar, registerPageActions, setSearchBoxProps, handleOpenSettingsSidebar, handleOpenPromptSidebar]);

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