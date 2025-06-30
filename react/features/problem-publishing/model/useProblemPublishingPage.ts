import { useCallback, useRef, useMemo, useState, useEffect } from 'react'; // [추가] useEffect 임포트
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
    
    const handleDeselectProblem = useCallback((uniqueId: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(uniqueId);
            return newSet;
        });
    }, [setSelectedIds]);

    const previewManager = useExamPreviewManager();
    useExamLayoutManager({ selectedProblems, problemBoxMinHeight: previewManager.problemBoxMinHeight });
    const { distributedPages, placementMap, distributedSolutionPages, solutionPlacementMap } = useExamLayoutStore();
    
    // [수정] setHeaderInfo를 받아옵니다.
    const { headerInfo, onHeaderUpdate, setHeaderInfo } = useExamHeaderState();
    const { onProblemClick } = useProblemEditor({ problemBoxMinHeight: previewManager.problemBoxMinHeight });
    usePublishingPageSetup({ selectedProblems, allProblems });

    // [핵심 추가] selectedProblems가 변경될 때 headerInfo의 source를 직접 업데이트합니다.
    useEffect(() => {
        if (selectedProblems.length > 0) {
            const newSource = selectedProblems[0].source || '정보 없음';
            setHeaderInfo(prev => ({
                ...prev,
                source: newSource
            }));
        } else {
            // 선택된 문제가 없으면 source를 초기화합니다.
            setHeaderInfo(prev => ({
                ...prev,
                source: '정보 없음'
            }));
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

        isPdfModalOpen,
        onClosePdfModal: () => setIsPdfModalOpen(false),
        pdfOptions,
        onPdfOptionChange: handlePdfOptionChange,
        onConfirmPdfDownload: handleConfirmPdfDownload,
    };
}