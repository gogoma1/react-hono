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
        isGeneratingPdf, onDownloadPdf, pdfProgress,
        previewAreaRef, problemBoxMinHeight, setProblemBoxMinHeight,
    } = useProblemPublishingPage();

    const pageClassName = `problem-publishing-page ${isGeneratingPdf ? 'pdf-processing' : ''}`;

    return (
        <div className={pageClassName}>
            {isGeneratingPdf && <div className="processing-overlay" />}
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
                    problemBoxMinHeight={problemBoxMinHeight}
                    setProblemBoxMinHeight={setProblemBoxMinHeight}
                    onDownloadPdf={onDownloadPdf}
                    isGeneratingPdf={isGeneratingPdf}
                    pdfProgress={pdfProgress}
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