// ./react/features/problem-publishing/hooks/useExamPreviewManager.ts
import { useState, useCallback } from 'react';
import { useExamLayoutStore } from '../model/examLayoutStore';

export function useExamPreviewManager() {
    const {
        setItemHeight,
        baseFontSize,
        contentFontSizeEm,
        useSequentialNumbering,
        setBaseFontSize,
        setContentFontSizeEm,
        setUseSequentialNumbering,
    } = useExamLayoutStore();

    const [problemBoxMinHeight, setProblemBoxMinHeight] = useState(31);
    const [measuredHeights, setMeasuredHeights] = useState<Map<string, number>>(new Map());

    const handleHeightUpdate = useCallback((uniqueId: string, height: number) => {
        setItemHeight(uniqueId, height);
        setMeasuredHeights(prev => new Map(prev).set(uniqueId, height));
    }, [setItemHeight]);
    
    return {
        // State
        baseFontSize,
        contentFontSizeEm,
        useSequentialNumbering,
        problemBoxMinHeight,
        measuredHeights,

        // Actions
        onBaseFontSizeChange: setBaseFontSize,
        onContentFontSizeEmChange: setContentFontSizeEm,
        onToggleSequentialNumbering: () => setUseSequentialNumbering(!useSequentialNumbering),
        setProblemBoxMinHeight,
        onHeightUpdate: handleHeightUpdate,
    };
}