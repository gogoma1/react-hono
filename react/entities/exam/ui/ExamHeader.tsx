import React, { useState, useRef } from 'react';
import { LuPencil } from "react-icons/lu";
import GlassPopover from '../../../shared/components/GlassPopover';
import ExamHeaderEditPopover from '../../../features/exam-header-editing/ui/ExamHeaderEditPopover';

// [수정 1] EditableTarget 타입을 컴포넌트 밖으로 이동시켜 재사용 가능하게 합니다.
type EditableTarget = 'title' | 'school' | 'subject' | 'simplifiedGrade' | 'simplifiedSubject';

// [수정 2] EditableArea 컴포넌트의 props 타입을 정의합니다.
interface EditableAreaProps {
    targetId: EditableTarget;
    children: React.ReactNode;
    wrapperClassName?: string;
    buttonClassName?: string;
    onStartEdit: (e: React.MouseEvent<HTMLButtonElement>, target: EditableTarget) => void;
    setTriggerRef: (targetId: EditableTarget, el: HTMLButtonElement | null) => void;
    isEditing: boolean;
    label: string;
}

// [수정 3] EditableArea 컴포넌트를 ExamHeader 바깥의 독립된 컴포넌트로 분리합니다.
// 이렇게 하면 ExamHeader가 리렌더링 되어도 EditableArea는 재생성되지 않아 ref가 안정적으로 유지됩니다.
const EditableArea: React.FC<EditableAreaProps> = ({
    targetId,
    children,
    wrapperClassName,
    buttonClassName,
    onStartEdit,
    setTriggerRef,
    isEditing,
    label
}) => (
    <div className={`editable-wrapper-group ${wrapperClassName || ''}`}>
        <button
            ref={el => setTriggerRef(targetId, el)}
            className={`editable-trigger-button ${buttonClassName || ''}`}
            onClick={(e) => onStartEdit(e, targetId)}
            aria-label={`${label} 수정`}
        >
            {children}
            {!isEditing && (
                <span className="edit-icon-overlay">
                    <LuPencil className="edit-icon-svg"/>
                </span>
            )}
        </button>
    </div>
);


interface ExamHeaderProps {
    page: number;
    title: string;
    titleFontSize: number;
    titleFontFamily: string;
    school: string;
    schoolFontSize: number;
    schoolFontFamily: string;
    subject: string;
    subjectFontSize: number;
    subjectFontFamily: string;
    additionalBoxContent: string;
    simplifiedSubjectText: string;
    simplifiedSubjectFontSize: number;
    simplifiedSubjectFontFamily: string;
    simplifiedGradeText: string;
    onUpdate: (targetId: string, field: string, value: any) => void;
}


const ExamHeader: React.FC<ExamHeaderProps> = (props) => {
    const { 
        page, 
        title: initialTitle, titleFontSize: initialTitleFontSize, titleFontFamily: initialTitleFontFamily,
        school: initialSchool, schoolFontSize: initialSchoolFontSize, schoolFontFamily: initialSchoolFontFamily,
        subject: initialSubject, subjectFontSize: initialSubjectFontSize, subjectFontFamily: initialSubjectFontFamily,
        additionalBoxContent, 
        simplifiedSubjectText, simplifiedSubjectFontSize, simplifiedSubjectFontFamily,
        simplifiedGradeText, 
        onUpdate
    } = props;
    
    const [editingTarget, setEditingTarget] = useState<EditableTarget | null>(null);
    const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);

    const [editingText, setEditingText] = useState('');
    const [editingFontSize, setEditingFontSize] = useState(1);
    
    const notoSerifKR = "'Noto Serif KR', serif";
    const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const handleStartEdit = (e: React.MouseEvent<HTMLButtonElement>, target: EditableTarget) => {
        e.stopPropagation();
        if (editingTarget === target) return;
        if (editingTarget) handleCancelEdit();

        setEditingTarget(target);
        setPopoverAnchor(e.currentTarget);

        switch (target) {
            case 'title': setEditingText(initialTitle); setEditingFontSize(initialTitleFontSize); break;
            case 'school': setEditingText(initialSchool); setEditingFontSize(initialSchoolFontSize); break;
            case 'subject': setEditingText(initialSubject); setEditingFontSize(initialSubjectFontSize); break;
            case 'simplifiedGrade': setEditingText(simplifiedGradeText); break;
            case 'simplifiedSubject': setEditingText(simplifiedSubjectText); setEditingFontSize(simplifiedSubjectFontSize); break;
        }
    };
    
    const handleCancelEdit = () => {
        const lastTargetButton = editingTarget ? triggerRefs.current[editingTarget] : null;
        setEditingTarget(null);
        setPopoverAnchor(null);
        setTimeout(() => lastTargetButton?.focus(), 0);
    };

    const handleSaveEdit = () => {
        if (!editingTarget) return;
        
        let value: any = { text: editingText };
        if (editingTarget !== 'simplifiedGrade') {
            value.fontSize = editingFontSize;
        }
        
        if (editingTarget === 'title') value.fontFamily = initialTitleFontFamily;
        if (editingTarget === 'school') value.fontFamily = initialSchoolFontFamily;
        if (editingTarget === 'subject') value.fontFamily = initialSubjectFontFamily;
        if (editingTarget === 'simplifiedSubject') value.fontFamily = simplifiedSubjectFontFamily;

        onUpdate(editingTarget, editingTarget, value);
        handleCancelEdit();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { e.preventDefault(); handleSaveEdit(); }
        else if (e.key === 'Escape') { e.preventDefault(); handleCancelEdit(); }
    };

    const getTargetLabel = (target: EditableTarget) => ({
        title: '제목', school: '교시', subject: '과목',
        simplifiedGrade: '학년', simplifiedSubject: '과목(2p+)',
    }[target]);
    
    // [수정 4] 독립된 EditableArea 컴포넌트에 props를 전달하기 위한 콜백 함수
    const setTriggerRef = (targetId: EditableTarget, el: HTMLButtonElement | null) => {
        triggerRefs.current[targetId] = el;
    };
    
    if (page > 1) {
        return (
            <>
                <div className="exam-header-simplified-container">
                    <div className={`simplified-item-wrapper order-${page % 2 !== 0 ? 1 : 3}`}>
                        {/* [수정 5] 분리된 EditableArea 컴포넌트를 props와 함께 사용합니다. */}
                        <EditableArea 
                            targetId="simplifiedGrade" 
                            buttonClassName="simplified-grade-button"
                            onStartEdit={handleStartEdit}
                            setTriggerRef={setTriggerRef}
                            isEditing={editingTarget === 'simplifiedGrade'}
                            label={getTargetLabel('simplifiedGrade')}
                        >
                             <span className="simplified-grade-text">
                                {simplifiedGradeText}
                            </span>
                        </EditableArea>
                    </div>
                    <div className="simplified-subject-wrapper order-2">
                         <EditableArea 
                            targetId="simplifiedSubject" 
                            buttonClassName="simplified-subject-button"
                            onStartEdit={handleStartEdit}
                            setTriggerRef={setTriggerRef}
                            isEditing={editingTarget === 'simplifiedSubject'}
                            label={getTargetLabel('simplifiedSubject')}
                        >
                           <span style={{ fontSize: `${simplifiedSubjectFontSize}em`, fontFamily: simplifiedSubjectFontFamily }}>
                                {simplifiedSubjectText}
                            </span>
                        </EditableArea>
                    </div>
                    <div className={`simplified-item-wrapper order-${page % 2 !== 0 ? 3 : 1}`}>
                        <span className="simplified-page-number" style={{ fontFamily: notoSerifKR }}>{page}</span>
                    </div>
                </div>
                <GlassPopover isOpen={!!editingTarget} onClose={handleCancelEdit} anchorEl={popoverAnchor} placement="bottom-start">
                    {editingTarget && (
                        <ExamHeaderEditPopover
                            targetLabel={getTargetLabel(editingTarget)}
                            textValue={editingText}
                            onTextChange={(e) => setEditingText(e.target.value)}
                            fontSizeValue={editingTarget !== 'simplifiedGrade' ? editingFontSize : undefined}
                            onFontSizeChange={editingTarget !== 'simplifiedGrade' ? (e) => setEditingFontSize(parseFloat(e.target.value)) : undefined}
                            onSave={handleSaveEdit}
                            onCancel={handleCancelEdit}
                            onKeyDown={handleKeyDown}
                        />
                    )}
                </GlassPopover>
            </>
        );
    }

    return (
        <>
            <div className="exam-header-container">
                <div className="exam-header-title-section">
                     <EditableArea 
                        targetId="title" 
                        wrapperClassName="exam-header-title-wrapper" 
                        buttonClassName="exam-header-title-button"
                        onStartEdit={handleStartEdit}
                        setTriggerRef={setTriggerRef}
                        isEditing={editingTarget === 'title'}
                        label={getTargetLabel('title')}
                     >
                        <span style={{ fontSize: `${initialTitleFontSize}em`, fontFamily: initialTitleFontFamily }}>
                            {initialTitle}
                        </span>
                    </EditableArea>
                    <div className="exam-header-page-number" style={{ fontFamily: notoSerifKR }}>{page}</div>
                </div>
                <div className="exam-header-info-section">
                    <EditableArea 
                        targetId="school" 
                        wrapperClassName="exam-header-school-wrapper" 
                        buttonClassName="exam-header-school-button"
                        onStartEdit={handleStartEdit}
                        setTriggerRef={setTriggerRef}
                        isEditing={editingTarget === 'school'}
                        label={getTargetLabel('school')}
                    >
                        <span style={{ fontSize: `${initialSchoolFontSize}em`, fontFamily: initialSchoolFontFamily }}>
                           {initialSchool}
                        </span>
                    </EditableArea>
                    <div className="exam-header-subject-wrapper">
                         <EditableArea 
                            targetId="subject" 
                            wrapperClassName="exam-header-subject-wrapper-inner" 
                            buttonClassName="exam-header-subject-button"
                            onStartEdit={handleStartEdit}
                            setTriggerRef={setTriggerRef}
                            isEditing={editingTarget === 'subject'}
                            label={getTargetLabel('subject')}
                        >
                             <span style={{ fontSize: `${initialSubjectFontSize}em`, fontFamily: initialSubjectFontFamily }}>
                                {initialSubject}
                            </span>
                        </EditableArea>
                        <div className="exam-header-additional-box">{additionalBoxContent}</div>
                    </div>
                </div>
                <div className="exam-header-divider-container">
                    <div className="exam-header-divider"></div>
                </div>
            </div>
            <GlassPopover isOpen={!!editingTarget} onClose={handleCancelEdit} anchorEl={popoverAnchor} placement="bottom-start">
                 {editingTarget && (
                    <ExamHeaderEditPopover
                        targetLabel={getTargetLabel(editingTarget)}
                        textValue={editingText}
                        onTextChange={(e) => setEditingText(e.target.value)}
                        fontSizeValue={editingTarget !== 'simplifiedGrade' ? editingFontSize : undefined}
                        onFontSizeChange={editingTarget !== 'simplifiedGrade' ? (e) => setEditingFontSize(parseFloat(e.target.value)) : undefined}
                        onSave={handleSaveEdit}
                        onCancel={handleCancelEdit}
                        onKeyDown={handleKeyDown}
                    />
                )}
            </GlassPopover>
        </>
    );
};

export default ExamHeader;