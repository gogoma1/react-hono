import React from 'react';
import { useProblemPublishingPage } from '../features/problem-publishing';
import ProblemSelectionContainer from '../widgets/ProblemSelectionContainer';
import PublishingToolbarWidget from '../widgets/PublishingToolbarWidget';
import ExamPreviewWidget from '../widgets/ExamPreviewWidget';
import './ProblemPublishingPage.css';

const ProblemPublishingPage: React.FC = () => {
    const {
        allProblems, isLoadingProblems, selectedIds, toggleRow, toggleItems, clearSelection,
        selectedProblems, distributedPages, placementMap, distributedSolutionPages, solutionPlacementMap,
        headerInfo, useSequentialNumbering, baseFontSize, contentFontSizeEm, measuredHeights,
        onHeightUpdate, onProblemClick, onHeaderUpdate, handleDeselectProblem,
        onToggleSequentialNumbering, onBaseFontSizeChange, onContentFontSizeEmChange,
        // [수정] PDF 관련 props 제거
        previewAreaRef, problemBoxMinHeight, setProblemBoxMinHeight,
    } = useProblemPublishingPage();

    return (
        <div className="problem-publishing-page">
            <div className="sticky-top-container">
                <div className="selection-widget-container">
                    <ProblemSelectionContainer
                        allProblems={allProblems}
                        isLoading={isLoadingProblems}
                        selectedIds={selectedIds}
                        toggleRow={toggleRow}
                        toggleItems={toggleItems}
                        clearSelection={clearSelection}
                    />
                </div>
                <PublishingToolbarWidget 
                    useSequentialNumbering={useSequentialNumbering}
                    onToggleSequentialNumbering={onToggleSequentialNumbering}
                    baseFontSize={baseFontSize}
                    onBaseFontSizeChange={onBaseFontSizeChange}
                    contentFontSizeEm={contentFontSizeEm}
                    onContentFontSizeEmChange={onContentFontSizeEmChange} 
                    previewAreaRef={previewAreaRef}
                    problemBoxMinHeight={problemBoxMinHeight}
                    setProblemBoxMinHeight={setProblemBoxMinHeight}
                    // [수정] 툴바 위젯에 PDF 생성에 필요한 정보를 props로 전달합니다.
                    examTitle={headerInfo.title}
                    selectedProblemCount={selectedProblems.length}
                />
            </div>
            <div 
                ref={previewAreaRef}
                className="scrollable-content-area"
                style={{ '--problem-box-min-height-em': `${problemBoxMinHeight}em` } as React.CSSProperties}
            >
                <ExamPreviewWidget 
                    distributedPages={distributedPages} 
                    distributedSolutionPages={distributedSolutionPages}
                    allProblems={allProblems}
                    selectedProblems={selectedProblems}
                    placementMap={placementMap} 
                    solutionPlacementMap={solutionPlacementMap}
                    headerInfo={headerInfo} 
                    useSequentialNumbering={useSequentialNumbering} 
                    baseFontSize={baseFontSize} 
                    contentFontSizeEm={contentFontSizeEm} 
                    contentFontFamily={headerInfo.titleFontFamily} 
                    onHeightUpdate={onHeightUpdate}
                    onProblemClick={onProblemClick} 
                    onHeaderUpdate={onHeaderUpdate} 
                    onDeselectProblem={handleDeselectProblem}
                    measuredHeights={measuredHeights}
                />
            </div>
        </div>
    );
};

export default ProblemPublishingPage;