import { useState, useCallback } from 'react';
import { useExamLayoutStore } from '../model/examLayoutStore';

export function useExamPreviewManager() {
    // [핵심 수정] 스토어 전체를 구조분해하지 않고, 필요한 상태와 액션을 선택자(selector)로 각각 가져옵니다.
    const setItemHeight = useExamLayoutStore(state => state.setItemHeight);
    const baseFontSize = useExamLayoutStore(state => state.baseFontSize);
    const contentFontSizeEm = useExamLayoutStore(state => state.contentFontSizeEm);
    const useSequentialNumbering = useExamLayoutStore(state => state.useSequentialNumbering);
    const problemBoxMinHeight = useExamLayoutStore(state => state.problemBoxMinHeight);
    const setBaseFontSize = useExamLayoutStore(state => state.setBaseFontSize);
    const setContentFontSizeEm = useExamLayoutStore(state => state.setContentFontSizeEm);
    const setUseSequentialNumbering = useExamLayoutStore(state => state.setUseSequentialNumbering);
    const setProblemBoxMinHeight = useExamLayoutStore(state => state.setProblemBoxMinHeight);


    const [measuredHeights, setMeasuredHeights] = useState<Map<string, number>>(new Map());

    const handleHeightUpdate = useCallback((uniqueId: string, height: number) => {
        setItemHeight(uniqueId, height);
        setMeasuredHeights(prev => new Map(prev).set(uniqueId, height));
    }, [setItemHeight]);

    const handleToggleSequentialNumbering = useCallback(() => {
        setUseSequentialNumbering(!useSequentialNumbering);
    }, [useSequentialNumbering, setUseSequentialNumbering]);
    
    return {
        baseFontSize,
        contentFontSizeEm,
        useSequentialNumbering,
        problemBoxMinHeight,
        measuredHeights,

        onBaseFontSizeChange: setBaseFontSize,
        onContentFontSizeEmChange: setContentFontSizeEm,
        onToggleSequentialNumbering: handleToggleSequentialNumbering,
        setProblemBoxMinHeight,
        onHeightUpdate: handleHeightUpdate,
    };
}