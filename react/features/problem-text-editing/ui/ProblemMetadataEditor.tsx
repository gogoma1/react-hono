import React, { useState, useCallback } from 'react';
import type { Problem, ComboboxOption } from '../../../entities/problem/model/types';
import GlassPopover from '../../../shared/components/GlassPopover';
import { PopoverCombobox } from '../../json-problem-importer/ui/EditPopoverContent';
import { LuChevronsUpDown } from 'react-icons/lu';

// 옵션 목록 정의
const GRADE_OPTIONS: ComboboxOption[] = ['초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'].map(g => ({ value: g, label: g }));
const SEMESTER_OPTIONS: ComboboxOption[] = ['1학기', '2학기', '공통'].map(s => ({ value: s, label: s }));
const DIFFICULTY_OPTIONS: ComboboxOption[] = ['최상', '상', '중', '하', '최하'].map(d => ({ value: d, label: d }));
const TYPE_OPTIONS: ComboboxOption[] = ['객관식', '주관식', '서답형', '논술형'].map(t => ({ value: t, label: t }));

// 필드와 옵션 매핑
const SELECT_OPTIONS_MAP: Record<string, ComboboxOption[]> = {
    grade: GRADE_OPTIONS,
    semester: SEMESTER_OPTIONS,
    difficulty: DIFFICULTY_OPTIONS,
    problem_type: TYPE_OPTIONS,
};

// 라벨 정의
const FIELD_LABELS: Record<string, string> = {
    question_number: "문제 번호",
    source: "출처",
    grade: "학년",
    semester: "학기",
    major_chapter_id: "대단원",
    middle_chapter_id: "중단원",
    core_concept_id: "핵심개념",
    problem_category: "문제 유형",
    difficulty: "난이도",
    score: "배점",
    answer: "정답",
    page: "페이지",
    problem_type: "객/주관식",
};

interface ProblemMetadataEditorProps {
    fields: (keyof Problem)[];
    problemData: Partial<Problem>;
    onDataChange: (field: keyof Problem, value: string | number) => void;
}

const ProblemMetadataEditor: React.FC<ProblemMetadataEditorProps> = ({
    fields,
    problemData,
    onDataChange,
}) => {
    // [핵심 추가] 팝오버 관리를 위한 상태
    const [popoverTargetField, setPopoverTargetField] = useState<keyof Problem | null>(null);
    const [popoverAnchorEl, setPopoverAnchorEl] = useState<HTMLElement | null>(null);

    const handleFieldClick = (e: React.MouseEvent<HTMLButtonElement>, field: keyof Problem) => {
        const options = SELECT_OPTIONS_MAP[field];
        if (options) {
            e.preventDefault();
            setPopoverTargetField(field);
            setPopoverAnchorEl(e.currentTarget);
        }
    };

    const handleValueChange = (field: keyof Problem, value: string | number) => {
        onDataChange(field, value);
    };

    const handlePopoverClose = () => {
        setPopoverTargetField(null);
        setPopoverAnchorEl(null);
    };
    
    // 팝오버 내부의 콤보박스에서 값을 선택했을 때 실행될 함수
    const handleComboboxSelect = (value: string) => {
        if (popoverTargetField) {
            onDataChange(popoverTargetField, value);
        }
        handlePopoverClose();
    };

    return (
        <div className="metadata-fields-section">
            <h5 className="editor-section-title">문제 정보</h5>
            {fields.map(field => {
                const options = SELECT_OPTIONS_MAP[field];
                const currentValue = problemData[field] ?? '';
                
                return (
                    <div key={field} className="metadata-field-group">
                        <label htmlFor={field} className="metadata-field-label">
                            {FIELD_LABELS[field] || field}
                        </label>
                        {options ? (
                            // [핵심 수정] 드롭다운 필드를 버튼으로 렌더링
                            <button
                                type="button"
                                id={field}
                                className="metadata-field-combobox-trigger"
                                onClick={(e) => handleFieldClick(e, field)}
                            >
                                <span>{String(currentValue) || '-- 선택 --'}</span>
                                <LuChevronsUpDown className="chevron-icon" />
                            </button>
                        ) : (
                            <input
                                id={field}
                                type={field === 'question_number' || field === 'page' ? 'number' : 'text'}
                                className="metadata-field-input"
                                value={currentValue}
                                onChange={(e) => handleValueChange(field, e.target.value)}
                            />
                        )}
                    </div>
                );
            })}

            {/* [핵심 추가] 콤보박스 팝오버 */}
            <GlassPopover
                isOpen={!!popoverTargetField}
                onClose={handlePopoverClose}
                anchorEl={popoverAnchorEl}
                placement="bottom-start"
            >
                {popoverTargetField && SELECT_OPTIONS_MAP[popoverTargetField] && (
                    <PopoverCombobox
                        label={FIELD_LABELS[popoverTargetField]}
                        value={String(problemData[popoverTargetField] ?? '')}
                        onValueChange={handleComboboxSelect}
                        options={SELECT_OPTIONS_MAP[popoverTargetField]}
                    />
                )}
            </GlassPopover>
        </div>
    );
};

export default ProblemMetadataEditor;