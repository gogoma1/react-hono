import React from 'react';
import { LuUpload, LuCheck, LuChevronsUpDown } from 'react-icons/lu';
import { useJsonProblemImporter } from '../../features/json-problem-importer/model/useJsonProblemImporter';
import ActionButton from '../../shared/ui/actionbutton/ActionButton';
import GlassPopover from '../../shared/components/GlassPopover';
import type { Column } from '../../entities/problem/model/types';
import { PopoverCombobox, PopoverInput, PopoverTextarea } from '../../features/json-problem-importer/ui/EditPopoverContent';

// [핵심 수정] 필드 타입을 정의합니다.
const COMBOBOX_FIELDS: (keyof any)[] = ['problem_type', 'difficulty', 'grade', 'semester'];
const ANSWER_COMBOBOX_FIELDS: (keyof any)[] = ['answer'];

const JsonProblemImporterWidget: React.FC = () => {
    const {
        jsonInput,
        setJsonInput,
        problems,
        parseError,
        editingCell,
        startEdit,
        cancelEdit,
        saveEdit,
        editingValue,
        setEditingValue,
        handleInputKeyDown,
        commonSource,
        setCommonSource,
        commonGradeLevel,
        setCommonGradeLevel,
        commonSemester,
        setCommonSemester,
        applyCommonData,
        uploadProblems,
        isUploading,
        columns,
        formatValue,
        popoverAnchor,
        problemTypeOptions, difficultyOptions, answerOptions, gradeOptions, semesterOptions // 옵션들 가져오기
    } = useJsonProblemImporter();

    const isEditing = !!editingCell;

    return (
        <div className="json-importer-widget">
            <div className="left-panel">{/* ... 이전과 동일 ... */}
                <div className="panel json-input-panel">
                    <div className="panel-header">JSON 데이터 입력</div>
                    <div className="panel-content">
                        <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="json-input-textarea" placeholder="여기에 JSON 데이터를 붙여넣으세요..." spellCheck="false" readOnly={isEditing} aria-label="JSON Input Area" />
                        {parseError && !isEditing && (
                            <div className="error-display" role="alert"><h4>JSON 처리/업로드 오류:</h4><pre>{parseError.message}</pre></div>
                        )}
                    </div>
                </div>
                <div className="panel common-data-panel">
                    <div className="panel-header">공통 정보 일괄 적용</div>
                    <div className="panel-content common-data-form">
                        <div className="form-group"><label htmlFor="commonSource">공통 출처</label><input id="commonSource" value={commonSource} onChange={e => setCommonSource(e.target.value)} placeholder="예: 2024 수능특강" /></div>
                        <div className="form-group"><label htmlFor="commonGradeLevel">공통 학년</label><input id="commonGradeLevel" value={commonGradeLevel} onChange={e => setCommonGradeLevel(e.target.value)} placeholder="예: 고3" /></div>
                        <div className="form-group"><label htmlFor="commonSemester">공통 학기</label><input id="commonSemester" value={commonSemester} onChange={e => setCommonSemester(e.target.value)} placeholder="예: 1학기" /></div>
                        <ActionButton onClick={applyCommonData} disabled={problems.length === 0} className="primary"><LuCheck style={{ marginRight: '4px' }}/>모든 문제에 적용</ActionButton>
                    </div>
                </div>
            </div>

            <div className="panel right-panel">{/* ... 이전과 동일 ... */}
                <div className="panel-header"><h2>표 미리보기 (클릭하여 수정)</h2><ActionButton onClick={uploadProblems} disabled={problems.length === 0 || parseError !== null || isUploading} className="primary"><LuUpload style={{ marginRight: '8px' }} />{isUploading ? "저장 중..." : "DB에 업로드"}</ActionButton></div>
                <div className="table-wrapper"><table className="problem-table">
                    <thead><tr>{columns.map(col => (<th key={col.key}>{col.label}{col.readonly && <span style={{fontSize: '0.7rem', marginLeft: '4px'}}>(읽기전용)</span>}</th>))}</tr></thead>
                    <tbody>{problems.length > 0 ? (problems.map((problem, i) => (<tr key={`${problem.question_number}-${i}`}>{columns.map(col => {
                        const currentValue = problem[col.key];
                        const isReadonly = col.readonly || Array.isArray(currentValue);
                        // [핵심 수정] 콤보박스인지 판단하는 로직 변경
                        const isCombobox = COMBOBOX_FIELDS.includes(col.key) || (ANSWER_COMBOBOX_FIELDS.includes(col.key) && problem.problem_type === '객관식');
                        return (<td key={col.key}><button type="button" id={`trigger-${i}-${col.key}`} className="cell-edit-trigger" onClick={(e) => startEdit(i, col.key, currentValue, e.currentTarget, isReadonly)} disabled={isReadonly} aria-label={`Edit ${col.label}`}><span className="cell-edit-trigger-content">{formatValue(currentValue)}</span>{isCombobox && !isReadonly && <LuChevronsUpDown className="chevron-icon" />}</button></td>);
                    })}</tr>))) : (<tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem' }}>{jsonInput.trim() === '' ? "왼쪽 텍스트 영역에 JSON 데이터를 붙여넣으세요." : parseError ? "JSON 데이터 로딩 중 오류가 발생했습니다. 왼쪽 영역의 오류 메시지를 확인하세요." : "유효한 'problems' 배열이 없거나 데이터가 비어있습니다."}</td></tr>)}</tbody>
                </table></div>
            </div>
            
            <GlassPopover isOpen={isEditing} onClose={cancelEdit} anchorEl={popoverAnchor} placement="bottom-start" className={editingCell && columns.find(c => c.key === editingCell.colKey)?.editType === 'textarea' ? 'large' : ''}>
                {editingCell && (() => {
                    const col = columns.find(c => c.key === editingCell.colKey) as Column;
                    // [핵심 수정] 렌더링할 콤보박스 타입을 더 명확하게 결정
                    const isAnswerCombobox = ANSWER_COMBOBOX_FIELDS.includes(col.key) && problems[editingCell.rowIndex]?.problem_type === '객관식';
                    const isNormalCombobox = COMBOBOX_FIELDS.includes(col.key);

                    // [핵심 수정] 필드에 맞는 옵션을 동적으로 선택
                    const options = 
                        col.key === 'problem_type' ? problemTypeOptions :
                        col.key === 'difficulty' ? difficultyOptions :
                        col.key === 'grade' ? gradeOptions :
                        col.key === 'semester' ? semesterOptions :
                        isAnswerCombobox ? answerOptions : [];

                    if (isNormalCombobox || isAnswerCombobox) {
                        return (<PopoverCombobox label={col.label} value={String(editingValue ?? '')} onValueChange={(val) => { setEditingValue(val); saveEdit(val); }} options={options} />)
                    }
                    if (col.editType === 'textarea'){
                        return (<PopoverTextarea label={col.label} value={String(editingValue ?? '')} onChange={(e) => setEditingValue(e.target.value)} onKeyDown={handleInputKeyDown} onSave={() => saveEdit()} onCancel={cancelEdit} />)
                    }
                    return (<PopoverInput label={col.label} value={String(editingValue ?? '')} type={col.editType === 'number' ? 'number' : 'text'} onChange={(e) => setEditingValue(e.target.value)} onKeyDown={handleInputKeyDown} onSave={() => saveEdit()} onCancel={cancelEdit} />)
                })()}
            </GlassPopover>
        </div>
    );
};

export default JsonProblemImporterWidget;