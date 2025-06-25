import React, { useMemo, useCallback, forwardRef } from 'react';
import type { Problem } from '../../problem/model/types';
import MathpixRenderer from '../../../shared/ui/MathpixRenderer';
import ExamHeader from './ExamHeader';
import type { LayoutItem } from '../../../features/problem-publishing/model/useProblemPublishing';
import './ExamPage.css';

type ProcessedProblem = Problem & { uniqueId: string; display_question_number: string; };

interface SolutionChunkItemProps {
    item: Extract<LayoutItem, { type: 'solutionChunk' }>;
    allProblems: ProcessedProblem[];
    onRenderComplete: (uniqueId: string) => void;
    useSequentialNumbering: boolean;
    contentFontSizeEm: number;
    contentFontFamily: string;
    isFirstChunk: boolean;
}

const SolutionChunkItem = forwardRef<HTMLDivElement, SolutionChunkItemProps>(({ item, allProblems, onRenderComplete, useSequentialNumbering, contentFontSizeEm, contentFontFamily, isFirstChunk }, ref) => {
    const parentProblem = item.data.parentProblem;
    
    const globalProblemIndex = useMemo(() => 
        allProblems.findIndex(p => p.uniqueId === parentProblem.uniqueId) + 1,
        [allProblems, parentProblem]
    );

    const displayNumber = useSequentialNumbering 
        ? `${globalProblemIndex}` 
        : parentProblem.display_question_number;

    return (
        <div ref={ref} className="solution-item-container" data-solution-id={item.uniqueId}>
            {/* [수정] 해당 문제의 첫 번째 해설 조각일 때만 문제 번호 표시 */}
            {isFirstChunk && (
                <div className="solution-header">
                    <span className="solution-number">{displayNumber}.</span>
                </div>
            )}
            <div className="solution-content-wrapper" style={{ fontSize: `${contentFontSizeEm}em`, fontFamily: contentFontFamily }}>
                <div className="mathpix-wrapper prose">
                    <MathpixRenderer text={item.data.text} onRenderComplete={() => onRenderComplete(item.uniqueId)} />
                </div>
            </div>
        </div>
    );
});
SolutionChunkItem.displayName = 'SolutionChunkItem';

interface SolutionPageProps {
    pageNumber: number;
    totalPages: number;
    items: LayoutItem[]; // [수정] props 타입을 LayoutItem 배열로 변경
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
        pageNumber, totalPages, items, allProblems, placementMap,
        onHeightUpdate, useSequentialNumbering,
        baseFontSize, contentFontSizeEm, contentFontFamily,
        headerInfo,
        onHeaderUpdate,
    } = props;

    const leftColumnItems = useMemo(() => 
        items.filter(item => placementMap.get(item.uniqueId)?.column === 1),
        [items, placementMap]
    );

    const rightColumnItems = useMemo(() => 
        items.filter(item => placementMap.get(item.uniqueId)?.column === 2),
        [items, placementMap]
    );
    
    const registerElement = useCallback((uniqueId: string, node: HTMLDivElement | null) => {
        if (node) {
            requestAnimationFrame(() => {
                const styles = window.getComputedStyle(node);
                const marginBottom = parseFloat(styles.marginBottom);
                const totalHeight = node.offsetHeight + (isNaN(marginBottom) ? 0 : marginBottom);
                onHeightUpdate(uniqueId, totalHeight);
            });
        }
    }, [onHeightUpdate]);

    const handleRenderComplete = useCallback((uniqueId: string) => {
        const node = document.querySelector(`[data-solution-id="${uniqueId}"]`) as HTMLDivElement | null;
        if(node) registerElement(uniqueId, node);
    }, [registerElement]);
    
    const renderColumn = (columnItems: LayoutItem[]) => {
        return columnItems.map((item) => {
            if (item.type !== 'solutionChunk') return null;

            // [수정] 이 조각이 해당 문제의 첫 번째 조각인지 확인
            const isFirstChunk = !item.uniqueId.endsWith('-sol-0');
            
            return (
                <SolutionChunkItem
                    key={item.uniqueId}
                    ref={(node) => registerElement(item.uniqueId, node)}
                    item={item}
                    allProblems={allProblems}
                    onRenderComplete={handleRenderComplete}
                    useSequentialNumbering={useSequentialNumbering}
                    contentFontSizeEm={contentFontSizeEm}
                    contentFontFamily={contentFontFamily}
                    isFirstChunk={!item.uniqueId.includes('-sol-') || item.uniqueId.endsWith('-sol-0')}
                />
            );
        });
    };
    
    const solutionHeaderInfo = {
        ...headerInfo,
        title: "정답 및 해설",
        subject: headerInfo.subject + " (해설)",
    };

    return (
        <div className="exam-page-component solution-page" style={{ fontSize: baseFontSize }}>
            <div className="exam-paper">
                <ExamHeader 
                    page={pageNumber}
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