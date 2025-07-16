import React from 'react';
import { LuUpload, LuCheck, LuChevronsUpDown, LuInfo, LuLightbulb } from 'react-icons/lu';
import { useJsonProblemImporter } from '../../features/json-problem-importer/model/useJsonProblemImporter';
import ActionButton from '../../shared/ui/actionbutton/ActionButton';
import GlassPopover from '../../shared/components/GlassPopover';
import type { Problem, Column } from '../../entities/problem/model/types';
import { PopoverCombobox, PopoverInput, PopoverTextarea } from '../../features/json-problem-importer/ui/EditPopoverContent';
import LoadingButton from '../../shared/ui/loadingbutton/LoadingButton';
import type { LibrarySelection } from '../../pages/ProblemSetCreationPage';
import type { OnUploadPayload } from '../../features/json-problem-importer/model/useJsonProblemImporter';

const COMBOBOX_FIELDS: (keyof Problem)[] = ['problem_type', 'difficulty', 'grade', 'semester'];
const ANSWER_COMBOBOX_FIELDS: (keyof Problem)[] = ['answer'];

interface JsonProblemImporterWidgetProps {
    selectedItem: LibrarySelection | null;
    onUpload: (payload: OnUploadPayload) => void;
    isProcessing: boolean;
}

const JsonProblemImporterWidget: React.FC<JsonProblemImporterWidgetProps> = ({
    selectedItem,
    onUpload,
    isProcessing,
}) => {
    const isCreatingNew = selectedItem?.type === 'new';
    
    const {
        jsonInput, setJsonInput,
        problems, parseError,
        editingCell, startEdit, cancelEdit, saveEdit,
        editingValue, setEditingValue, handleInputKeyDown, popoverAnchor,
        problemSetBrand, setProblemSetBrand,
        problemSetDescription, setProblemSetDescription,
        commonSubtitle, setCommonSubtitle,
        commonGradeLevel, setCommonGradeLevel,
        commonSemester, setCommonSemester,
        applyCommonData,
        handleUpload,
        columns, formatValue,
        problemTypeOptions, difficultyOptions, answerOptions, gradeOptions, semesterOptions
    } = useJsonProblemImporter({ selectedItem, onUpload });

    const isEditing = !!editingCell;
    const uploadButtonText = isCreatingNew ? "문제집 생성 및 문제 업로드" : "선택한 소제목에 문제 추가";

    return (
        // [수정] 위젯의 최상위 div 구조를 변경합니다.
        <div className="json-importer-widget">
            {/* 1행: 공통 정보 입력 패널 */}
            <div className="panel common-data-panel">
                <div className="panel-header">공통 정보</div>
                <div className="panel-content common-data-form">
                    <div className="form-group">
                        <label htmlFor="problemSetBrand">
                            문제집 브랜드
                            {isCreatingNew && <span className="required-star">*</span>}
                        </label>
                        <input 
                            id="problemSetBrand" 
                            value={problemSetBrand} 
                            onChange={e => setProblemSetBrand(e.target.value)} 
                            placeholder="예: 쎈, 개념원리, 자체 브랜드"
                            disabled={!isCreatingNew}
                            required={isCreatingNew}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="problemSetDescription">문제집 설명 (선택)</label>
                        <textarea 
                            id="problemSetDescription" 
                            className="common-textarea"
                            value={problemSetDescription || ''} 
                            onChange={e => setProblemSetDescription(e.target.value)}
                            placeholder="예: 이 문제집은 고2 학생들의 내신 대비를 위한 고난도 문항으로 구성되어 있습니다."
                            rows={3}
                            disabled={!isCreatingNew}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="commonSubtitle">소제목 (교재명)</label>
                        <input 
                            id="commonSubtitle" 
                            value={commonSubtitle} 
                            onChange={e => setCommonSubtitle(e.target.value)} 
                            placeholder="예: 쎈 중등수학 2-2" 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="commonGradeLevel">학년</label>
                        <input 
                            id="commonGradeLevel" 
                            value={commonGradeLevel} 
                            onChange={e => setCommonGradeLevel(e.target.value)} 
                            placeholder="예: 고3, 중2" 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="commonSemester">학기/월</label>
                        <input 
                            id="commonSemester" 
                            value={commonSemester} 
                            onChange={e => setCommonSemester(e.target.value)} 
                            placeholder="예: 1학기, 3월" 
                        />
                    </div>
                    <ActionButton onClick={applyCommonData} disabled={problems.length === 0} className="primary"><LuCheck style={{ marginRight: '4px' }}/>모든 문제에 적용</ActionButton>
                </div>
            </div>

            {/* 2행: JSON 데이터 입력 패널 */}
            <div className="panel json-input-panel">
                <div className="panel-header">JSON 데이터 입력</div>
                <div className="panel-content">
                    <textarea 
                        value={jsonInput} 
                        onChange={(e) => setJsonInput(e.target.value)} 
                        className="json-input-textarea" 
                        placeholder="여기에 JSON 데이터를 붙여넣으세요..." 
                        spellCheck="false" 
                        readOnly={isEditing} 
                        aria-label="JSON Input Area" 
                        aria-invalid={!!parseError}
                    />
                    {parseError && !isEditing && (
                        <div className="error-display" role="alert">
                            <h4 className="error-title"><LuInfo size={16} /> {parseError.title}</h4>
                            <p className="error-location">
                                {parseError.line && parseError.column && `위치: ${parseError.line}번째 줄, ${parseError.column}번째 칸 부근`}
                                {parseError.problemIndex && `위치: ${parseError.problemIndex}번째 문제 항목`}
                            </p>
                            <pre className="error-message">{parseError.message}</pre>
                            <div className="error-suggestion">
                                <LuLightbulb size={16} />
                                <div>
                                    <h5>수정 제안</h5>
                                    <p>{parseError.suggestion}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 3행: 표 미리보기 패널 */}
            <div className="panel table-preview-panel">
                <div className="panel-header">
                    <h2>표 미리보기 (클릭하여 수정)</h2>
                    <LoadingButton
                        onClick={handleUpload}
                        disabled={problems.length === 0 || parseError !== null || (isCreatingNew && !problemSetBrand.trim()) || isProcessing}
                        isLoading={isProcessing}
                        loadingText="처리 중..."
                        className="primary"
                    >
                        <LuUpload style={{ marginRight: '8px' }} />
                        {uploadButtonText}
                    </LoadingButton>
                </div>
                <div className="table-wrapper">
                    <table className="problem-table">
                        <thead>
                            <tr>
                                {columns.map(col => (<th key={col.key}>{col.label}</th>))}
                            </tr>
                        </thead>
                        <tbody>
                            {problems.length > 0 ? (
                                problems.map((problem, i) => (
                                    <tr key={`${problem.problem_id}-${i}`}>
                                        {columns.map(col => {
                                            const currentValue = problem[col.key as keyof Problem];
                                            const isReadonly = col.readonly || Array.isArray(currentValue);
                                            const isCombobox = COMBOBOX_FIELDS.includes(col.key) || (ANSWER_COMBOBOX_FIELDS.includes(col.key) && problem.problem_type === '객관식');
                                            return (
                                                <td key={col.key}>
                                                    <button type="button" id={`trigger-${i}-${col.key}`} className="cell-edit-trigger" onClick={(e) => startEdit(i, col.key as keyof Problem, currentValue, e.currentTarget, isReadonly)} disabled={isReadonly} aria-label={`Edit ${col.label}`}>
                                                        <span className="cell-edit-trigger-content">{formatValue(currentValue)}</span>
                                                        {isCombobox && !isReadonly && <LuChevronsUpDown className="chevron-icon" />}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem' }}>
                                        {jsonInput.trim() === '' ? "왼쪽 텍스트 영역에 JSON 데이터를 붙여넣으세요." : parseError ? "JSON 데이터에 오류가 있습니다." : "유효한 'problems' 배열이 없거나 데이터가 비어있습니다."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <GlassPopover isOpen={isEditing} onClose={cancelEdit} anchorEl={popoverAnchor} placement="bottom-start" className={editingCell && columns.find(c => c.key === editingCell.colKey)?.editType === 'textarea' ? 'large' : ''}>
                {editingCell && (() => {
                    const col = columns.find(c => c.key === editingCell.colKey) as Column;
                    const isAnswerCombobox = ANSWER_COMBOBOX_FIELDS.includes(col.key) && problems[editingCell.rowIndex]?.problem_type === '객관식';
                    const isNormalCombobox = COMBOBOX_FIELDS.includes(col.key);
                    const options = col.key === 'problem_type' ? problemTypeOptions : col.key === 'difficulty' ? difficultyOptions : col.key === 'grade' ? gradeOptions : col.key === 'semester' ? semesterOptions : isAnswerCombobox ? answerOptions : [];
                    if (isNormalCombobox || isAnswerCombobox) {
                        return (<PopoverCombobox label={col.label} value={String(editingValue ?? '')} onValueChange={(val) => { saveEdit(val); }} options={options} />)
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