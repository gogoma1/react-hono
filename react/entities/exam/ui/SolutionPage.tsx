import React, { useMemo } from 'react';
// useShallow와 useProblemPublishingStore import 제거
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
    // [추가] 부모 문제 객체를 props로 직접 받습니다.
    parentProblem: ProcessedProblem;
}
const SolutionChunkItem: React.FC<SolutionChunkItemProps> = React.memo(({ item, allProblems, onRenderComplete, useSequentialNumbering, contentFontSizeEm, contentFontFamily, isFirstChunk, parentProblem }) => {
    
    // [핵심] store 구독 제거
    // const parentProblem = useProblemPublishingStore(...)

    const globalProblemIndex = useMemo(() => allProblems.findIndex(p => p.uniqueId === item.data.parentProblem.uniqueId) + 1, [allProblems, item.data.parentProblem.uniqueId]);
    
    const measureRef = useHeightMeasurer(onRenderComplete, item.uniqueId);
    
    // 이제 parentProblem이 null일 수 없으므로 관련 체크 제거
    if (!parentProblem) return null; // 안전 장치

    const displayNumber = useSequentialNumbering ? `${globalProblemIndex}` : parentProblem.display_question_number;
    
    return (
        <div ref={measureRef} className="solution-item-container" data-solution-id={item.uniqueId}>
            {isFirstChunk && (<div className="solution-header"><span className="solution-number">{displayNumber}.</span></div>)}
            <div className="solution-content-wrapper" style={{ fontSize: `${contentFontSizeEm}em`, fontFamily: contentFontFamily }}>
                <div className="mathpix-wrapper prose">
                    <MathpixRenderer text={item.data.text} />
                </div>
            </div>
        </div>
    );
});
SolutionChunkItem.displayName = 'SolutionChunkItem';


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
    headerInfo: any;
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

    // [추가] 최신 문제 데이터를 빠르게 찾기 위한 맵
    const latestProblemsMap = useMemo(() => new Map(allProblems.map(p => [p.uniqueId, p])), [allProblems]);

    const renderColumn = (columnItems: LayoutItem[]) => {
        return columnItems.map((item) => {
            if (item.type !== 'solutionChunk') return null;

            // [핵심] 최신 부모 문제 정보를 찾아서 props로 전달합니다.
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
        <div className="exam-page-component solution-page" style={{ fontSize: baseFontSize }}>
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