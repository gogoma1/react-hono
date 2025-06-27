import React from 'react';
import { useProblemPublishingPage } from '../features/problem-publishing';

import ProblemSelectionWidget from '../widgets/ProblemSelectionWidget';
import PublishingToolbarWidget from '../widgets/PublishingToolbarWidget';
import ExamPreviewWidget from '../widgets/ExamPreviewWidget';

import './ProblemPublishingPage.css';

const ProblemPublishingPage: React.FC = () => {
    const {
        allProblems, isLoadingProblems, selectedProblems, selectedIds, isAllSelected,
        distributedPages, placementMap, distributedSolutionPages, solutionPlacementMap,
        headerInfo, useSequentialNumbering, baseFontSize, contentFontSizeEm,
        measuredHeights, problemBoxMinHeight, previewAreaRef,
        toggleRow, toggleSelectAll, onToggleSequentialNumbering, onBaseFontSizeChange,
        onContentFontSizeEmChange, onDownloadPdf, setProblemBoxMinHeight,
        onHeightUpdate, onProblemClick, onHeaderUpdate, onDeselectProblem
    } = useProblemPublishingPage();

    return (
        <div className="problem-publishing-page">
            <div className="sticky-top-container">
                <div className="selection-widget-container">
                    <ProblemSelectionWidget 
                        problems={allProblems} 
                        isLoading={isLoadingProblems} 
                        selectedIds={selectedIds} 
                        onToggleRow={toggleRow} 
                        onToggleAll={toggleSelectAll} // 이 함수는 이제 필터링된 결과에 대해 동작합니다.
                        isAllSelected={isAllSelected} // 이 값은 이제 필터링된 결과의 선택 상태를 나타냅니다.
                    />
                </div>
                <PublishingToolbarWidget 
                    useSequentialNumbering={useSequentialNumbering}
                    onToggleSequentialNumbering={onToggleSequentialNumbering}
                    baseFontSize={baseFontSize}
                    onBaseFontSizeChange={onBaseFontSizeChange}
                    contentFontSizeEm={contentFontSizeEm}
                    onContentFontSizeEmChange={onContentFontSizeEmChange} 
                    onDownloadPdf={onDownloadPdf}
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
                    onDeselectProblem={onDeselectProblem} 
                    measuredHeights={measuredHeights}
                />
            </div>
        </div>
    );
};

export default ProblemPublishingPage;