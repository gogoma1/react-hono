import { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import { useProblemPublishing } from './useProblemPublishing';
import { useExamLayoutStore } from './examLayoutStore';
import { useExamLayoutManager } from './useExamLayoutManager';
import { useExamHeaderState } from '../hooks/useExamHeaderState';
import { useProblemEditor } from '../hooks/useProblemEditor';
import { useExamPreviewManager } from '../hooks/useExamPreviewManager';
import { usePublishingPageSetup } from '../hooks/usePublishingPageSetup';
import { useRowSelection } from '../../row-selection/model/useRowSelection';
import { usePdfGenerator, type PdfExportOptions } from '../hooks/usePdfGenerator';

export function useProblemPublishingPage() {
    const { allProblems, isLoadingProblems } = useProblemPublishing();
    const allProblemIds = useMemo(() => allProblems.map(p => p.uniqueId), [allProblems]);
    const { selectedIds, toggleRow, clearSelection, toggleItems, setSelectedIds } = useRowSelection({ allItems: allProblemIds });
    const selectedProblems = useMemo(() => allProblems.filter(p => selectedIds.has(p.uniqueId)), [allProblems, selectedIds]);
    
    // [핵심 수정] 함수를 useCallback으로 감쌉니다.
    const handleDeselectProblem = useCallback((uniqueId: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(uniqueId);
            return newSet;
        });
    }, [setSelectedIds]);

    const previewManager = useExamPreviewManager();

    const { problemBoxMinHeight, setProblemBoxMinHeight } = useExamLayoutStore();
    const [displayMinHeight, setDisplayMinHeight] = useState(problemBoxMinHeight);

    useEffect(() => {
        setDisplayMinHeight(problemBoxMinHeight);
    }, [problemBoxMinHeight]);
    
    useExamLayoutManager({ selectedProblems, problemBoxMinHeight });
    const { distributedPages, placementMap, distributedSolutionPages, solutionPlacementMap } = useExamLayoutStore();
    
    // [핵심 수정] onHeaderUpdate는 이미 useExamHeaderState 내부에서 useCallback으로 처리되어 있습니다.
    const { headerInfo, onHeaderUpdate, setHeaderInfo } = useExamHeaderState();
    
    // [핵심 수정] onProblemClick은 이미 useProblemEditor 내부에서 useCallback으로 처리되어 있습니다.
    const { onProblemClick } = useProblemEditor({ problemBoxMinHeight: displayMinHeight });
    
    usePublishingPageSetup({ selectedProblems, allProblems });

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

    // [핵심 수정] 함수를 useCallback으로 감쌉니다.
    const handlePdfOptionChange = useCallback((option: keyof PdfExportOptions) => {
        setPdfOptions(prev => ({ ...prev, [option]: !prev[option] }));
    }, []);

    // [핵심 수정] 함수를 useCallback으로 감쌉니다.
    const handleOpenPdfModal = useCallback(() => {
        if (selectedProblems.length === 0) {
            alert('PDF로 출력할 문제가 선택되지 않았습니다.');
            return;
        }
        setIsPdfModalOpen(true);
    }, [selectedProblems.length]);
    
    // [핵심 수정] 함수를 useCallback으로 감쌉니다.
    const handleConfirmPdfDownload = useCallback(() => {
        setIsPdfModalOpen(false);
        setTimeout(() => {
            generatePdf(pdfOptions);
        }, 100);
    }, [generatePdf, pdfOptions]);
    
    // [핵심 수정] 함수를 useCallback으로 감쌉니다.
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
        onHeaderUpdate, // 이미 메모이제이션됨
        onProblemClick, // 이미 메모이제이션됨
        handleDeselectProblem,
        
        isGeneratingPdf,
        onDownloadPdf: handleOpenPdfModal,
        pdfProgress,
        previewAreaRef,
        ...previewManager, // onHeightUpdate, onToggleSequentialNumbering 등 내부 함수들이 이미 useCallback으로 처리됨

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