import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useLayoutStore } from '../../../shared/store/layoutStore';
import { useProblemPublishing } from './useProblemPublishing';
import { useExamLayoutStore } from './examLayoutStore';
import { useExamLayoutManager } from './useExamLayoutManager';
import type { ProcessedProblem } from './problemPublishingStore';
import { useUIStore } from '../../../shared/store/uiStore';
import { useColumnPermissions } from '../../../shared/hooks/useColumnPermissions';

// [수정] 헤더 업데이트 값의 타입을 명확하게 정의합니다.
type HeaderUpdateValue = {
    text: string;
    fontSize?: number;
};

export function useProblemPublishingPage() {
    const {
        allProblems, isSavingProblem, handleSaveProblem, handleLiveProblemChange,
        handleRevertProblem, startEditingProblem, setEditingProblemId
    } = useProblemPublishing();
    
    const [selectedIds, setSelectedIds] = useState(new Set<string>());

    const selectedProblems = useMemo(() => 
        allProblems.filter(p => selectedIds.has(p.uniqueId)),
        [allProblems, selectedIds]
    );

    const {
        distributedPages, placementMap, distributedSolutionPages, solutionPlacementMap,
        setItemHeight, baseFontSize, contentFontSizeEm, useSequentialNumbering,
        setBaseFontSize, setContentFontSizeEm, setUseSequentialNumbering,
        forceRecalculateLayout
    } = useExamLayoutStore();
    
    const { setRightSidebarConfig, setSearchBoxProps, registerPageActions } = useLayoutStore.getState();
    const { setRightSidebarExpanded, setColumnVisibility } = useUIStore.getState();
    const { permittedColumnsConfig } = useColumnPermissions();

    useEffect(() => {
        const initialVisibility: Record<string, boolean> = {};
        permittedColumnsConfig.forEach(col => {
            initialVisibility[col.key] = !col.defaultHidden;
        });
        setColumnVisibility(initialVisibility);
    }, [permittedColumnsConfig, setColumnVisibility]);

    const [problemBoxMinHeight, setProblemBoxMinHeight] = useState(31);
    const [measuredHeights, setMeasuredHeights] = useState<Map<string, number>>(new Map());
    const [headerInfo, setHeaderInfo] = useState({
        title: '2025학년도 3월 전국연합학력평가', titleFontSize: 1.64, titleFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        school: '제2교시', schoolFontSize: 1, schoolFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        subject: '수학 영역', subjectFontSize: 3, subjectFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        simplifiedSubjectText: '수학 영역', simplifiedSubjectFontSize: 1.6, simplifiedSubjectFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        simplifiedGradeText: '고3',
    });
    const previewAreaRef = useRef<HTMLDivElement>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0, message: '' });

    const handleSelectionChange = useCallback((newSelectedIds: Set<string>) => {
        setSelectedIds(newSelectedIds);
    }, []);

    const handleHeightUpdate = useCallback((uniqueId: string, height: number) => { 
        setItemHeight(uniqueId, height); 
        setMeasuredHeights(prev => new Map(prev).set(uniqueId, height));
    }, [setItemHeight]);

    // [핵심 수정] 상태 업데이트 로직을 명확하게 수정하여 글자 크기 변경이 올바르게 반영되도록 합니다.
    const handleHeaderUpdate = useCallback((targetId: string, _field: string, value: HeaderUpdateValue) => {
        setHeaderInfo(prev => {
            const newState = { ...prev };
            const newFontSize = value.fontSize;

            switch (targetId) {
                case 'title':
                    newState.title = value.text;
                    if (newFontSize !== undefined) newState.titleFontSize = newFontSize;
                    break;
                case 'school':
                    newState.school = value.text;
                    if (newFontSize !== undefined) newState.schoolFontSize = newFontSize;
                    break;
                case 'subject':
                    newState.subject = value.text;
                    if (newFontSize !== undefined) newState.subjectFontSize = newFontSize;
                    break;
                case 'simplifiedSubject':
                    newState.simplifiedSubjectText = value.text;
                    if (newFontSize !== undefined) newState.simplifiedSubjectFontSize = newFontSize;
                    break;
                case 'simplifiedGrade':
                    newState.simplifiedGradeText = value.text;
                    // simplifiedGrade는 fontSize가 없음
                    break;
            }
            return newState;
        });
    }, []);

    const handleDownloadPdf = useCallback(async () => {
        if (!previewAreaRef.current || selectedProblems.length === 0) {
            alert('PDF로 변환할 시험지 내용이 없습니다.');
            return;
        }

        const previewElement = previewAreaRef.current;
        const pageElements = previewElement.querySelectorAll<HTMLElement>('.exam-paper');
        const totalPages = pageElements.length;

        if (totalPages === 0) {
            alert('PDF로 변환할 시험지 페이지(.exam-paper)를 찾을 수 없습니다.');
            return;
        }

        setIsGeneratingPdf(true);
        setPdfProgress({ current: 0, total: totalPages, message: 'PDF 생성을 준비하고 있습니다...' });
        previewElement.classList.add('pdf-generating');

        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const A4_WIDTH_MM = 210;
            const A4_HEIGHT_MM = 297;
            
            const MARGIN_X_MM = 15; // 좌우 여백
            const MARGIN_Y_MM = 15; // 상하 여백

            const contentWidth = A4_WIDTH_MM - (MARGIN_X_MM * 2);
            const contentHeight = A4_HEIGHT_MM - (MARGIN_Y_MM * 2);

            for (let i = 0; i < totalPages; i++) {
                setPdfProgress({ current: i + 1, total: totalPages, message: `${i + 1}/${totalPages} 페이지 변환 중...` });

                await new Promise<void>(resolve => setTimeout(async () => {
                    const pageElement = pageElements[i];
                    
                    const canvas = await html2canvas(pageElement, {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        onclone: (document) => {
                            const popovers = document.querySelectorAll('.glass-popover');
                            popovers.forEach(popover => popover.remove());
                        }
                    });

                    const canvasWidth = canvas.width;
                    const canvasHeight = canvas.height;
                    
                    const imageRatio = canvasHeight / canvasWidth;
                    let imgWidth = contentWidth;
                    let imgHeight = imgWidth * imageRatio;

                    if (imgHeight > contentHeight) {
                        imgHeight = contentHeight;
                        imgWidth = imgHeight / imageRatio;
                    }
                    
                    const posX = MARGIN_X_MM + (contentWidth - imgWidth) / 2;
                    const posY = MARGIN_Y_MM + (contentHeight - imgHeight) / 2;

                    if (i > 0) {
                        pdf.addPage();
                    }

                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', posX, posY, imgWidth, imgHeight);
                    resolve();
                }, 0));
            }
            
            setPdfProgress({ current: totalPages, total: totalPages, message: '파일 저장 중...' });
            
            const examTitle = headerInfo.title || '시험지';
            await new Promise<void>(resolve => setTimeout(() => {
                pdf.save(`${examTitle}.pdf`);
                resolve();
            }, 0));

        } catch (error) {
            console.error("PDF 생성 중 오류 발생:", error);
            alert("PDF를 생성하는 데 실패했습니다. 콘솔을 확인해주세요.");
        } finally {
            setIsGeneratingPdf(false);
            previewElement.classList.remove('pdf-generating');
        }
    }, [selectedProblems, headerInfo.title]);

    const handleCloseSidebar = useCallback(() => { setRightSidebarConfig({ contentConfig: { type: null } }); setRightSidebarExpanded(false); }, [setRightSidebarConfig, setRightSidebarExpanded]);
    const handleCloseEditor = useCallback(() => { setEditingProblemId(null); handleCloseSidebar(); forceRecalculateLayout(problemBoxMinHeight); }, [setEditingProblemId, handleCloseSidebar, forceRecalculateLayout, problemBoxMinHeight]);
    const handleSaveAndClose = useCallback(async (problem: ProcessedProblem) => { await handleSaveProblem(problem); handleCloseEditor(); }, [handleSaveProblem, handleCloseEditor]);
    const handleRevertAndKeepOpen = useCallback((problemId: string) => { handleRevertProblem(problemId); }, [handleRevertProblem]);
    const handleProblemClick = useCallback((problem: ProcessedProblem) => { startEditingProblem(); setEditingProblemId(problem.uniqueId); setRightSidebarConfig({ contentConfig: { type: 'problemEditor', props: { onProblemChange: handleLiveProblemChange, onSave: handleSaveAndClose, onRevert: handleRevertAndKeepOpen, onClose: handleCloseEditor, isSaving: false } }, isExtraWide: true }); }, [startEditingProblem, setEditingProblemId, setRightSidebarConfig, handleLiveProblemChange, handleSaveAndClose, handleRevertAndKeepOpen, handleCloseEditor]);
    
    const handleOpenLatexHelpSidebar = useCallback(() => { setRightSidebarConfig({ contentConfig: { type: 'latexHelp' }}); setRightSidebarExpanded(true); }, [setRightSidebarConfig, setRightSidebarExpanded]);
    const handleOpenSettingsSidebar = useCallback(() => { setRightSidebarConfig({ contentConfig: { type: 'settings' }}); setRightSidebarExpanded(true); }, [setRightSidebarConfig, setRightSidebarExpanded]);
    
    const jsonStringToCombine = useMemo(() => {
        const problemsToConvert = selectedProblems.length > 0 ? selectedProblems : allProblems.slice(0, 1);
        if (problemsToConvert.length === 0) return '';

        const problemsForJson = problemsToConvert.map(p => ({
            problem_id: p.problem_id,
            question_number: p.question_number,
            problem_type: p.problem_type,
            question_text: p.question_text,
            answer: p.answer,
            solution_text: p.solution_text,
            page: p.page,
            grade: p.grade,
            semester: p.semester,
            source: p.source,
            major_chapter_id: p.major_chapter_id,
            middle_chapter_id: p.middle_chapter_id,
            core_concept_id: p.core_concept_id,
            problem_category: p.problem_category,
            difficulty: p.difficulty,
            score: p.score,
        }));
        return JSON.stringify({ problems: problemsForJson }, null, 2);
    }, [selectedProblems, allProblems]);

    const handleOpenPromptSidebar = useCallback(() => {
        setRightSidebarConfig({
            contentConfig: {
                type: 'prompt',
                props: { workbenchContent: jsonStringToCombine }
            },
            isExtraWide: false
        });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded, jsonStringToCombine]);

    useExamLayoutManager({ selectedProblems, problemBoxMinHeight });
    
    useEffect(() => {
        const { contentConfig } = useLayoutStore.getState().rightSidebar;
        if (contentConfig.type === 'problemEditor' && contentConfig.props) {
            setRightSidebarConfig({ contentConfig: { ...contentConfig, props: { ...contentConfig.props, isSaving: isSavingProblem } }, isExtraWide: true });
        }
    }, [isSavingProblem, setRightSidebarConfig]);
    
    useEffect(() => {
        registerPageActions({ 
            onClose: handleCloseSidebar, 
            openLatexHelpSidebar: handleOpenLatexHelpSidebar, 
            openSearchSidebar: () => {}, 
            openSettingsSidebar: handleOpenSettingsSidebar,
            openPromptSidebar: handleOpenPromptSidebar,
        });
        return () => { setRightSidebarConfig({ contentConfig: { type: null } }); setSearchBoxProps(null); };
    }, [handleCloseSidebar, setRightSidebarConfig, handleOpenLatexHelpSidebar, registerPageActions, setSearchBoxProps, handleOpenSettingsSidebar, handleOpenPromptSidebar]);
    
    return {
        handleSelectionChange,
        allProblems, selectedProblems, distributedPages, placementMap, distributedSolutionPages, solutionPlacementMap,
        headerInfo, useSequentialNumbering, baseFontSize, contentFontSizeEm, measuredHeights,
        onHeightUpdate: handleHeightUpdate, onProblemClick: handleProblemClick, onHeaderUpdate: handleHeaderUpdate,
        onToggleSequentialNumbering: () => setUseSequentialNumbering(!useSequentialNumbering),
        onBaseFontSizeChange: setBaseFontSize, onContentFontSizeEmChange: setContentFontSizeEm,
        onDownloadPdf: handleDownloadPdf, 
        isGeneratingPdf,
        pdfProgress,
        previewAreaRef, problemBoxMinHeight, setProblemBoxMinHeight,
    };
}