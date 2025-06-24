import React, { useState, useCallback, useEffect } from 'react';
import { useLayoutStore } from '../shared/store/layoutStore';
import { useProblemPublishing, type ProcessedProblem } from '../features/problem-publishing/model/useProblemPublishing';
import ProblemSelectionWidget from '../widgets/ProblemSelectionWidget';
import PublishingToolbarWidget from '../widgets/PublishingToolbarWidget';
import ExamPreviewWidget from '../widgets/ExamPreviewWidget';
import ProblemTextEditor from '../features/problem-text-editing/ui/ProblemTextEditor';
import './ProblemPublishingPage.css';

const ProblemPublishingPage: React.FC = () => {
    const {
        allProblems, isLoadingProblems, selectedIds, isAllSelected,
        distributedPages, placementMap, isCalculating, headerInfo, baseFontSize,
        contentFontSizeEm, problemBoxMinHeight, useSequentialNumbering,
        toggleRow, toggleSelectAll, handleHeightUpdate,
        handleHeaderUpdate, setBaseFontSize, setContentFontSizeEm,
        setProblemBoxMinHeight, setUseSequentialNumbering,
        // [수정] 새로운 핸들러들을 가져옵니다.
        handleSaveProblem,
        handleLiveProblemChange,
        handleRevertProblem,
        startEditingProblem
    } = useProblemPublishing();

    const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
    const { setRightSidebarConfig, registerPageActions } = useLayoutStore.getState();

    // 시험지에서 문제를 클릭했을 때 호출될 함수
    const handleProblemClick = useCallback((problem: ProcessedProblem) => {
        startEditingProblem(); // 편집용 '초안' 상태 생성 또는 유지
        setEditingProblemId(problem.uniqueId); // 어떤 문제를 편집할지 ID 설정
    }, [startEditingProblem]);

    // 사이드바의 'X' 버튼 클릭 시 호출 (상태는 유지하고 닫기만 함)
    const handleCloseEditor = useCallback(() => {
        setEditingProblemId(null);
    }, []);

    // [추가] 사이드바의 '저장' 버튼 클릭 시
    const handleSaveAndClose = useCallback(async (problem: ProcessedProblem) => {
        await handleSaveProblem(problem);
        handleCloseEditor();
    }, [handleSaveProblem, handleCloseEditor]);

    // [추가] 사이드바의 '취소' 버튼 클릭 시
    const handleCancelAndClose = useCallback((problemId: string) => {
        handleRevertProblem(problemId);
        handleCloseEditor();
    }, [handleRevertProblem, handleCloseEditor]);
    
    const handleDownloadPdf = useCallback(() => alert('PDF 다운로드 기능 구현 예정'), []);

    useEffect(() => {
        if (editingProblemId) {
            const problemToEdit = allProblems.find(p => p.uniqueId === editingProblemId);
            
            if (problemToEdit) {
                setRightSidebarConfig({
                    content: (
                        <ProblemTextEditor 
                            key={problemToEdit.uniqueId} 
                            problem={problemToEdit} 
                            // [수정] 새로운 핸들러들을 props로 전달
                            onSave={handleSaveAndClose}
                            onCancel={handleCancelAndClose}
                            onClose={handleCloseEditor}
                            onProblemChange={handleLiveProblemChange}
                        />
                    ),
                    isExtraWide: true 
                });
            } else {
                // 편집 ID가 있는데 해당 문제를 찾을 수 없는 경우 (예: 데이터 리프레시 후 삭제)
                setEditingProblemId(null);
                setRightSidebarConfig({ content: null, isExtraWide: false });
            }
        } else {
            // editingProblemId가 null이면 사이드바를 닫습니다.
            const timer = setTimeout(() => setRightSidebarConfig({ content: null, isExtraWide: false }), 300);
            return () => clearTimeout(timer);
        }
    }, [editingProblemId, allProblems, setRightSidebarConfig, handleSaveAndClose, handleCancelAndClose, handleCloseEditor, handleLiveProblemChange]);
    
    useEffect(() => {
        // 페이지 진입/이탈 시 레이아웃 스토어 등록 및 정리
        registerPageActions({ onClose: handleCloseEditor });
        return () => {
            setRightSidebarConfig({ content: null, isExtraWide: false });
            registerPageActions({ onClose: undefined });
        };
    }, [registerPageActions, handleCloseEditor, setRightSidebarConfig]);

    return (
        <div className="problem-publishing-page">
            <div className="sticky-top-container">
                <div className="selection-widget-container">
                    <ProblemSelectionWidget 
                        problems={allProblems} 
                        isLoading={isLoadingProblems} 
                        selectedIds={selectedIds} 
                        onToggleRow={toggleRow} 
                        onToggleAll={toggleSelectAll} 
                        isAllSelected={isAllSelected} 
                    />
                </div>
                <PublishingToolbarWidget 
                    useSequentialNumbering={useSequentialNumbering}
                    onToggleSequentialNumbering={() => setUseSequentialNumbering(p => !p)}
                    baseFontSize={baseFontSize}
                    onBaseFontSizeChange={setBaseFontSize}
                    contentFontSizeEm={contentFontSizeEm}
                    onContentFontSizeEmChange={setContentFontSizeEm}
                    problemBoxMinHeight={problemBoxMinHeight}
                    onProblemBoxMinHeightChange={setProblemBoxMinHeight}
                    onDownloadPdf={handleDownloadPdf} 
                />
            </div>
            <div className="scrollable-content-area">
                <ExamPreviewWidget 
                    distributedPages={distributedPages} 
                    allProblems={allProblems} 
                    placementMap={placementMap} 
                    isCalculating={isCalculating} 
                    headerInfo={headerInfo} 
                    useSequentialNumbering={useSequentialNumbering} 
                    baseFontSize={baseFontSize} 
                    contentFontSizeEm={contentFontSizeEm} 
                    contentFontFamily={headerInfo.titleFontFamily} 
                    problemBoxMinHeight={problemBoxMinHeight} 
                    onHeightUpdate={handleHeightUpdate} 
                    onProblemUpdate={() => {}} // [수정] 이 위젯에서의 직접 업데이트는 막고 사이드바를 통하게 함
                    onProblemClick={handleProblemClick} 
                    onHeaderUpdate={handleHeaderUpdate} 
                />
            </div>
        </div>
    );
};

export default ProblemPublishingPage;