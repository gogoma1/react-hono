import { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import { useProblemPublishing } from './useProblemPublishing';
import { useExamLayoutStore } from './examLayoutStore';
import { useExamLayoutManager } from './useExamLayoutManager';
import { useExamHeaderState } from '../hooks/useExamHeaderState';
import { useProblemEditor } from '../hooks/useProblemEditor';
import { useExamPreviewManager } from '../hooks/useExamPreviewManager';
import { usePublishingPageSetup } from '../hooks/usePublishingPageSetup';
import { usePdfGenerator, type PdfExportOptions } from '../hooks/usePdfGenerator';
import { useLayoutStore } from '../../../shared/store/layoutStore';
import { useUIStore } from '../../../shared/store/uiStore';
import { useProblemSetStudentStore } from '../../../shared/store/problemSetStudentStore';
import { useProblemPublishingSelectionStore } from './problemPublishingSelectionStore';

export function useProblemPublishingPage() {
    const { allProblems, isLoadingProblems, setSelectedIds: setProblemSelectionInMainStore } = useProblemPublishing();

    const { 
        selectedProblemIds: selectedIds, 
        toggleProblem: toggleRow, 
        toggleProblems: toggleItems, 
        clearSelection, 
        setSelectedProblemIds: setSelectedIds 
    } = useProblemPublishingSelectionStore();
    
    const { studentIds: studentIdsFromDashboard, clearStudentIds } = useProblemSetStudentStore();
    
    useEffect(() => {
        if (studentIdsFromDashboard.length > 0) {
            setSelectedIds(new Set(studentIdsFromDashboard));
            setProblemSelectionInMainStore(new Set(studentIdsFromDashboard));
            clearStudentIds();
        }
    }, [studentIdsFromDashboard, setSelectedIds, clearStudentIds, setProblemSelectionInMainStore]);


    const selectedProblems = useMemo(() => allProblems.filter(p => selectedIds.has(p.uniqueId)), [allProblems, selectedIds]);
    
    const handleDeselectProblem = useCallback((uniqueId: string) => {
        toggleRow(uniqueId);
    }, [toggleRow]);

    const previewManager = useExamPreviewManager();

    const { problemBoxMinHeight, setProblemBoxMinHeight } = useExamLayoutStore();
    const [displayMinHeight, setDisplayMinHeight] = useState(problemBoxMinHeight);

    useEffect(() => {
        setDisplayMinHeight(problemBoxMinHeight);
    }, [problemBoxMinHeight]);
    
    useExamLayoutManager({ selectedProblems, problemBoxMinHeight });
    const { distributedPages, placementMap, distributedSolutionPages, solutionPlacementMap } = useExamLayoutStore();
    
    const { headerInfo, onHeaderUpdate, setHeaderInfo } = useExamHeaderState();
    const { onProblemClick } = useProblemEditor({ problemBoxMinHeight: displayMinHeight });

    const setRightSidebarConfig = useLayoutStore(state => state.setRightSidebarConfig);
    const setRightSidebarExpanded = useUIStore(state => state.setRightSidebarExpanded);

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
    
    const handleOpenSelectedStudentsSidebar = useCallback(() => {
        setRightSidebarConfig({ contentConfig: { type: 'selectedStudents' } });
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

    const jsonStringToCombineRef = useRef(jsonStringToCombine);
    useEffect(() => {
        jsonStringToCombineRef.current = jsonStringToCombine;
    }, [jsonStringToCombine]);

    const handleOpenPromptSidebar = useCallback(() => {
        setRightSidebarConfig({
            contentConfig: { type: 'prompt', props: { workbenchContent: jsonStringToCombineRef.current } },
            isExtraWide: false
        });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    // [핵심 수정] 불필요한 props 제거
    usePublishingPageSetup({ 
        handleCloseSidebar,
        handleOpenLatexHelpSidebar,
        handleOpenSettingsSidebar,
        handleOpenPromptSidebar,
        handleOpenSelectedStudentsSidebar,
    });

    useEffect(() => {
        if (selectedProblems.length > 0) {
            const newSource = selectedProblems[0].source || '정보 없음';
            setHeaderInfo(prev => ({ ...prev, source: newSource }));
        } else {
            setHeaderInfo(prev => ({ ...prev, source: '정보 없음' }));
        }
    }, [selectedProblems, setHeaderInfo]);

    const previewAreaRef = useRef<HTMLDivElement>(null);
    
    const { isGeneratingPdf, generatePdf, pdfProgress } = usePdfGenerator({
        previewAreaRef,
        getExamTitle: () => headerInfo.title,
        getSelectedProblemCount: () => selectedProblems.length,
    });

    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [pdfOptions, setPdfOptions] = useState<PdfExportOptions>({
        includeProblems: true,
        includeAnswers: true,
        includeSolutions: false,
    });

    const handlePdfOptionChange = useCallback((option: keyof PdfExportOptions) => {
        setPdfOptions(prev => ({ ...prev, [option]: !prev[option] }));
    }, []);

    const handleOpenPdfModal = useCallback(() => {
        if (selectedProblems.length === 0) {
            alert('PDF로 출력할 문제가 선택되지 않았습니다.');
            return;
        }
        setIsPdfModalOpen(true);
    }, [selectedProblems.length]);
    
    const handleConfirmPdfDownload = useCallback(() => {
        setIsPdfModalOpen(false);
        setTimeout(() => {
            generatePdf(pdfOptions);
        }, 100);
    }, [generatePdf, pdfOptions]);
    
    const handleClosePdfModal = useCallback(() => {
        setIsPdfModalOpen(false);
    }, []);

    return {
        allProblems,
        isLoadingProblems,
        selectedProblems,
        selectedIds,
        toggleRow,
        toggleItems,
        clearSelection,
        distributedPages,
        placementMap,
        distributedSolutionPages,
        solutionPlacementMap,
        headerInfo,
        onHeaderUpdate,
        onProblemClick,
        handleDeselectProblem,
        
        isGeneratingPdf,
        onDownloadPdf: handleOpenPdfModal,
        pdfProgress,
        previewAreaRef,
        ...previewManager,

        displayMinHeight,
        setDisplayMinHeight,
        problemBoxMinHeight,
        setProblemBoxMinHeight,

        isPdfModalOpen,
        onClosePdfModal: handleClosePdfModal,
        pdfOptions,
        onPdfOptionChange: handlePdfOptionChange,
        onConfirmPdfDownload: handleConfirmPdfDownload,
    };
}