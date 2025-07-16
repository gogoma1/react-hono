import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useProblemPublishingPage } from '../features/problem-publishing';
import ProblemSelectionContainer from '../widgets/ProblemSelectionContainer';
import PublishingToolbarWidget from '../widgets/PublishingToolbarWidget';
import ExamPreviewWidget from '../widgets/ExamPreviewWidget';
import Modal from '../shared/ui/modal/Modal';
import SelectedStudentsPanel from '../features/selected-students-viewer/ui/SelectedStudentsPanel';
import './ProblemPublishingPage.css';
import './PdfOptionsModal.css';

const ProblemPublishingPage: React.FC = () => {
    const pageLogic = useProblemPublishingPage();

    const [selectionContainerHeight, setSelectionContainerHeight] = useState(500);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ y: 0, initialHeight: 0 });

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = {
            y: e.clientY,
            initialHeight: selectionContainerHeight,
        };
    }, [selectionContainerHeight]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        const deltaY = e.clientY - dragStartRef.current.y;
        const newHeight = dragStartRef.current.initialHeight + deltaY;
        const clampedHeight = Math.max(200, Math.min(newHeight, window.innerHeight * 0.8));
        setSelectionContainerHeight(clampedHeight);
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.classList.add('resizing-vertical');
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove('resizing-vertical');
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove('resizing-vertical');
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    
    const pageClassName = `problem-publishing-page ${pageLogic.isGeneratingPdf || pageLogic.isPublishing ? 'pdf-processing' : ''}`;

    return (
        <div className={pageClassName}>
            {(pageLogic.isGeneratingPdf || pageLogic.isPublishing) && <div className="processing-overlay" />}
            <div className="sticky-top-container">
                <div className="selection-widget-container" style={{ height: `${selectionContainerHeight}px` }}>
                    <ProblemSelectionContainer
                        allProblems={pageLogic.allProblems}
                        selectedProblems={pageLogic.selectedProblems}
                        isLoading={pageLogic.isLoadingProblems}
                        selectedIds={pageLogic.selectedIds}
                        toggleRow={pageLogic.toggleRow}
                        toggleItems={pageLogic.toggleItems}
                        clearSelection={pageLogic.clearSelection}
                        isSearchBoxVisible={pageLogic.isSearchBoxVisible}
                        toggleSearchBox={pageLogic.toggleSearchBox}
                    />
                </div>

                <div 
                    className="vertical-resizer" 
                    onMouseDown={handleMouseDown}
                    aria-label="상단 패널 높이 조절"
                    role="separator"
                />

                <PublishingToolbarWidget 
                    useSequentialNumbering={pageLogic.useSequentialNumbering}
                    onToggleSequentialNumbering={pageLogic.onToggleSequentialNumbering}
                    baseFontSize={pageLogic.baseFontSize}
                    onBaseFontSizeChange={pageLogic.onBaseFontSizeChange}
                    contentFontSizeEm={pageLogic.contentFontSizeEm}
                    onContentFontSizeEmChange={pageLogic.onContentFontSizeEmChange} 
                    displayMinHeight={pageLogic.displayMinHeight}
                    onDisplayMinHeightChange={pageLogic.setDisplayMinHeight}
                    onFinalMinHeightChange={pageLogic.setProblemBoxMinHeight}
                    onDownloadPdf={pageLogic.onDownloadPdf}
                    isGeneratingPdf={pageLogic.isGeneratingPdf}
                    pdfProgress={pageLogic.pdfProgress}
                    onPublishMobileExam={pageLogic.onOpenMobilePublishModal}
                    isPublishing={pageLogic.isPublishing}
                />
            </div>
            <div 
                ref={pageLogic.previewAreaRef}
                className="scrollable-content-area"
                style={{ '--problem-box-min-height-em': `${pageLogic.displayMinHeight}em` } as React.CSSProperties}
            >
                <ExamPreviewWidget 
                    distributedPages={pageLogic.distributedPages} 
                    distributedSolutionPages={pageLogic.distributedSolutionPages}
                    allProblems={pageLogic.allProblems}
                    selectedProblems={pageLogic.selectedProblems}
                    placementMap={pageLogic.placementMap} 
                    solutionPlacementMap={pageLogic.solutionPlacementMap}
                    headerInfo={pageLogic.headerInfo} 
                    useSequentialNumbering={pageLogic.useSequentialNumbering} 
                    baseFontSize={pageLogic.baseFontSize} 
                    contentFontSizeEm={pageLogic.contentFontSizeEm} 
                    contentFontFamily={pageLogic.headerInfo.titleFontFamily} 
                    onHeightUpdate={pageLogic.onHeightUpdate}
                    onProblemClick={pageLogic.onProblemClick} 
                    onHeaderUpdate={pageLogic.onHeaderUpdate} 
                    onDeselectProblem={pageLogic.handleDeselectProblem}
                    measuredHeights={pageLogic.measuredHeights}
                />
            </div>

            <Modal
                isOpen={pageLogic.isPdfModalOpen}
                onClose={pageLogic.onClosePdfModal}
                onConfirm={pageLogic.onConfirmPdfDownload}
                title="PDF 출력 옵션"
                confirmText="생성하기"
                size="small"
            >
                <div className="pdf-options-container">
                    <p className="options-description">PDF에 포함할 항목을 선택하세요.</p>
                    <div className="options-list">
                        <label className="option-item">
                            <input type="checkbox" checked={pageLogic.pdfOptions.includeProblems} onChange={() => pageLogic.onPdfOptionChange('includeProblems')} />
                            <span className="checkbox-label">문제</span>
                        </label>
                        <label className="option-item">
                            <input type="checkbox" checked={pageLogic.pdfOptions.includeAnswers} onChange={() => pageLogic.onPdfOptionChange('includeAnswers')} />
                            <span className="checkbox-label">빠른 정답</span>
                        </label>
                        <label className="option-item">
                            <input type="checkbox" checked={pageLogic.pdfOptions.includeSolutions} onChange={() => pageLogic.onPdfOptionChange('includeSolutions')} />
                            <span className="checkbox-label">정답 및 해설</span>
                        </label>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={pageLogic.isMobilePublishModalOpen}
                onClose={pageLogic.onCloseMobilePublishModal}
                onConfirm={pageLogic.onConfirmMobilePublish}
                isConfirming={pageLogic.isPublishing}
                title="모바일 시험지 출제 확인"
                confirmText="출제하기"
                confirmLoadingText="출제 중..."
                isConfirmDestructive={false}
                size="medium"
            >
                <div className="publish-confirm-container">
                    <p>
                        아래 <strong>{pageLogic.selectedStudentCount}</strong>명의 학생에게 <strong>{pageLogic.selectedProblemCount}</strong>개의 문제로 구성된 시험지를 출제합니다.
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