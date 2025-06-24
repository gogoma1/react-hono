import React, { useMemo } from 'react';
import type { Problem } from '../entities/problem/model/types';
import GlassTable, { type TableColumn } from '../shared/ui/glasstable/GlassTable';
import TableCellCheckbox from '../shared/ui/TableCellCheckbox/TableCellCheckbox';
import './ProblemSelectionWidget.css';

type ProcessedProblem = Problem & { display_question_number: string; uniqueId: string; };

interface ProblemSelectionWidgetProps {
    problems: ProcessedProblem[];
    isLoading: boolean;
    selectedIds: Set<string>;
    onToggleRow: (id: string) => void;
    onToggleAll: () => void;
    isAllSelected: boolean;
}

const ProblemSelectionWidget: React.FC<ProblemSelectionWidgetProps> = ({
    problems,
    isLoading,
    selectedIds,
    onToggleRow,
    onToggleAll,
    isAllSelected
}) => {
    const columns = useMemo((): TableColumn<ProcessedProblem & { id: string }>[] => [
        {
            key: 'checkbox',
            header: <TableCellCheckbox isChecked={isAllSelected} onToggle={onToggleAll} disabled={problems.length === 0} ariaLabel="모든 문제 선택/해제" />,
            // [수정] isChecked와 onToggleRow 모두 uniqueId를 기준으로 동작하도록 변경
            render: (p) => <TableCellCheckbox isChecked={selectedIds.has(p.uniqueId)} onToggle={() => onToggleRow(p.uniqueId)} ariaLabel={`${p.display_question_number}번 문제 선택`} />,
            width: '50px',
        },
        { 
            key: 'question_number', 
            header: '번호', 
            isSortable: true, 
            width: '100px',
            render: (p) => p.display_question_number 
        },
        { key: 'source', header: '출처', isSortable: true, width: '150px' },
        // ... 나머지 컬럼 정의는 동일
        { key: 'grade', header: '학년', isSortable: true, width: '80px' },
        { key: 'semester', header: '학기', isSortable: true, width: '80px' },
        { key: 'major_chapter_id', header: '대단원', isSortable: true, width: '150px' },
        { key: 'middle_chapter_id', header: '중단원', isSortable: true, width: '150px' },
        { key: 'core_concept_id', header: '핵심개념', isSortable: true, width: '150px' },
        { key: 'problem_category', header: '유형', isSortable: true, width: '120px' },
        { key: 'difficulty', header: '난이도', isSortable: true, width: '80px' },
        { key: 'score', header: '배점', isSortable: true, width: '70px' },
        { key: 'page', header: '페이지', isSortable: true, width: '80px' },
        { key: 'problem_type', header: '객/주', isSortable: true, width: '80px' },
        { 
            key: 'question_text', 
            header: '문제', 
            render: (p) => <div style={{whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto'}}>{p.question_text}</div>
        },
        { 
            key: 'answer', 
            header: '정답', 
            width: '100px',
            render: (p) => <div style={{whiteSpace: 'pre-wrap'}}>{p.answer}</div>
        },
        { 
            key: 'solution_text', 
            header: '해설', 
            render: (p) => <div style={{whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto'}}>{p.solution_text}</div>
        },
    ], [isAllSelected, onToggleAll, problems, selectedIds, onToggleRow]);
    
    // [수정] React key로 사용될 id에 uniqueId를 할당합니다.
    const tableData = useMemo(() => 
        problems.map(p => ({
            ...p, 
            id: p.uniqueId 
        })), 
        [problems]
    );
    
    return (
        <div className="problem-selection-widget">
            <div className="selection-header">문제 선택</div>
            <div className="selection-table-container">
                <GlassTable<ProcessedProblem & { id: string }>
                    columns={columns}
                    data={tableData}
                    isLoading={isLoading}
                    emptyMessage="표시할 문제가 없습니다."
                />
            </div>
        </div>
    );
};

export default ProblemSelectionWidget;