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
        toggleRow, toggleSelectAll, handleHeightUpdate, handleProblemDBSave,
        handleHeaderUpdate, setBaseFontSize, setContentFontSizeEm,
        setProblemBoxMinHeight, setUseSequentialNumbering,
        handleLiveProblemChange, startEditingProblem
    } = useProblemPublishing();

    const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
    const { setRightSidebarConfig, registerPageActions } = useLayoutStore.getState();

    const handleProblemClick = useCallback((problem: ProcessedProblem) => {
        startEditingProblem(); // 편집용 데이터 복사본 생성
        setEditingProblemId(problem.uniqueId); // 어떤 문제를 편집할지 ID 설정
    }, [startEditingProblem]);

    const handleCloseEditor = useCallback(() => {
        setEditingProblemId(null);
    }, []);
    
    const handleDownloadPdf = useCallback(() => alert('PDF 다운로드 기능 구현 예정'), []);

    // 사이드바 렌더링을 위한 useEffect (이 부분은 이전과 동일하지만 더 안정적으로 동작)
    useEffect(() => {
        if (editingProblemId) {
            const problemToEdit = allProblems.find(p => p.uniqueId === editingProblemId);
            
            if (problemToEdit) {
                setRightSidebarConfig({
                    content: (
                        <ProblemTextEditor 
                            key={problemToEdit.uniqueId} 
                            problem={problemToEdit} 
                            onSave={handleProblemDBSave} 
                            onClose={handleCloseEditor}
                            onProblemChange={handleLiveProblemChange}
                        />
                    ),
                    isExtraWide: true 
                });
            } else {
                // 편집하려던 문제가 사라졌을 경우 (예: 필터링 변경) 사이드바를 닫음
                setEditingProblemId(null);
                setRightSidebarConfig({ content: null, isExtraWide: false });
            }
        } else {
            // editingProblemId가 null이면 사이드바 닫기
            const timer = setTimeout(() => setRightSidebarConfig({ content: null, isExtraWide: false }), 300);
            return () => clearTimeout(timer);
        }
    }, [editingProblemId, allProblems, setRightSidebarConfig, handleProblemDBSave, handleCloseEditor, handleLiveProblemChange]);
    
    useEffect(() => {
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
                    onProblemUpdate={handleProblemDBSave} 
                    onProblemClick={handleProblemClick} 
                    onHeaderUpdate={handleHeaderUpdate} 
                />
            </div>
        </div>
    );
};

export default ProblemPublishingPage;