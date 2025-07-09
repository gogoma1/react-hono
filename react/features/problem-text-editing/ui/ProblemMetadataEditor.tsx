// ----- ./react/features/problem-text-editing/ui/ProblemMetadataEditor.tsx -----

import React, { useState } from 'react';
// [수정] PROBLEM_TYPES를 import 합니다.
import type { Problem, ComboboxOption } from '../../../entities/problem/model/types';
import { PROBLEM_TYPES } from '../../../entities/problem/model/types';
import GlassPopover from '../../../shared/components/GlassPopover';
import { PopoverCombobox } from '../../json-problem-importer/ui/EditPopoverContent';
import { LuChevronsUpDown } from 'react-icons/lu';

const GRADE_OPTIONS: ComboboxOption[] = ['초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'].map(g => ({ value: g, label: g }));
const SEMESTER_OPTIONS: ComboboxOption[] = ['1학기', '2학기', '공통'].map(s => ({ value: s, label: s }));
const DIFFICULTY_OPTIONS: ComboboxOption[] = ['최상', '상', '중', '하', '최하'].map(d => ({ value: d, label: d }));

/**
 * [핵심 수정] 하드코딩된 배열 대신, entities에서 import한 PROBLEM_TYPES를 사용하여 옵션을 동적으로 생성합니다.
 */
const TYPE_OPTIONS: ComboboxOption[] = PROBLEM_TYPES.map(t => ({ value: t, label: t }));

const ANSWER_OPTIONS: ComboboxOption[] = ['①', '②', '③', '④', '⑤', '⑥', 'O', 'X'].map(a => ({ value: a, label: a })); // [추가] OX 정답 옵션 추가

const SELECT_OPTIONS_MAP: Record<string, ComboboxOption[]> = {
    grade: GRADE_OPTIONS,
    semester: SEMESTER_OPTIONS,
    difficulty: DIFFICULTY_OPTIONS,
    problem_type: TYPE_OPTIONS,
    answer: ANSWER_OPTIONS,
};

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
    const [popoverTargetField, setPopoverTargetField] = useState<keyof Problem | null>(null);
    const [popoverAnchorEl, setPopoverAnchorEl] = useState<HTMLElement | null>(null);

    const handleFieldClick = (e: React.MouseEvent<HTMLButtonElement>, field: keyof Problem) => {
        /**
         * [수정] 'OX' 문제 유형일 때도 정답 선택 콤보박스를 활성화합니다.
         */
        const isAnswerCombobox = field === 'answer' && (problemData.problem_type === '객관식' || problemData.problem_type === 'OX');
        const options = SELECT_OPTIONS_MAP[field];

        if (options && (field !== 'answer' || isAnswerCombobox)) {
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
                /**
                 * [수정] 'OX' 유형일 때도 정답 필드가 콤보박스로 렌더링되도록 조건을 수정합니다.
                 */
                const isAnswerCombobox = field === 'answer' && (problemData.problem_type === '객관식' || problemData.problem_type === 'OX');
                const isOtherCombobox = field !== 'answer' && SELECT_OPTIONS_MAP[field];
                
                const shouldRenderAsCombobox = isAnswerCombobox || isOtherCombobox;
                
                const currentValue = problemData[field] ?? '';
                
                return (
                    <div key={field} className="metadata-field-group">
                        <label htmlFor={field} className="metadata-field-label">
                            {FIELD_LABELS[field] || field}
                        </label>
                        {shouldRenderAsCombobox ? (
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
                                value={String(currentValue)}
                                onChange={(e) => handleValueChange(field, e.target.value)}
                            />
                        )}
                    </div>
                );
            })}

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
                        /**
                         * [수정] OX 문제일 경우 O, X 옵션만 보여주도록 필터링합니다.
                         */
                        options={
                            popoverTargetField === 'answer' && problemData.problem_type === 'OX'
                                ? ANSWER_OPTIONS.filter(opt => opt.value === 'O' || opt.value === 'X')
                                : SELECT_OPTIONS_MAP[popoverTargetField]
                        }
                    />
                )}
            </GlassPopover>
        </div>
    );
};

export default ProblemMetadataEditor;