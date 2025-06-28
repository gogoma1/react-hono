// ./react/pages/ProblemPublishingPage.tsx

import React from 'react';
import { useProblemPublishingPage } from '../features/problem-publishing';
import Modal from '../shared/ui/modal/Modal';
import ProblemSelectionWidget from '../widgets/ProblemSelectionWidget';
import PublishingToolbarWidget from '../widgets/PublishingToolbarWidget';
import ExamPreviewWidget from '../widgets/ExamPreviewWidget';
import './ProblemPublishingPage.css';

const ProblemPublishingPage: React.FC = () => {
    const {
        sourceProblems,
        filteredProblems, 
        isLoadingProblems, 
        selectedProblems, 
        selectedIds, 
        isAllSelected,
        distributedPages, placementMap, distributedSolutionPages, solutionPlacementMap,
        headerInfo, useSequentialNumbering, baseFontSize, contentFontSizeEm,
        measuredHeights, problemBoxMinHeight, previewAreaRef,
        toggleRow, 
        onToggleAll,
        onToggleSequentialNumbering, onBaseFontSizeChange,
        onContentFontSizeEmChange, onDownloadPdf, setProblemBoxMinHeight,
        onHeightUpdate, onProblemClick, onHeaderUpdate, onDeselectProblem,
        onDeleteSelected,
        isBulkDeleteModalOpen,
        onCloseBulkDeleteModal,
        onConfirmBulkDelete,
        isDeletingProblems,
    } = useProblemPublishingPage();

    return (
        <>
            <div className="problem-publishing-page">
                <div className="sticky-top-container">
                    <div className="selection-widget-container">
                        <ProblemSelectionWidget 
                            problems={filteredProblems} 
                            isLoading={isLoadingProblems} 
                            selectedIds={selectedIds} 
                            onToggleRow={toggleRow} 
                            onToggleAll={onToggleAll}
                            isAllSelected={isAllSelected}
                            onDeleteSelected={onDeleteSelected}
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
                        allProblems={sourceProblems}
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

            <Modal
                isOpen={isBulkDeleteModalOpen}
                onClose={onCloseBulkDeleteModal}
                onConfirm={onConfirmBulkDelete}
                isConfirming={isDeletingProblems}
                title="선택한 문제 영구 삭제"
                confirmText={`삭제 (${selectedIds.size}개)`}
                size="small"
            >
                <p>
                    선택한 <strong>{selectedIds.size}개</strong>의 문제를 영구적으로 삭제하시겠습니까?
                    <br />
                    이 작업은 되돌릴 수 없습니다.
                </p>
            </Modal>
        </>
    );
};

export default ProblemPublishingPage;