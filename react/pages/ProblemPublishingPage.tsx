import React from 'react';
import { useProblemPublishingPage } from '../features/problem-publishing';
import ProblemSelectionContainer from '../widgets/ProblemSelectionContainer';
import PublishingToolbarWidget from '../widgets/PublishingToolbarWidget';
import ExamPreviewWidget from '../widgets/ExamPreviewWidget';
import './ProblemPublishingPage.css';

const ProblemPublishingPage: React.FC = () => {
    const {
        handleSelectionChange,
        allProblems, selectedProblems, distributedPages, placementMap, distributedSolutionPages, solutionPlacementMap,
        headerInfo, useSequentialNumbering, baseFontSize, contentFontSizeEm, measuredHeights,
        onHeightUpdate, onProblemClick, onHeaderUpdate,
        onToggleSequentialNumbering, onBaseFontSizeChange, onContentFontSizeEmChange, onDownloadPdf,
        isGeneratingPdf,
        pdfProgress, // [추가]
        previewAreaRef, problemBoxMinHeight, setProblemBoxMinHeight,
    } = useProblemPublishingPage();

    return (
        <div className="problem-publishing-page">
            <div className="sticky-top-container">
                <div className="selection-widget-container">
                    <ProblemSelectionContainer onSelectionChange={handleSelectionChange} />
                </div>
                <PublishingToolbarWidget 
                    useSequentialNumbering={useSequentialNumbering}
                    onToggleSequentialNumbering={onToggleSequentialNumbering}
                    baseFontSize={baseFontSize}
                    onBaseFontSizeChange={onBaseFontSizeChange}
                    contentFontSizeEm={contentFontSizeEm}
                    onContentFontSizeEmChange={onContentFontSizeEmChange} 
                    onDownloadPdf={onDownloadPdf}
                    isGeneratingPdf={isGeneratingPdf}
                    pdfProgressMessage={pdfProgress.message} // [추가] 진행 메시지 전달
                    previewAreaRef={previewAreaRef}
                    problemBoxMinHeight={problemBoxMinHeight}
                    setProblemBoxMinHeight={setProblemBoxMinHeight}
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
                    onDeselectProblem={() => { /* 컨테이너에서 처리되므로 여기선 필요 없음 */ }} 
                    measuredHeights={measuredHeights}
                />
            </div>
        </div>
    );
};

export default ProblemPublishingPage;