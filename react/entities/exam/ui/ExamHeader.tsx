import React, { useState, useRef } from 'react';
import { LuPencil } from "react-icons/lu";
import GlassPopover from '../../../shared/components/GlassPopover';
import ExamHeaderEditPopover from '../../../features/exam-header-editing/ui/ExamHeaderEditPopover';

type EditableTarget = 'title' | 'school' | 'subject' | 'simplifiedGrade' | 'simplifiedSubject';

type ExamUpdateValue = {
    text: string;
    fontSize?: number;
    fontFamily?: string;
};

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
    totalPages?: number;
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
    onUpdate: (targetId: EditableTarget, field: string, value: ExamUpdateValue) => void;
}


const ExamHeader: React.FC<ExamHeaderProps> = (props) => {
    // [수정] prop을 initial... 변수로 재할당하지 않고 직접 사용하도록 변경
    const { 
        page, 
        title, titleFontSize, titleFontFamily,
        school, schoolFontSize, schoolFontFamily,
        subject, subjectFontSize, subjectFontFamily,
        additionalBoxContent, 
        simplifiedSubjectText, simplifiedSubjectFontSize, simplifiedSubjectFontFamily,
        simplifiedGradeText, 
        onUpdate
    } = props;
    
    const [editingTarget, setEditingTarget] = useState<EditableTarget | null>(null);
    const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);

    const [editingText, setEditingText] = useState('');
    const [editingFontSize, setEditingFontSize] = useState(1);
    
    const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const handleStartEdit = (e: React.MouseEvent<HTMLButtonElement>, target: EditableTarget) => {
        e.stopPropagation();
        if (editingTarget === target) return;
        if (editingTarget) handleCancelEdit();

        setEditingTarget(target);
        setPopoverAnchor(e.currentTarget);

        // [수정] initial... 변수 대신 직접 받은 prop 값을 사용
        switch (target) {
            case 'title': setEditingText(title); setEditingFontSize(titleFontSize); break;
            case 'school': setEditingText(school); setEditingFontSize(schoolFontSize); break;
            case 'subject': setEditingText(subject); setEditingFontSize(subjectFontSize); break;
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
        
        const value: ExamUpdateValue = { text: editingText };
        if (editingTarget !== 'simplifiedGrade') {
            value.fontSize = editingFontSize;
        }
        
        // [수정] initial... 변수 대신 직접 받은 prop 값을 사용
        if (editingTarget === 'title') value.fontFamily = titleFontFamily;
        if (editingTarget === 'school') value.fontFamily = schoolFontFamily;
        if (editingTarget === 'subject') value.fontFamily = subjectFontFamily;
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
    
    const setTriggerRef = (targetId: EditableTarget, el: HTMLButtonElement | null) => {
        triggerRefs.current[targetId] = el;
    };
    
    if (page > 1) {
        return (
            <>
                <div className="exam-header-simplified-container">
                    <div className={`simplified-item-wrapper order-${page % 2 !== 0 ? 1 : 3}`}>
                        <EditableArea 
                            targetId="simplifiedGrade" 
                            buttonClassName="simplified-grade-button"
                            onStartEdit={handleStartEdit}
                            setTriggerRef={setTriggerRef}
                            isEditing={editingTarget === 'simplifiedGrade'}
                            label={getTargetLabel('simplifiedGrade')}
                        >
                             <span className="simplified-grade-text">
                                {/* [수정] initial... 변수 대신 직접 받은 prop 값을 사용 */}
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
                           <span 
                                className="simplified-subject-text"
                                style={{
                                    // [수정] initial... 변수 대신 직접 받은 prop 값을 사용
                                    '--font-size-em': `${simplifiedSubjectFontSize}em`,
                                    '--font-family': simplifiedSubjectFontFamily,
                                } as React.CSSProperties}
                            >
                                {simplifiedSubjectText}
                            </span>
                        </EditableArea>
                    </div>
                    <div className={`simplified-item-wrapper order-${page % 2 !== 0 ? 3 : 1}`}>
                        <span className="simplified-page-number">{page}</span>
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
                        <span 
                            className="exam-header-title"
                            style={{
                                // [수정] initial... 변수 대신 직접 받은 prop 값을 사용
                                '--font-size-em': `${titleFontSize}em`,
                                '--font-family': titleFontFamily,
                            } as React.CSSProperties}
                        >
                            {title}
                        </span>
                    </EditableArea>
                    <div className="exam-header-page-number">{page}</div>
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
                        <span
                            className="exam-header-school-text"
                            style={{
                                // [수정] initial... 변수 대신 직접 받은 prop 값을 사용
                                '--font-size-em': `${schoolFontSize}em`,
                                '--font-family': schoolFontFamily,
                            } as React.CSSProperties}
                        >
                           {school}
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
                            <span 
                                className="exam-header-subject-text"
                                style={{
                                    // [수정] initial... 변수 대신 직접 받은 prop 값을 사용
                                    '--font-size-em': `${subjectFontSize}em`,
                                    '--font-family': subjectFontFamily,
                                } as React.CSSProperties}
                            >
                                {subject}
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