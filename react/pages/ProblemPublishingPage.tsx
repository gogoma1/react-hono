import React, { useCallback, useEffect } from 'react';
import { useLayoutStore } from '../shared/store/layoutStore';
import { useProblemPublishing, type ProcessedProblem } from '../features/problem-publishing/model/useProblemPublishing';
import ProblemSelectionWidget from '../widgets/ProblemSelectionWidget';
import PublishingToolbarWidget from '../widgets/PublishingToolbarWidget';
import ExamPreviewWidget from '../widgets/ExamPreviewWidget';
import './ProblemPublishingPage.css';

const ProblemPublishingPage: React.FC = () => {
    const {
        allProblems, isLoadingProblems, selectedIds, isAllSelected,
        distributedPages, placementMap, isCalculating, headerInfo, baseFontSize,
        contentFontSizeEm, problemBoxMinHeight, useSequentialNumbering,
        toggleRow, toggleSelectAll, handleHeightUpdate,
        handleHeaderUpdate, setBaseFontSize, setContentFontSizeEm,
        setProblemBoxMinHeight, setUseSequentialNumbering,
        handleSaveProblem,
        handleLiveProblemChange,
        handleRevertProblem,
        startEditingProblem,
        setEditingProblemId,
    } = useProblemPublishing();

    const { setRightSidebarConfig, registerPageActions } = useLayoutStore.getState();

    const handleCloseEditor = useCallback(() => {
        setEditingProblemId(null);
        setRightSidebarConfig({ contentConfig: { type: null } });
    }, [setEditingProblemId, setRightSidebarConfig]);
    
    // [추가] LaTeX 도움말 사이드바를 여는 함수
    const handleOpenLatexHelpSidebar = useCallback(() => {
        setRightSidebarConfig({ 
            contentConfig: { type: 'latexHelp' },
            isExtraWide: false
        });
    }, [setRightSidebarConfig]);

    const handleSaveAndClose = useCallback(async (problem: ProcessedProblem) => {
        await handleSaveProblem(problem);
        handleCloseEditor();
    }, [handleSaveProblem, handleCloseEditor]);

    const handleRevertAndKeepOpen = useCallback((problemId: string) => {
        handleRevertProblem(problemId);
    }, [handleRevertProblem]);
    
    const handleProblemClick = useCallback((problem: ProcessedProblem) => {
        startEditingProblem();
        setEditingProblemId(problem.uniqueId);

        setRightSidebarConfig({
            contentConfig: {
                type: 'problemEditor',
                props: {
                    onProblemChange: handleLiveProblemChange,
                    onSave: handleSaveAndClose,
                    onRevert: handleRevertAndKeepOpen,
                    onClose: handleCloseEditor,
                }
            },
            isExtraWide: true
        });
    }, [
        startEditingProblem, 
        setEditingProblemId,
        setRightSidebarConfig, 
        handleSaveAndClose, 
        handleRevertAndKeepOpen, 
        handleCloseEditor, 
        handleLiveProblemChange
    ]);

    const handleDownloadPdf = useCallback(() => alert('PDF 다운로드 기능 구현 예정'), []);

    useEffect(() => {
        // [수정] openLatexHelpSidebar 액션을 등록
        registerPageActions({ 
            onClose: handleCloseEditor,
            openLatexHelpSidebar: handleOpenLatexHelpSidebar
        });
        return () => {
            setRightSidebarConfig({ contentConfig: { type: null } });
            // [수정] 액션 등록 해제
            registerPageActions({ 
                onClose: undefined,
                openLatexHelpSidebar: undefined
            });
        };
    }, [registerPageActions, handleCloseEditor, setRightSidebarConfig, handleOpenLatexHelpSidebar]);

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
                    onProblemClick={handleProblemClick} 
                    onHeaderUpdate={handleHeaderUpdate} 
                />
            </div>
        </div>
    );
};

export default ProblemPublishingPage;