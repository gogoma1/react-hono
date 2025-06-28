import React, { useMemo } from 'react';
import type { Problem } from '../../problem/model/types';
import MathpixRenderer from '../../../shared/ui/MathpixRenderer';
import ExamHeader from './ExamHeader';
import type { LayoutItem } from '../../../features/problem-publishing/model/useProblemPublishing';
import './ExamPage.css';
import { useHeightMeasurer } from '../../../features/problem-publishing/hooks/useHeightMeasurer';

type ProcessedProblem = Problem & { uniqueId: string; display_question_number: string; };
interface SolutionChunkItemProps {
    item: Extract<LayoutItem, { type: 'solutionChunk' }>;
    allProblems: ProcessedProblem[];
    onRenderComplete: (uniqueId: string, height: number) => void;
    useSequentialNumbering: boolean;
    contentFontSizeEm: number;
    contentFontFamily: string;
    isFirstChunk: boolean;
    parentProblem: ProcessedProblem;
}
const SolutionChunkItem: React.FC<SolutionChunkItemProps> = React.memo(({ item, allProblems, onRenderComplete, useSequentialNumbering, contentFontSizeEm, contentFontFamily, isFirstChunk, parentProblem }) => {
    
    const globalProblemIndex = useMemo(() => allProblems.findIndex(p => p.uniqueId === item.data.parentProblem.uniqueId) + 1, [allProblems, item.data.parentProblem.uniqueId]);
    
    const measureRef = useHeightMeasurer(onRenderComplete, item.uniqueId);
    
    if (!parentProblem) return null; // 안전 장치

    const displayNumber = useSequentialNumbering ? `${globalProblemIndex}` : parentProblem.display_question_number;
    
    return (
        <div ref={measureRef} className="solution-item-container" data-solution-id={item.uniqueId}>
            {isFirstChunk && (<div className="solution-header"><span className="solution-number">{displayNumber}.</span></div>)}
            <div 
                className="solution-content-wrapper" 
                style={{ 
                    '--content-font-size-em': `${contentFontSizeEm}em`, 
                    '--content-font-family': contentFontFamily 
                } as React.CSSProperties}
            >
                <div className="mathpix-wrapper prose">
                    <MathpixRenderer text={item.data.text} />
                </div>
            </div>
        </div>
    );
});
SolutionChunkItem.displayName = 'SolutionChunkItem';

// [수정] ExamHeader의 필수 Props를 포함하는 타입 정의
type ExamHeaderInfo = Pick<React.ComponentProps<typeof ExamHeader>, 
    | 'title' 
    | 'titleFontSize' 
    | 'titleFontFamily' 
    | 'school' 
    | 'schoolFontSize' 
    | 'schoolFontFamily' 
    | 'subject' 
    | 'subjectFontSize' 
    | 'subjectFontFamily' 
    | 'simplifiedSubjectText'
    | 'simplifiedSubjectFontSize'
    | 'simplifiedSubjectFontFamily'
    | 'simplifiedGradeText'
>;


interface SolutionPageProps {
    pageNumber: number;
    totalPages: number;
    items: LayoutItem[];
    allProblems: ProcessedProblem[];
    placementMap: Map<string, { page: number; column: number }>;
    onHeightUpdate: (uniqueId: string, height: number) => void;
    useSequentialNumbering: boolean;
    baseFontSize: string;
    contentFontSizeEm: number;
    contentFontFamily: string;
    headerInfo: ExamHeaderInfo; // [수정] any -> ExamHeaderInfo
    onHeaderUpdate: (targetId: string, field: string, value: any) => void;
}

const SolutionPage: React.FC<SolutionPageProps> = (props) => {
    const {
        pageNumber, totalPages, items, allProblems, placementMap, onHeightUpdate,
        useSequentialNumbering, baseFontSize, contentFontSizeEm, contentFontFamily,
        headerInfo, onHeaderUpdate,
    } = props;
    
    const leftColumnItems = useMemo(() => items.filter(item => placementMap.get(item.uniqueId)?.column === 1), [items, placementMap]);
    const rightColumnItems = useMemo(() => items.filter(item => placementMap.get(item.uniqueId)?.column === 2), [items, placementMap]);

    const latestProblemsMap = useMemo(() => new Map(allProblems.map(p => [p.uniqueId, p])), [allProblems]);

    const renderColumn = (columnItems: LayoutItem[]) => {
        return columnItems.map((item) => {
            if (item.type !== 'solutionChunk') return null;

            const parentProblem = latestProblemsMap.get(item.data.parentProblem.uniqueId);
            if (!parentProblem) return null; // 부모 문제가 없으면 렌더링하지 않음

            return (
                <SolutionChunkItem
                    key={item.uniqueId}
                    item={item} 
                    allProblems={allProblems}
                    onRenderComplete={onHeightUpdate}
                    useSequentialNumbering={useSequentialNumbering}
                    contentFontSizeEm={contentFontSizeEm}
                    contentFontFamily={contentFontFamily}
                    isFirstChunk={!item.uniqueId.includes('-sol-') || item.uniqueId.endsWith('-sol-0')}
                    parentProblem={parentProblem} // 찾은 최신 문제 객체를 prop으로 전달
                />
            );
        });
    };
    
    const solutionHeaderInfo = { ...headerInfo, title: "정답 및 해설", subject: headerInfo.subject + " (해설)" };

    return (
        <div 
            className="exam-page-component solution-page" 
            style={{ '--base-font-size': baseFontSize } as React.CSSProperties}
        >
            <div className="exam-paper">
                <ExamHeader 
                    page={pageNumber}
                    totalPages={totalPages}
                    additionalBoxContent={allProblems[0]?.source ?? '정보 없음'}
                    {...solutionHeaderInfo}
                    onUpdate={onHeaderUpdate}
                />
                <div className="exam-columns-container">
                    <div className="exam-column">{renderColumn(leftColumnItems)}</div>
                    <div className="exam-column">{renderColumn(rightColumnItems)}</div>
                    <div className="column-divider"></div>
                </div>
                <div className="page-footer">
                    <div className="page-counter-box">{pageNumber} / {totalPages}</div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(SolutionPage);