import React, { useMemo, ReactNode, useState, useCallback, useRef } from 'react';
import type { ProcessedProblem } from '../../features/problem-publishing/model/problemPublishingStore';
import Badge from '../../shared/ui/Badge/Badge';
import GlassPopover from '../../shared/components/GlassPopover';
import { PopoverCombobox } from '../../features/json-problem-importer/ui/EditPopoverContent';
import type { ComboboxOption } from '../../entities/problem/model/types';
import { PROBLEM_TYPES } from '../../entities/problem/model/types';
import { LuChevronsUpDown, LuRotateCcw } from 'react-icons/lu';
import Tippy from '@tippyjs/react';
import './FilteredProblemHeader.css';

interface FilteredProblemHeaderProps {
    problems: ProcessedProblem[];
    selectedCount: number;
    children?: ReactNode;
    startNumber: string;
    onStartNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    endNumber: string;
    onEndNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    problemTypeFilter: string;
    onProblemTypeFilterChange: (value: string) => void;
    onResetHeaderFilters: () => void;
}

const TYPE_FILTER_OPTIONS: ComboboxOption[] = [
    { value: 'all', label: '전체 유형' },
    ...PROBLEM_TYPES.map(type => ({ value: type, label: type })),
];

const FilteredProblemHeader: React.FC<FilteredProblemHeaderProps> = ({ 
    problems, 
    selectedCount, 
    children,
    startNumber,
    onStartNumberChange,
    endNumber,
    onEndNumberChange,
    problemTypeFilter,
    onProblemTypeFilterChange,
    onResetHeaderFilters,
}) => {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const filterTriggerRef = useRef<HTMLButtonElement | null>(null);

    const handleTriggerClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
        setIsPopoverOpen(true);
    };

    const handleClosePopover = useCallback(() => {
        setIsPopoverOpen(false);
        setAnchorEl(null);
        setTimeout(() => {
            filterTriggerRef.current?.focus();
        }, 0);
    }, []);

    const handleFilterSelect = useCallback((value: string) => {
        onProblemTypeFilterChange(value);
        handleClosePopover();
    }, [onProblemTypeFilterChange, handleClosePopover]);
    
    const currentFilterLabel = useMemo(() => {
        if (problemTypeFilter === 'all') {
            return '유형 선택';
        }
        return TYPE_FILTER_OPTIONS.find(opt => opt.value === problemTypeFilter)?.label || '유형 선택';
    }, [problemTypeFilter]);

    const summary = useMemo(() => {
        if (problems.length === 0) {
            return {
                subtitles: [],
                grades: [],
                semesters: [],
                minQuestionNumber: null,
                maxQuestionNumber: null,
            };
        }
        const subtitles = [...new Set(problems.map(p => p.subtitle).filter(Boolean))];
        const grades = [...new Set(problems.map(p => p.grade).filter(Boolean))];
        const semesters = [...new Set(problems.map(p => p.semester).filter(Boolean))];
        const questionNumbers = problems.map(p => p.question_number).filter(n => typeof n === 'number');
        const minQuestionNumber = questionNumbers.length > 0 ? Math.min(...questionNumbers) : null;
        const maxQuestionNumber = questionNumbers.length > 0 ? Math.max(...questionNumbers) : null;
        return { subtitles, grades, semesters, minQuestionNumber, maxQuestionNumber };
    }, [problems]);

    const renderSubtitleBadges = (subtitles: string[]) => {
        if (subtitles.length === 0) return null;
        if (subtitles.length <= 3) {
            return subtitles.map(subtitle => <Badge key={subtitle} className="summary-badge">{subtitle}</Badge>);
        }
        return <Badge className="summary-badge">{`${subtitles.length}개 출처`}</Badge>;
    };

    const renderGenericBadge = (label: string, values: string[]) => {
        if (values.length === 0) return null;
        const text = values.length === 1 ? values[0] : `${values.length}개 ${label}`;
        return <Badge className="summary-badge">{text}</Badge>;
    };

    return (
        <div className="filtered-problem-header">
            <div className="header-left-section">
                <div className="summary-info">
                    {renderSubtitleBadges(summary.subtitles)}
                    {renderGenericBadge('학년', summary.grades)}
                    {renderGenericBadge('학기', summary.semesters)}
                    {summary.minQuestionNumber !== null && (
                        <Badge className="summary-badge number-range">
                            {summary.minQuestionNumber}번 ~ {summary.maxQuestionNumber}번
                        </Badge>
                    )}
                </div>
                <div className="filter-controls">
                    <div className="filter-group problem-type-filter">
                        <button
                            ref={filterTriggerRef}
                            type="button"
                            className="filter-trigger-button filter-control-item"
                            onClick={handleTriggerClick}
                        >
                            <span className={`trigger-text ${problemTypeFilter === 'all' ? 'placeholder' : ''}`}>
                                {currentFilterLabel}
                            </span>
                            <LuChevronsUpDown className="trigger-icon" />
                        </button>
                    </div>
                    <div className="filter-group number-range-filter">
                        <input type="number" value={startNumber} onChange={onStartNumberChange} placeholder="시작" className="filter-input filter-control-item" aria-label="문제 시작 번호" />
                        <span className="range-separator">~</span>
                        <input type="number" value={endNumber} onChange={onEndNumberChange} placeholder="끝" className="filter-input filter-control-item" aria-label="문제 끝 번호" />
                         <span className="range-label">번</span>
                         <Tippy content="번호/유형 필터 초기화" theme="custom-glass" placement="top">
                            <button
                                type="button"
                                className="filter-reset-button"
                                onClick={onResetHeaderFilters}
                                aria-label="번호 및 유형 필터 초기화"
                            >
                                <LuRotateCcw size={14} />
                            </button>
                         </Tippy>
                    </div>
                </div>
            </div>

            <div className="header-right-section">
                <div className="selection-count">
                    {selectedCount}개 선택 / {problems.length}개 결과
                </div>
                {children && <div className="header-actions">{children}</div>}
            </div>

            <GlassPopover
                isOpen={isPopoverOpen}
                onClose={handleClosePopover}
                anchorEl={anchorEl}
                placement="bottom-start"
            >
                <PopoverCombobox
                    label="유형 필터"
                    value={problemTypeFilter}
                    onValueChange={handleFilterSelect}
                    options={TYPE_FILTER_OPTIONS}
                />
            </GlassPopover>
        </div>
    );
};

export default FilteredProblemHeader;