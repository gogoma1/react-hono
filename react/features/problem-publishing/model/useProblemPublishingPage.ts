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
import { usePublishExamSetMutation } from '../../../entities/exam-set/model/useExamSetMutations';

export function useProblemPublishingPage() {
    const [isSearchBoxVisible, setIsSearchBoxVisible] = useState(true);

    const { allProblems, isLoadingProblems } = useProblemPublishing();
    
    const { 
        selectedProblemIds, 
        toggleProblem: toggleRow, 
        toggleProblems: toggleItems, 
        clearSelection, 
    } = useProblemPublishingSelectionStore();
    
    const { students: selectedStudentsFromStore, clearStudents } = useProblemSetStudentStore();
    const selectedStudentIds = useMemo(() => selectedStudentsFromStore.map(s => s.id), [selectedStudentsFromStore]);
    
    const selectedProblems = useMemo(() => allProblems.filter(p => selectedProblemIds.has(p.uniqueId)), [allProblems, selectedProblemIds]);
    
    const selectedProblemsRef = useRef(selectedProblems);
    useEffect(() => {
        selectedProblemsRef.current = selectedProblems;
    }, [selectedProblems]);

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
    
    const setRightSidebarContent = useLayoutStore(state => state.setRightSidebarContent);
    const closeRightSidebar = useLayoutStore(state => state.closeRightSidebar);
    const setRightSidebarExpanded = useUIStore(state => state.setRightSidebarExpanded);

    const handleCloseSidebar = useCallback(() => {
        closeRightSidebar();
        setRightSidebarExpanded(false);
    }, [closeRightSidebar, setRightSidebarExpanded]);

    const handleOpenLatexHelpSidebar = useCallback(() => {
        setRightSidebarContent({ type: 'latexHelp' });
        setRightSidebarExpanded(true);
    }, [setRightSidebarContent, setRightSidebarExpanded]);

    const handleOpenSettingsSidebar = useCallback(() => {
        setRightSidebarContent({ type: 'settings' });
        setRightSidebarExpanded(true);
    }, [setRightSidebarContent, setRightSidebarExpanded]);
    
    const handleOpenSelectedStudentsSidebar = useCallback(() => {
        setRightSidebarContent({ type: 'selectedStudents' });
        setRightSidebarExpanded(true);
    }, [setRightSidebarContent, setRightSidebarExpanded]);

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
        setRightSidebarContent({
            type: 'prompt', 
            props: { workbenchContent: jsonStringToCombineRef.current }
        });
        setRightSidebarExpanded(true);
    }, [setRightSidebarContent, setRightSidebarExpanded]);
    
    const handleOpenJsonViewSidebar = useCallback(() => {
        if (selectedProblemsRef.current.length === 0) {
            alert('JSON으로 변환할 문제가 선택되지 않았습니다.');
            return;
        }
        setRightSidebarContent({
            type: 'jsonViewer',
            props: { problems: selectedProblemsRef.current }
        }, true);
        setRightSidebarExpanded(true);
    }, [setRightSidebarContent, setRightSidebarExpanded]);

    const handleOpenSearchSidebar = useCallback(() => {
        setIsSearchBoxVisible(prev => !prev);
    }, []);

    usePublishingPageSetup({ 
        handleCloseSidebar, 
        handleOpenLatexHelpSidebar, 
        handleOpenSettingsSidebar, 
        handleOpenPromptSidebar, 
        handleOpenSelectedStudentsSidebar,
        handleOpenJsonViewSidebar,
        handleOpenSearchSidebar,
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
    const { isGeneratingPdf, generatePdf, pdfProgress } = usePdfGenerator({ previewAreaRef, getExamTitle: () => headerInfo.title, getSelectedProblemCount: () => selectedProblems.length });
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [pdfOptions, setPdfOptions] = useState<PdfExportOptions>({ includeProblems: true, includeAnswers: true, includeSolutions: false });
    const handlePdfOptionChange = useCallback((option: keyof PdfExportOptions) => { setPdfOptions(prev => ({ ...prev, [option]: !prev[option] })); }, []);
    const handleOpenPdfModal = useCallback(() => { if (selectedProblems.length === 0) { alert('PDF로 출력할 문제가 선택되지 않았습니다.'); return; } setIsPdfModalOpen(true); }, [selectedProblems.length]);
    const handleConfirmPdfDownload = useCallback(() => { setIsPdfModalOpen(false); setTimeout(() => { generatePdf(pdfOptions); }, 100); }, [generatePdf, pdfOptions]);
    const handleClosePdfModal = useCallback(() => { setIsPdfModalOpen(false); }, []);
    
    const { mutate: publishExam, isPending: isPublishing } = usePublishExamSetMutation();
    const [isMobilePublishModalOpen, setIsMobilePublishModalOpen] = useState(false);

    const handleOpenMobilePublishModal = useCallback(() => {
        if (selectedStudentIds.length === 0) {
            alert('선택된 학생이 없습니다. 대시보드에서 학생을 선택하거나, 우측 사이드바에서 학생을 추가해주세요.');
            return;
        }
        if (selectedProblemIds.size === 0) {
            alert('선택된 문제가 없습니다.');
            return;
        }
        setIsMobilePublishModalOpen(true);
    }, [selectedStudentIds, selectedProblemIds]);

    const handleCloseMobilePublishModal = useCallback(() => {
        setIsMobilePublishModalOpen(false);
    }, []);

    // ✨ --- 이 함수가 핵심 수정 부분입니다. --- ✨
    const handleConfirmMobilePublish = useCallback(() => {
        // headerInfo 상태 객체에서 DB에 저장할 순수 데이터만 추출합니다.
        const headerInfoForPayload = {
            title: headerInfo.title,
            titleFontSize: headerInfo.titleFontSize,
            titleFontFamily: headerInfo.titleFontFamily,
            school: headerInfo.school,
            schoolFontSize: headerInfo.schoolFontSize,
            schoolFontFamily: headerInfo.schoolFontFamily,
            subject: headerInfo.subject,
            subjectFontSize: headerInfo.subjectFontSize,
            subjectFontFamily: headerInfo.subjectFontFamily,
            simplifiedSubjectText: headerInfo.simplifiedSubjectText,
            simplifiedSubjectFontSize: headerInfo.simplifiedSubjectFontSize,
            simplifiedSubjectFontFamily: headerInfo.simplifiedSubjectFontFamily,
            simplifiedGradeText: headerInfo.simplifiedGradeText,
            source: headerInfo.source,
        };

        // API로 보낼 최종 페이로드를 구성합니다.
        const payload = {
            title: headerInfo.title, // 최상위 title은 여전히 유지
            problem_ids: Array.from(selectedProblemIds),
            student_ids: selectedStudentIds,
            header_info: headerInfoForPayload, // 가공된 순수 데이터 객체를 전달
        };

         // console.log로 확인해보세요!
    console.log("🚀 Publishing Mobile Exam - Payload to be sent:", payload);
        
        publishExam(payload, {
            onSuccess: () => {
                clearStudents();
                clearSelection();
                handleCloseMobilePublishModal();
            },
        });
    }, [selectedStudentIds, selectedProblemIds, headerInfo, publishExam, clearStudents, clearSelection, handleCloseMobilePublishModal]);

    return {
        allProblems,
        isLoadingProblems,
        selectedProblems,
        selectedIds: selectedProblemIds,
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
        
        isMobilePublishModalOpen,
        onOpenMobilePublishModal: handleOpenMobilePublishModal,
        onCloseMobilePublishModal: handleCloseMobilePublishModal,
        onConfirmMobilePublish: handleConfirmMobilePublish,
        isPublishing,
        selectedStudentCount: selectedStudentIds.length,
        selectedProblemCount: selectedProblemIds.size,

        isSearchBoxVisible,
        toggleSearchBox: handleOpenSearchSidebar, 
    };
}