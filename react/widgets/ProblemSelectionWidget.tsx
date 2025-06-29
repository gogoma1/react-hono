import React, { useMemo } from 'react';
import type { Problem } from '../entities/problem/model/types';
import GlassTable, { type TableColumn } from '../shared/ui/glasstable/GlassTable';
import TableCellCheckbox from '../shared/ui/TableCellCheckbox/TableCellCheckbox';
import FilteredProblemHeader from './FilteredProblemHeader/FilteredProblemHeader';
import { useUIStore } from '../shared/store/uiStore';
import { PROBLEM_PUBLISHING_COLUMN_CONFIG } from '../shared/hooks/useColumnPermissions';
import ActionButton from '../shared/ui/actionbutton/ActionButton';
import { LuTrash2 } from 'react-icons/lu';
import Modal from '../shared/ui/modal/Modal';
import Badge from '../shared/ui/Badge/Badge'; // [신규] Badge 컴포넌트 임포트
import './ProblemSelectionWidget.css';

type ProcessedProblem = Problem & { display_question_number: string; uniqueId: string; };

interface ProblemSelectionWidgetProps {
    problems: ProcessedProblem[];
    isLoading: boolean;
    selectedIds: Set<string>;
    onToggleRow: (id: string) => void;
    onToggleAll: () => void;
    isAllSelected: boolean;
    onDeleteSelected: () => void;
    isBulkDeleteModalOpen: boolean;
    onCloseBulkDeleteModal: () => void;
    onConfirmBulkDelete: () => void;
    isDeletingProblems: boolean;
    startNumber: string;
    onStartNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    endNumber: string;
    onEndNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    problemTypeFilter: string;
    onProblemTypeFilterChange: (value: string) => void;
    onResetHeaderFilters: () => void;
}

// [신규] 난이도 텍스트를 CSS 클래스로 매핑하는 객체
const difficultyClassMap: Record<string, string> = {
    '최상': 'difficulty-v-hard',
    '상': 'difficulty-hard',
    '중': 'difficulty-medium',
    '하': 'difficulty-easy',
    '최하': 'difficulty-v-easy',
};

const ProblemSelectionWidget: React.FC<ProblemSelectionWidgetProps> = ({
    problems,
    isLoading,
    selectedIds,
    onToggleRow,
    onToggleAll,
    isAllSelected,
    onDeleteSelected,
    isBulkDeleteModalOpen,
    onCloseBulkDeleteModal,
    onConfirmBulkDelete,
    isDeletingProblems,
    startNumber,
    onStartNumberChange,
    endNumber,
    onEndNumberChange,
    problemTypeFilter,
    onProblemTypeFilterChange,
    onResetHeaderFilters,
}) => {
    const { columnVisibility, problemPublishingColumnOrder } = useUIStore();

    const columns = useMemo((): TableColumn<ProcessedProblem & { id: string }>[] => {
        const baseColumns: TableColumn<ProcessedProblem & { id: string }>[] = [
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
        ];

        const columnConfigMap = new Map(
            PROBLEM_PUBLISHING_COLUMN_CONFIG.map(col => [col.key, col])
        );

        const dynamicColumns = problemPublishingColumnOrder
            .map((key): TableColumn<ProcessedProblem & { id: string }> | null => {
                const config = columnConfigMap.get(key);
                if (!config) return null;

                const isVisible = columnVisibility[key] ?? !config.defaultHidden;
                if (!isVisible) return null;

                // [수정] 난이도 컬럼에 대한 특별 렌더링 로직 추가
                if (config.key === 'difficulty') {
                    return {
                        key: config.key,
                        header: config.label,
                        isSortable: true,
                        render: (p: ProcessedProblem & { id: string }) => {
                            const difficulty = p.difficulty;
                            const badgeClass = difficultyClassMap[difficulty] || '';
                            return <Badge className={badgeClass}>{difficulty}</Badge>;
                        }
                    };
                }

                return {
                    key: config.key,
                    header: config.label,
                    isSortable: true,
                    render: (p: ProcessedProblem & { id: string }) => {
                        const value = p[config.key as keyof Problem];
                        if (config.key === 'question_text' || config.key === 'solution_text') {
                            return <div className="problem-cell-text problem-cell-text-scrollable">{String(value ?? '')}</div>
                        }
                        return <div className="problem-cell-text">{String(value ?? '')}</div>
                    }
                };
            })
            .filter((col): col is TableColumn<ProcessedProblem & { id: string }> => col !== null);

        return [...baseColumns, ...dynamicColumns];

    }, [isAllSelected, onToggleAll, problems.length, selectedIds, onToggleRow, columnVisibility, problemPublishingColumnOrder]);

    const tableData = useMemo(() =>
        problems.map(p => ({
            ...p,
            id: p.uniqueId
        })),
        [problems]
    );

    return (
        <div className="problem-selection-widget">
            <FilteredProblemHeader 
                problems={problems} 
                selectedCount={selectedIds.size}
                startNumber={startNumber}
                onStartNumberChange={onStartNumberChange}
                endNumber={endNumber}
                onEndNumberChange={onEndNumberChange}
                problemTypeFilter={problemTypeFilter}
                onProblemTypeFilterChange={onProblemTypeFilterChange}
                onResetHeaderFilters={onResetHeaderFilters}
            >
                <ActionButton
                    className="destructive"
                    onClick={onDeleteSelected}
                    disabled={selectedIds.size === 0 || isLoading}
                    aria-label="선택된 문제 영구 삭제"
                >
                    <LuTrash2 size={14} />
                    <span className="delete-button-text">선택 항목 삭제</span>
                </ActionButton>
            </FilteredProblemHeader>
            <div className="selection-table-container">
                <GlassTable<ProcessedProblem & { id: string }>
                    columns={columns}
                    data={tableData}
                    isLoading={isLoading}
                    emptyMessage="표시할 문제가 없습니다."
                />
            </div>
            <Modal
                isOpen={isBulkDeleteModalOpen}
                onClose={onCloseBulkDeleteModal}
                onConfirm={onConfirmBulkDelete}
                isConfirming={isDeletingProblems}
                title="선택한 문제 영구 삭제"
                confirmText={`삭제 (${selectedIds.size}개)`}
                size="small"
            >
                <p>
                    선택한 <strong>{selectedIds.size}개</strong>의 문제를 영구적으로 삭제하시겠습니까?
                    <br />
                    이 작업은 되돌릴 수 없습니다.
                </p>
            </Modal>
        </div>
    );
};

export default ProblemSelectionWidget;