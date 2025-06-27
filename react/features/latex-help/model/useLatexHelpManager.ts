import { useState, useEffect, useCallback } from 'react';
import { produce } from 'immer';

export interface LatexHelpItem {
    id: string;
    title: string;
    content: string;
}

const oldHelpData = [
    { category: '기본 문법', items: [ { syntax: '$...$', description: '인라인 수학 수식' }, { syntax: '$$...$$', description: '블록 수학 수식 (가운데 정렬)' }, { syntax: '\\\\', description: '줄바꿈' }, { syntax: '\\{ \\}', description: '중괄호 { } 표시' } ] },
    { category: '분수 및 지수/첨자', items: [ { syntax: '\\dfrac{a}{b}', description: '분수 (크게 표시)' }, { syntax: '\\frac{a}{b}', description: '분수 (작게 표시)' }, { syntax: 'x^{...}', description: '윗첨자 (지수)' }, { syntax: 'x_{...}', description: '아래첨자' } ] },
    { category: '기호 및 연산자', items: [ { syntax: '\\pm', description: '± 기호' }, { syntax: '\\times', description: '× 곱셈 기호' }, { syntax: '\\div', description: '÷ 나눗셈 기호' }, { syntax: '\\le', description: '≤ (작거나 같다)' }, { syntax: '\\ge', description: '≥ (크거나 같다)' }, { syntax: '\\neq', description: '≠ (같지 않다)' }, { syntax: '\\approx', description: '≈ (근사값)' } ] },
    { category: '루트, 합/곱, 극한, 적분', items: [ { syntax: '\\sqrt{...}', description: '제곱근' }, { syntax: '\\sqrt[n]{...}', description: 'n제곱근' }, { syntax: '\\sum_{i=1}^{n}', description: '합 (시그마)' }, { syntax: '\\prod_{i=1}^{n}', description: '곱 (프로덕트)' }, { syntax: '\\lim_{x \\to \\infty}', description: '극한' }, { syntax: '\\int_{a}^{b}', description: '적분' } ] },
    { category: '행렬 (matrix)', items: [ { syntax: '\\begin{matrix} a & b \\\\ c & d \\end{matrix}', description: '기본 행렬 (괄호 없음)' }, { syntax: '\\begin{pmatrix} ... \\end{pmatrix}', description: '괄호 () 행렬' }, { syntax: '\\begin{bmatrix} ... \\end{bmatrix}', description: '대괄호 [] 행렬' }, { syntax: '\\begin{vmatrix} ... \\end{vmatrix}', description: '수직선 | | 행렬' } ] }
];

const oldHelpContent = oldHelpData.map(section => {
    const itemsText = section.items.map(item => `\`${item.syntax}\`  -  ${item.description}`).join('\n');
    return `### ${section.category}\n\n${itemsText}`;
}).join('\n\n');


const defaultLatexHelpItems: LatexHelpItem[] = [
    {
        id: 'default-latex-1',
        title: '글상자',
        content: `\\begin{tabular}{|l|}\\hline
ㄱ. 이 부분에 글을 작성해 주세요.\\\\
ㄴ. 다음줄로 넘어가려면 백슬래쉬"\\\\"를 문장의 마지막에 두 번 입력하면 됩니다.\\\\
ㄷ. 더 필요한 기능을 요청해 주시면 만들겠습니다.\\\\
ㄹ. 문장이 끝나는 마지막 줄에도 백슬래쉬를 두 번 입력해주세요.\\\\
 \\hline
\\end{tabular}`
    },
    {
        id: 'default-latex-2',
        title: '<보기> 상자',
        content: `\\begin{tabular}{|c@{}c@{}c|}
\\multicolumn{1}{c}{} & \\multirow{2}{73px}{<보기>} & \\multicolumn{1}{} \\\\
\\cline{1-1}\\cline{3-3}
\\multicolumn{1}{|c}{} && \\multicolumn{1}{c|}{}\\\\
\\multicolumn{3}{|l|}{
    \\parbox{400px}{ 
    ㄱ. 상단에 화살표 보기가 있는 상자입니다. 이 텍스트가 400px 너비 안에서 자동으로 줄바꿈됩니다.\\\\
    ㄴ. 보기 상자에서는 enter를 이용해서 줄바꿈을 합니다.\\\\
    ㄷ. 더 필요한 기능을 요청해 주세요.
    }
} \\\\
\\hline
\\end{tabular}`
    },
    {
        id: 'default-latex-3',
        title: '기본 LaTeX 문법 모음',
        content: oldHelpContent,
    },
    // [추가된 항목]
    {
        id: 'default-latex-4',
        title: '수식 강조',
        content: `$$
\\int_0^1 x^2 dx = \\frac{1}{3}
$$`
    }
];

const STORAGE_KEY = 'latexHelpCollection';

export function useLatexHelpManager() {
    const [helpItems, setHelpItems] = useState<LatexHelpItem[]>([]);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [editingContent, setEditingContent] = useState('');
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

    useEffect(() => {
        let initialItems: LatexHelpItem[] = [];
        try {
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                initialItems = JSON.parse(storedData);
                // 기본 항목이 없는 경우 추가
                defaultLatexHelpItems.forEach(defaultItem => {
                    if (!initialItems.some((p: LatexHelpItem) => p.id === defaultItem.id)) {
                        initialItems.unshift(defaultItem);
                    }
                });
            } else {
                initialItems = [...defaultLatexHelpItems];
            }
        } catch (error) {
            console.error("Failed to load LaTeX help items from localStorage", error);
            initialItems = [...defaultLatexHelpItems];
        }
        
        setHelpItems(initialItems);
        setExpandedItemId(null);
    }, []);

    useEffect(() => {
        if (helpItems.length > 0) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(helpItems));
            } catch (error) {
                console.error("Failed to save LaTeX help items to localStorage", error);
            }
        } else {
             localStorage.removeItem(STORAGE_KEY);
        }
    }, [helpItems]);

    const addHelpItem = useCallback(() => {
        const newItem: LatexHelpItem = {
            id: `latex-help-${Date.now()}`,
            title: '새 도움말',
            content: '여기에 LaTeX 코드를 작성하세요.'
        };
        const nextItems = produce(helpItems, draft => {
            draft.push(newItem);
        });
        setHelpItems(nextItems);
        setEditingItemId(newItem.id);
        setEditingTitle(newItem.title);
        setEditingContent(newItem.content);
        setExpandedItemId(newItem.id);
    }, [helpItems]);

    const deleteHelpItem = useCallback((idToDelete: string) => {
        if (idToDelete.startsWith('default-')) {
            alert('기본 도움말은 삭제할 수 없습니다.');
            return;
        }
        if (window.confirm("정말로 이 도움말을 삭제하시겠습니까?")) {
            setHelpItems(prev => prev.filter(p => p.id !== idToDelete));
        }
    }, []);
    
    const resetDefaultHelpItem = useCallback((idToReset: string) => {
        const originalItem = defaultLatexHelpItems.find(p => p.id === idToReset);
        if (!originalItem || !window.confirm('이 도움말을 기본값으로 되돌리시겠습니까? 변경사항은 사라집니다.')) {
            return;
        }
        
        const nextItems = produce(helpItems, draft => {
            const itemToReset = draft.find(p => p.id === idToReset);
            if (itemToReset) {
                itemToReset.title = originalItem.title;
                itemToReset.content = originalItem.content;
            }
        });
        setHelpItems(nextItems);
    }, [helpItems]);
    
    const startEditing = useCallback((item: LatexHelpItem) => {
        setEditingItemId(item.id);
        setEditingTitle(item.title);
        setEditingContent(item.content);
        setExpandedItemId(item.id);
    }, []);

    const cancelEditing = useCallback(() => {
        setEditingItemId(null);
        setEditingTitle('');
        setEditingContent('');
    }, []);

    const saveEditing = useCallback(() => {
        if (!editingItemId) return;
        
        const nextItems = produce(helpItems, draft => {
            const itemToUpdate = draft.find(p => p.id === editingItemId);
            if (itemToUpdate) {
                itemToUpdate.title = editingTitle.trim() || '제목 없음';
                itemToUpdate.content = editingContent;
            }
        });
        setHelpItems(nextItems);
        cancelEditing();
    }, [editingItemId, editingTitle, editingContent, helpItems, cancelEditing]);

    const toggleExpand = useCallback((id: string) => {
        if (editingItemId && editingItemId !== id) return;
        setExpandedItemId(prevId => (prevId === id ? null : id));
    }, [editingItemId]);

    return {
        helpItems,
        editingItemId,
        editingTitle,
        setEditingTitle,
        editingContent,
        setEditingContent,
        expandedItemId,
        toggleExpand,
        addHelpItem,
        deleteHelpItem,
        resetDefaultHelpItem,
        startEditing,
        cancelEditing,
        saveEditing,
    };
}