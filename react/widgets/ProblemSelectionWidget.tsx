import React, { useMemo } from 'react';
import type { Problem } from '../entities/problem/model/types';
import GlassTable, { type TableColumn } from '../shared/ui/glasstable/GlassTable';
import TableCellCheckbox from '../shared/ui/TableCellCheckbox/TableCellCheckbox';
import ActionButton from '../shared/ui/actionbutton/ActionButton'; // [신규] ActionButton 임포트
import { LuTrash2 } from 'react-icons/lu'; // [신규] 휴지통 아이콘 임포트
import './ProblemSelectionWidget.css';

type ProcessedProblem = Problem & { display_question_number: string; uniqueId: string; };

interface ProblemSelectionWidgetProps {
    problems: ProcessedProblem[];
    isLoading: boolean;
    selectedIds: Set<string>;
    onToggleRow: (id: string) => void;
    onToggleAll: () => void;
    isAllSelected: boolean;
    onDeleteSelected: () => void; // [신규] 삭제 핸들러 prop 추가
}

const ProblemSelectionWidget: React.FC<ProblemSelectionWidgetProps> = ({
    problems,
    isLoading,
    selectedIds,
    onToggleRow,
    onToggleAll,
    isAllSelected,
    onDeleteSelected, // [신규] prop 받기
}) => {
    const columns = useMemo((): TableColumn<ProcessedProblem & { id: string }>[] => [
        {
            key: 'checkbox',
            header: <TableCellCheckbox isChecked={isAllSelected} onToggle={onToggleAll} disabled={problems.length === 0} ariaLabel="모든 문제 선택/해제" />,
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
    
    const tableData = useMemo(() => 
        problems.map(p => ({
            ...p, 
            id: p.uniqueId 
        })), 
        [problems]
    );
    
    return (
        <div className="problem-selection-widget">
            <div className="selection-header">
                <span className="selection-header-title">문제 선택 ({selectedIds.size} / {problems.length})</span>
                {/* [신규] 영구 삭제 버튼 */}
                <ActionButton
                    className="destructive"
                    onClick={onDeleteSelected}
                    disabled={selectedIds.size === 0 || isLoading}
                    aria-label="선택된 문제 영구 삭제"
                >
                    <LuTrash2 size={14} />
                    <span className="delete-button-text">선택 항목 삭제</span>
                </ActionButton>
            </div>
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