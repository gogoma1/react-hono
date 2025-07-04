import React, { useEffect } from 'react';
import { useProblemPublishingPage } from '../features/problem-publishing';
import ProblemSelectionContainer from '../widgets/ProblemSelectionContainer';
import PublishingToolbarWidget from '../widgets/PublishingToolbarWidget';
import ExamPreviewWidget from '../widgets/ExamPreviewWidget';
import Modal from '../shared/ui/modal/Modal';
import SelectedStudentsPanel from '../features/selected-students-viewer/ui/SelectedStudentsPanel';
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
        previewAreaRef, 
        displayMinHeight, 
        setDisplayMinHeight, 
        setProblemBoxMinHeight,
        isPdfModalOpen,
        onClosePdfModal,
        pdfOptions,
        onPdfOptionChange,
        onConfirmPdfDownload,
        isMobilePublishModalOpen,
        onOpenMobilePublishModal,
        onCloseMobilePublishModal,
        onConfirmMobilePublish,
        isPublishing,
        selectedStudentCount,
        selectedProblemCount,
    } = useProblemPublishingPage();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const pageClassName = `problem-publishing-page ${isGeneratingPdf || isPublishing ? 'pdf-processing' : ''}`;

    return (
        <div className={pageClassName}>
            {(isGeneratingPdf || isPublishing) && <div className="processing-overlay" />}
            <div className="sticky-top-container">
                <div className="selection-widget-container">
                    <ProblemSelectionContainer
                        allProblems={allProblems}
                        selectedProblems={selectedProblems}
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
                    displayMinHeight={displayMinHeight}
                    onDisplayMinHeightChange={setDisplayMinHeight}
                    onFinalMinHeightChange={setProblemBoxMinHeight}
                    onDownloadPdf={onDownloadPdf}
                    isGeneratingPdf={isGeneratingPdf}
                    pdfProgress={pdfProgress}
                    onPublishMobileExam={onOpenMobilePublishModal}
                    isPublishing={isPublishing}
                />
            </div>
            <div 
                ref={previewAreaRef}
                className="scrollable-content-area"
                style={{ '--problem-box-min-height-em': `${displayMinHeight}em` } as React.CSSProperties}
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
                            <input type="checkbox" checked={pdfOptions.includeProblems} onChange={() => onPdfOptionChange('includeProblems')} />
                            <span className="checkbox-label">문제</span>
                        </label>
                        <label className="option-item">
                            <input type="checkbox" checked={pdfOptions.includeAnswers} onChange={() => onPdfOptionChange('includeAnswers')} />
                            <span className="checkbox-label">빠른 정답</span>
                        </label>
                        <label className="option-item">
                            <input type="checkbox" checked={pdfOptions.includeSolutions} onChange={() => onPdfOptionChange('includeSolutions')} />
                            <span className="checkbox-label">정답 및 해설</span>
                        </label>
                    </div>
                </div>
            </Modal>

            {/* [핵심] 모바일 출제 모달에 수정된 props 전달 */}
            <Modal
                isOpen={isMobilePublishModalOpen}
                onClose={onCloseMobilePublishModal}
                onConfirm={onConfirmMobilePublish}
                isConfirming={isPublishing}
                title="모바일 시험지 출제 확인"
                confirmText="출제하기"
                confirmLoadingText="출제 중..." /* [수정] 올바른 로딩 텍스트 전달 */
                isConfirmDestructive={false}    /* [수정] 이 액션은 파괴적이지 않으므로 false */
                size="medium"
            >
                <div className="publish-confirm-container">
                    <p>
                        아래 <strong>{selectedStudentCount}</strong>명의 학생에게 <strong>{selectedProblemCount}</strong>개의 문제로 구성된 시험지를 출제합니다.
                    </p>
                    
                    <SelectedStudentsPanel 
                        hideTitle={true} 
                        className="in-modal" 
                    />
                    
                    <p className="confirm-warning">
                        출제 후에는 문제 구성을 변경할 수 없습니다. 계속하시겠습니까?
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default ProblemPublishingPage;