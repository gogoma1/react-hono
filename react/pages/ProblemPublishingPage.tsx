import React from 'react';
import { useProblemPublishingPage } from '../features/problem-publishing';
import ProblemSelectionContainer from '../widgets/ProblemSelectionContainer';
import PublishingToolbarWidget from '../widgets/PublishingToolbarWidget';
import ExamPreviewWidget from '../widgets/ExamPreviewWidget';
import Modal from '../shared/ui/modal/Modal';
import './ProblemPublishingPage.css';
import './PdfOptionsModal.css';

const ProblemPublishingPage: React.FC = () => {
    const {
        allProblems, isLoadingProblems, selectedIds, toggleRow, toggleItems, clearSelection,
        selectedProblems, distributedPages, placementMap, distributedSolutionPages, solutionPlacementMap,
        headerInfo, useSequentialNumbering, baseFontSize, contentFontSizeEm, measuredHeights,
        onHeightUpdate, onProblemClick, onHeaderUpdate, handleDeselectProblem,
        onToggleSequentialNumbering, onBaseFontSizeChange, onContentFontSizeEmChange,
        isGeneratingPdf, onDownloadPdf, pdfProgress,
        previewAreaRef, problemBoxMinHeight, setProblemBoxMinHeight,
        isPdfModalOpen,
        onClosePdfModal,
        pdfOptions,
        onPdfOptionChange,
        onConfirmPdfDownload,
    } = useProblemPublishingPage();

    const pageClassName = `problem-publishing-page ${isGeneratingPdf ? 'pdf-processing' : ''}`;

    return (
        <div className={pageClassName}>
            {isGeneratingPdf && <div className="processing-overlay" />}
            <div className="sticky-top-container">
                <div className="selection-widget-container">
                    <ProblemSelectionContainer
                        allProblems={allProblems}
                        selectedProblems={selectedProblems} // [추가] 선택된 문제 목록을 전달합니다.
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

            <Modal
                isOpen={isPdfModalOpen}
                onClose={onClosePdfModal}
                onConfirm={onConfirmPdfDownload}
                title="PDF 출력 옵션"
                confirmText="생성하기"
                size="small"
            >
                <div className="pdf-options-container">
                    <p className="options-description">PDF에 포함할 항목을 선택하세요.</p>
                    <div className="options-list">
                        <label className="option-item">
                            <input
                                type="checkbox"
                                checked={pdfOptions.includeProblems}
                                onChange={() => onPdfOptionChange('includeProblems')}
                            />
                            <span className="checkbox-label">문제</span>
                        </label>
                        <label className="option-item">
                            <input
                                type="checkbox"
                                checked={pdfOptions.includeAnswers}
                                onChange={() => onPdfOptionChange('includeAnswers')}
                            />
                            <span className="checkbox-label">빠른 정답</span>
                        </label>
                        <label className="option-item">
                            <input
                                type="checkbox"
                                checked={pdfOptions.includeSolutions}
                                onChange={() => onPdfOptionChange('includeSolutions')}
                            />
                            <span className="checkbox-label">정답 및 해설</span>
                        </label>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProblemPublishingPage;