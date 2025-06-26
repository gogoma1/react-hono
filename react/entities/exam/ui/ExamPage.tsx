import React, { useMemo } from 'react';
// useShallow와 useProblemPublishingStore import 제거
import type { Problem } from '../../problem/model/types';
import MathpixRenderer from '../../../shared/ui/MathpixRenderer';
import ExamHeader from './ExamHeader';
import './ExamPage.css';
import { LuCircleX } from "react-icons/lu";
import { useHeightMeasurer } from '../../../features/problem-publishing/hooks/useHeightMeasurer';

type ProcessedProblem = Problem & { uniqueId: string; display_question_number: string; };

interface ProblemItemProps {
    problem: ProcessedProblem; // uniqueId 대신 problem 객체 전체를 받음
    allProblems: ProcessedProblem[];
    onRenderComplete: (uniqueId: string, height: number) => void;
    useSequentialNumbering: boolean;
    problemBoxMinHeight: number;
    contentFontSizeEm: number;
    contentFontFamily: string;
    onProblemClick: (problem: ProcessedProblem) => void;
    onDeselectProblem: (uniqueId: string) => void;
    measuredHeight?: number; 
}
const ProblemItem: React.FC<ProblemItemProps> = React.memo(({ problem, allProblems, onRenderComplete, useSequentialNumbering, problemBoxMinHeight, contentFontSizeEm, contentFontFamily, onProblemClick, onDeselectProblem, measuredHeight }) => {
    
    // [핵심] 렌더링 로그 위치 변경
    // console.log(`[LOG] ProblemItem: 🎨 렌더링 시작. 문제 ID: ${problem.uniqueId}`);

    // [핵심] store 구독 제거
    // const problem = useProblemPublishingStore(...)

    const globalProblemIndex = useMemo(() => allProblems.findIndex(p => p.uniqueId === problem.uniqueId) + 1, [allProblems, problem.uniqueId]);
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onProblemClick(problem); } };
    
    const measureRef = useHeightMeasurer(onRenderComplete, problem.uniqueId);

    // 이제 problem이 null일 수 없으므로 관련 체크 제거
    if (!problem) return null; // 안전 장치로 남겨둘 수는 있음

    return (
        <div ref={measureRef} className="problem-container" data-unique-id={problem.uniqueId}>
             <div role="button" tabIndex={0} onKeyDown={handleKeyDown} className="text-trigger" onClick={() => onProblemClick(problem)} aria-label={`${problem.display_question_number}번 문제 수정`}>
                <div className="problem-header">
                    <div className="header-inner">
                        <span className="problem-number">{useSequentialNumbering ? `${globalProblemIndex}.` : `${problem.display_question_number}.`}</span>
                        <span className="global-index">({globalProblemIndex})</span>
                        {problem.score && <span className="problem-score">[{problem.score}]</span>}
                        {measuredHeight && <span className="measured-height">({measuredHeight.toFixed(0)}px)</span>}
                    </div>
                    <button type="button" className="problem-deselect-button" aria-label="문제 선택 해제" onClick={(e) => { e.stopPropagation(); onDeselectProblem(problem.uniqueId); }}>
                        <LuCircleX size={18} />
                    </button>
                </div>
                <div className="problem-content-wrapper" style={{ fontSize: `${contentFontSizeEm}em`, fontFamily: contentFontFamily, minHeight: `${problemBoxMinHeight}em` }}>
                    <div className="mathpix-wrapper prose">
                        <MathpixRenderer text={problem.question_text ?? ''} />
                    </div>
                </div>
             </div>
        </div>
    );
});
ProblemItem.displayName = 'ProblemItem';


interface ExamPageProps {
    pageNumber: number;
    totalPages: number;
    problems: ProcessedProblem[];
    allProblems: ProcessedProblem[];
    placementMap: Map<string, { page: number; column: number }>;
    onHeightUpdate: (uniqueId: string, height: number) => void;
    onProblemClick: (problem: ProcessedProblem) => void;
    useSequentialNumbering: boolean;
    baseFontSize: string;
    contentFontSizeEm: number;
    contentFontFamily: string;
    problemBoxMinHeight: number;
    headerInfo: any;
    onHeaderUpdate: (targetId: string, field: string, value: any) => void;
    onDeselectProblem: (uniqueId: string) => void;
    measuredHeights: Map<string, number>; 
}

const ExamPage: React.FC<ExamPageProps> = (props) => {
    const {
        pageNumber, totalPages, problems, allProblems, placementMap, onHeightUpdate,
        useSequentialNumbering, baseFontSize, contentFontSizeEm, contentFontFamily,
        problemBoxMinHeight, headerInfo, onHeaderUpdate, onProblemClick, onDeselectProblem,
        measuredHeights, 
    } = props;
    
    // [로그 삭제]
    // console.log(`[LOG] ExamPage: 🎨 렌더링 시작. 페이지 번호: ${pageNumber}`);
    
    const leftColumnProblems = useMemo(() => 
        problems.filter(p => placementMap.get(p.uniqueId)?.column === 1),
        [problems, placementMap]
    );

    const rightColumnProblems = useMemo(() => 
        problems.filter(p => placementMap.get(p.uniqueId)?.column === 2),
        [problems, placementMap]
    );
    
    const renderColumn = (problemList: ProcessedProblem[]) => {
        return problemList.map((problem) => (
            <ProblemItem
                key={problem.uniqueId}
                problem={problem} // [핵심] problem 객체 직접 전달
                allProblems={allProblems}
                onRenderComplete={onHeightUpdate}
                useSequentialNumbering={useSequentialNumbering}
                problemBoxMinHeight={problemBoxMinHeight}
                contentFontSizeEm={contentFontSizeEm}
                contentFontFamily={contentFontFamily}
                onProblemClick={onProblemClick}
                onDeselectProblem={onDeselectProblem}
                measuredHeight={measuredHeights.get(problem.uniqueId)} 
            />
        ));
    };

    return (
        <div className="exam-page-component" style={{ fontSize: baseFontSize }}>
            <div className="exam-paper">
                <ExamHeader 
                    page={pageNumber}
                    totalPages={totalPages}
                    additionalBoxContent={problems[0]?.source ?? '정보 없음'}
                    {...headerInfo}
                    onUpdate={onHeaderUpdate}
                />
                <div className="exam-columns-container">
                    <div className="exam-column">{renderColumn(leftColumnProblems)}</div>
                    <div className="exam-column">{renderColumn(rightColumnProblems)}</div>
                    <div className="column-divider"></div>
                </div>
                <div className="page-footer">
                    <div className="page-counter-box">{pageNumber} / {totalPages}</div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ExamPage);