import React, { useState, useCallback, useEffect } from 'react';
import { useLayoutStore } from '../shared/store/layoutStore';
import { useProblemPublishing } from '../features/problem-publishing/model/useProblemPublishing';
import { useExamLayoutStore } from '../features/problem-publishing/model/examLayoutStore';
import { useExamLayoutManager } from '../features/problem-publishing/model/useExamLayoutManager';
import ProblemSelectionWidget from '../widgets/ProblemSelectionWidget';
import PublishingToolbarWidget from '../widgets/PublishingToolbarWidget';
import ExamPreviewWidget from '../widgets/ExamPreviewWidget';
import './ProblemPublishingPage.css';
import type { ProcessedProblem } from '../features/problem-publishing/model/problemPublishingStore';

const ProblemPublishingPage: React.FC = () => {
    const {
        allProblems, isLoadingProblems, selectedIds, isAllSelected,
        toggleRow, toggleSelectAll, handleSaveProblem,
        handleLiveProblemChange, 
        handleRevertProblem,
        startEditingProblem, setEditingProblemId, selectedProblems,
    } = useProblemPublishing();

    const {
        distributedPages, placementMap, distributedSolutionPages, solutionPlacementMap,
        setItemHeight,
        problemBoxMinHeight, baseFontSize, contentFontSizeEm, useSequentialNumbering,
        updateMinHeightAndRecalculate, setBaseFontSize, setContentFontSizeEm, setUseSequentialNumbering,
        forceRecalculateLayout,
    } = useExamLayoutStore();
    
    const [measuredHeights, setMeasuredHeights] = useState<Map<string, number>>(new Map());

    // setItemHeight는 이제 재계산까지 트리거하므로 이 콜백은 단순하게 유지됩니다.
    const handleHeightUpdate = useCallback((uniqueId: string, height: number) => {
        setItemHeight(uniqueId, height);
        setMeasuredHeights(prev => {
            // 화면에 표시되는 높이 값(디버깅용)만 업데이트
            if (prev.get(uniqueId) !== height) {
                const newMap = new Map(prev);
                newMap.set(uniqueId, height);
                return newMap;
            }
            return prev;
        });
    }, [setItemHeight]);

    const [headerInfo, setHeaderInfo] = useState({
        title: '2025학년도 3월 전국연합학력평가', titleFontSize: 1.64, titleFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        school: '제2교시', schoolFontSize: 1, schoolFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        subject: '수학 영역', subjectFontSize: 3, subjectFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        simplifiedSubjectText: '수학 영역', simplifiedSubjectFontSize: 1.6, simplifiedSubjectFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        simplifiedGradeText: '고3',
    });
    const handleHeaderUpdate = useCallback((targetId: string, _field: string, value: any) => {
        setHeaderInfo(prev => {
            const newState = { ...prev };
            switch (targetId) {
                case 'title': newState.title = value.text; newState.titleFontSize = value.fontSize; break;
                case 'school': newState.school = value.text; newState.schoolFontSize = value.fontSize; break;
                case 'subject': newState.subject = value.text; newState.subjectFontSize = value.fontSize; break;
                case 'simplifiedSubject': newState.simplifiedSubjectText = value.text; newState.simplifiedSubjectFontSize = value.fontSize; break;
                case 'simplifiedGrade': newState.simplifiedGradeText = value.text; break;
            }
            return newState;
        });
    }, []);
    
    useExamLayoutManager({ selectedProblems });
    
    // [수정] 로컬 상태와 useEffect를 사용한 디바운싱을 제거합니다.
    // 컨트롤 위젯이 직접 zustand 액션을 호출하도록 변경하여 로직을 단순화하고 중앙 집중화합니다.
    // 이제 PublishingToolbarWidget에서 직접 on...Change prop으로 전달된 zustand 액션을 호출합니다.
    
    const { setRightSidebarConfig, registerPageActions } = useLayoutStore.getState();

    const handleCloseEditor = useCallback(() => { 
        setEditingProblemId(null); 
        setRightSidebarConfig({ contentConfig: { type: null } }); 
        forceRecalculateLayout();
    }, [setEditingProblemId, setRightSidebarConfig, forceRecalculateLayout]);
    
    const handleOpenLatexHelpSidebar = useCallback(() => { setRightSidebarConfig({ contentConfig: { type: 'latexHelp' }, isExtraWide: false }); }, [setRightSidebarConfig]);
    
    const handleSaveAndClose = useCallback(async (problem: ProcessedProblem) => { 
        await handleSaveProblem(problem); 
        handleCloseEditor(); 
    }, [handleSaveProblem, handleCloseEditor]);
    
    const handleRevertAndKeepOpen = useCallback((problemId: string) => { handleRevertProblem(problemId); }, [handleRevertProblem]);
    
    const handleProblemClick = useCallback((problem: ProcessedProblem) => { 
        console.log(`[LOG] ProblemPublishingPage: ➡️ handleProblemClick 호출됨 (사이드바 열기)`, { uniqueId: problem.uniqueId });
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
    }, [startEditingProblem, setEditingProblemId, setRightSidebarConfig, handleLiveProblemChange, handleSaveAndClose, handleRevertAndKeepOpen, handleCloseEditor]);

    const handleDownloadPdf = useCallback(() => alert('PDF 다운로드 기능 구현 예정'), []);
    useEffect(() => { registerPageActions({ onClose: handleCloseEditor, openLatexHelpSidebar: handleOpenLatexHelpSidebar }); return () => { setRightSidebarConfig({ contentConfig: { type: null } }); registerPageActions({ onClose: undefined, openLatexHelpSidebar: undefined }); }; }, [registerPageActions, handleCloseEditor, setRightSidebarConfig, handleOpenLatexHelpSidebar]);

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
                    onToggleSequentialNumbering={() => setUseSequentialNumbering(!useSequentialNumbering)}
                    baseFontSize={baseFontSize}
                    onBaseFontSizeChange={setBaseFontSize}
                    contentFontSizeEm={contentFontSizeEm}
                    // [수정] 직접 zustand 액션을 전달
                    onContentFontSizeEmChange={setContentFontSizeEm} 
                    problemBoxMinHeight={problemBoxMinHeight}
                    // [수정] 직접 zustand 액션을 전달
                    onProblemBoxMinHeightChange={updateMinHeightAndRecalculate}
                    onDownloadPdf={handleDownloadPdf} 
                />
            </div>
            <div className="scrollable-content-area">
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
                    problemBoxMinHeight={problemBoxMinHeight}
                    onHeightUpdate={handleHeightUpdate}
                    onProblemClick={handleProblemClick} 
                    onHeaderUpdate={handleHeaderUpdate} 
                    onDeselectProblem={toggleRow} 
                    measuredHeights={measuredHeights}
                />
            </div>
        </div>
    );
};

export default ProblemPublishingPage;