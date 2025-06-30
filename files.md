----- ./react/App.tsx -----
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import RootLayout from './widgets/rootlayout/RootLayout';
import ProtectedRoute from './shared/lib/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import DashBoard from './pages/DashBoard';
import StudentDetailPage from './pages/StudentDetailPage';
import AuthInitializer from './shared/lib/AuthInitializer';
import { useAuthStore, selectIsLoadingAuth } from './shared/store/authStore';
import ProblemWorkbenchPage from './pages/ProblemWorkbenchPage';
import JsonRendererPage from './pages/JsonRendererPage';
import ProblemPublishingPage from './pages/ProblemPublishingPage'; 
import './App.css'; // [추가]

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5분 동안 캐시 유지

    },
  },
});

function App() {
    const isLoadingAuth = useAuthStore(selectIsLoadingAuth);

    return (
        <QueryClientProvider client={queryClient}>
            <AuthInitializer />
            {isLoadingAuth ? (
                <div className="app-loading-container">
                    <h1>애플리케이션 로딩 중...</h1>
                </div>
            ) : (
                <Router>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route element={<ProtectedRoute />}>
                            <Route path="/profilesetup" element={<ProfileSetupPage />} />
                        </Route>
                        <Route element={<ProtectedRoute />}>
                            <Route element={<RootLayout />}>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/dashboard" element={<DashBoard />} />
                                <Route path="/problem-workbench" element={<ProblemWorkbenchPage />} />
                                <Route path="/problem-publishing" element={<ProblemPublishingPage />} />
                                <Route path="/json-renderer" element={<JsonRendererPage />} /> 
                                <Route path="/student/:id" element={<StudentDetailPage />} />
                            </Route>
                        </Route>
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            )}
        </QueryClientProvider>
    );
}

export default App;
----- ./react/entities/exam/ui/ExamHeader.tsx -----
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
    source: string;
}


const ExamHeader: React.FC<ExamHeaderProps> = (props) => {
    const { 
        page, 
        title, titleFontSize, titleFontFamily,
        school, schoolFontSize, schoolFontFamily,
        subject, subjectFontSize, subjectFontFamily,
        additionalBoxContent, 
        simplifiedSubjectText, simplifiedSubjectFontSize, simplifiedSubjectFontFamily,
        simplifiedGradeText, 
        onUpdate,
        source
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

    const displayTitle = `${source}`;
    
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
                                '--font-size-em': `${titleFontSize}em`,
                                '--font-family': titleFontFamily,
                            } as React.CSSProperties}
                        >
                            {/* [핵심 수정] 조합된 제목을 화면에 표시합니다. */}
                            {displayTitle}
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
----- ./react/entities/exam/ui/ExamPage.tsx -----
import React, { useMemo } from 'react';
import type { Problem } from '../../problem/model/types';
import MathpixRenderer from '../../../shared/ui/MathpixRenderer';
import ExamHeader from './ExamHeader';
import './ExamPage.css';
import { LuCircleX } from "react-icons/lu";
import { useHeightMeasurer } from '../../../features/problem-publishing/hooks/useHeightMeasurer';

type ProcessedProblem = Problem & { uniqueId: string; display_question_number: string; };

interface ProblemItemProps {
    problem: ProcessedProblem;
    allProblems: ProcessedProblem[];
    onRenderComplete: (uniqueId: string, height: number) => void;
    useSequentialNumbering: boolean;
    contentFontSizeEm: number;
    contentFontFamily: string;
    onProblemClick: (problem: ProcessedProblem) => void;
    onDeselectProblem: (uniqueId: string) => void;
    measuredHeight?: number; 
}

const ProblemItem: React.FC<ProblemItemProps> = React.memo(({ problem, allProblems, onRenderComplete, useSequentialNumbering, contentFontSizeEm, contentFontFamily, onProblemClick, onDeselectProblem, measuredHeight }) => {
    
    const globalProblemIndex = useMemo(() => allProblems.findIndex(p => p.uniqueId === problem.uniqueId) + 1, [allProblems, problem.uniqueId]);
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onProblemClick(problem); } };
    
    const measureRef = useHeightMeasurer(onRenderComplete, problem.uniqueId);

    if (!problem) return null;

    return (
        <div ref={measureRef} className="problem-container" data-unique-id={problem.uniqueId}>
             <div role="button" tabIndex={0} onKeyDown={handleKeyDown} className="text-trigger" onClick={() => onProblemClick(problem)} aria-label={`${problem.display_question_number}번 문제 수정`}>
                <div className="problem-header">
                    <div className="header-inner">
                        <span className="problem-number">{useSequentialNumbering ? `${globalProblemIndex}.` : `${problem.display_question_number}.`}</span>
                        <span className="global-index">({globalProblemIndex})</span>
                        {problem.score && <span className="problem-score">[{problem.score}]</span>}
                        {measuredHeight && <span className="measured-height">({measuredHeight.toFixed(0)}px)</span>}
                    </div>
                    <button type="button" className="problem-deselect-button" aria-label="문제 선택 해제" onClick={(e) => { e.stopPropagation(); onDeselectProblem(problem.uniqueId); }}>
                        <LuCircleX size={18} />
                    </button>
                </div>
                <div 
                    className="problem-content-wrapper" 
                    style={{ 
                        '--content-font-size-em': `${contentFontSizeEm}em`, 
                        '--content-font-family': contentFontFamily 
                    } as React.CSSProperties}
                >
                    <div className="mathpix-wrapper prose">
                        <MathpixRenderer text={problem.question_text ?? ''} />
                    </div>
                </div>
             </div>
        </div>
    );
});
ProblemItem.displayName = 'ProblemItem';

type ExamHeaderInfo = Pick<React.ComponentProps<typeof ExamHeader>, 
    | 'title' 
    | 'titleFontSize' 
    | 'titleFontFamily' 
    | 'school' 
    | 'schoolFontSize' 
    | 'schoolFontFamily' 
    | 'subject' 
    | 'subjectFontSize' 
    | 'subjectFontFamily' 
    | 'simplifiedSubjectText'
    | 'simplifiedSubjectFontSize'
    | 'simplifiedSubjectFontFamily'
    | 'simplifiedGradeText'
    | 'source'
>;

interface ExamPageProps {
    pageNumber: number;
    totalPages: number;
    problems: ProcessedProblem[];
    allProblems: ProcessedProblem[];
    placementMap: Map<string, { page: number; column: number }>;
    onHeightUpdate: (uniqueId: string, height: number) => void;
    onProblemClick: (problem: ProcessedProblem) => void;
    useSequentialNumbering: boolean;
    baseFontSize: string;
    contentFontSizeEm: number;
    contentFontFamily: string;
    headerInfo: ExamHeaderInfo;
    onHeaderUpdate: (targetId: string, field: string, value: any) => void;
    onDeselectProblem: (uniqueId: string) => void;
    measuredHeights: Map<string, number>; 
}

const ExamPage: React.FC<ExamPageProps> = (props) => {
    const {
        pageNumber, totalPages, problems, allProblems, placementMap, onHeightUpdate,
        useSequentialNumbering, baseFontSize, contentFontSizeEm, contentFontFamily,
        headerInfo, onHeaderUpdate, onProblemClick, onDeselectProblem,
        measuredHeights, 
    } = props;
    
    
    const leftColumnProblems = useMemo(() => 
        problems.filter((p: ProcessedProblem) => placementMap.get(p.uniqueId)?.column === 1),
        [problems, placementMap]
    );

    const rightColumnProblems = useMemo(() => 
        problems.filter((p: ProcessedProblem) => placementMap.get(p.uniqueId)?.column === 2),
        [problems, placementMap]
    );
    
    const renderColumn = (problemList: ProcessedProblem[]) => {
        return problemList.map((problem) => (
            <ProblemItem
                key={problem.uniqueId}
                problem={problem}
                allProblems={allProblems}
                onRenderComplete={onHeightUpdate}
                useSequentialNumbering={useSequentialNumbering}
                contentFontSizeEm={contentFontSizeEm}
                contentFontFamily={contentFontFamily}
                onProblemClick={onProblemClick}
                onDeselectProblem={onDeselectProblem}
                measuredHeight={measuredHeights.get(problem.uniqueId)} 
            />
        ));
    };
    
    return (
        <div 
            className="exam-page-component problem-page-type" 
            style={{ '--base-font-size': baseFontSize } as React.CSSProperties}
        >
            <div className="exam-paper">
                <ExamHeader 
                    page={pageNumber}
                    totalPages={totalPages}
                    additionalBoxContent="이름"
                    {...headerInfo}
                    onUpdate={onHeaderUpdate}
                />
                <div className="exam-columns-container">
                    <div className="exam-column">{renderColumn(leftColumnProblems)}</div>
                    <div className="exam-column">{renderColumn(rightColumnProblems)}</div>
                    <div className="column-divider"></div>
                </div>
                <div className="page-footer">
                    <div className="page-counter-box">{pageNumber} / {totalPages}</div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ExamPage);
----- ./react/entities/exam/ui/QuickAnswerPage.tsx -----
import React from 'react';
import type { Problem } from '../../problem/model/types';
import MathpixRenderer from '../../../shared/ui/MathpixRenderer'; // [추가] MathpixRenderer 임포트
import './ExamPage.css';

type ProcessedProblem = Problem & { uniqueId: string; display_question_number: string; };
interface HeaderInfo {
    title: string;
    titleFontFamily?: string;
    [key: string]: any;
}

interface QuickAnswerPageProps {
    pageNumber: number;
    totalPages: number;
    problems: ProcessedProblem[];
    headerInfo: HeaderInfo;
    baseFontSize: string;
    useSequentialNumbering: boolean;
    allProblems: ProcessedProblem[];
}

const QuickAnswerPage: React.FC<QuickAnswerPageProps> = ({
    pageNumber,
    totalPages,
    problems,
    headerInfo,
    baseFontSize,
    useSequentialNumbering,
    allProblems
}) => {
    const QuickAnswerHeader: React.FC<{ title: string; page: number }> = ({ title, page }) => (
        <div className="quick-answer-header">
            <h1 
                className="quick-answer-title" 
                style={{ '--title-font-family': headerInfo.titleFontFamily } as React.CSSProperties}
            >
                {title}
            </h1>
            <div className="exam-header-page-number quick-answer-page-number">{page}</div>
        </div>
    );
    
    const getProblemNumber = (problem: ProcessedProblem) => {
        if (useSequentialNumbering) {
            const globalIndex = allProblems.findIndex(p => p.uniqueId === problem.uniqueId);
            return (globalIndex + 1).toString(); // 순차 번호일 경우 숫자 반환
        }
        return problem.display_question_number; // 원본 번호일 경우 "서답형" 포함된 문자열 반환
    };

    const middleIndex = Math.ceil(problems.length / 2);
    const leftColumnProblems = problems.slice(0, middleIndex);
    const rightColumnProblems = problems.slice(middleIndex);

    const renderColumn = (columnProblems: ProcessedProblem[]) => (
        <div className="quick-answer-column">
            {columnProblems.map((problem) => (
                <div key={problem.uniqueId} className="quick-answer-item">
                    <span className="quick-answer-number">{getProblemNumber(problem)})</span>
                    {/* --- [핵심 수정] --- */}
                    {/* 기존의 span 태그를 MathpixRenderer를 사용하는 div로 교체합니다. */}
                    {/* 이렇게 하면 객관식(예: '①')과 서술형(예: '$x=2$') 정답 모두 올바르게 표시됩니다. */}
                    <div className="quick-answer-value">
                        <MathpixRenderer text={problem.answer ?? ''} />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div 
            className="exam-page-component answer-page-type" 
            style={{ '--base-font-size': baseFontSize } as React.CSSProperties}
        >
            <div className="exam-paper">
                <QuickAnswerHeader title="빠른 정답" page={pageNumber} />
                <div className="quick-answer-columns-container">
                    {renderColumn(leftColumnProblems)}
                    {renderColumn(rightColumnProblems)}
                    <div className="column-divider"></div>
                </div>
                <div className="page-footer">
                    <div className="page-counter-box">{pageNumber} / {totalPages}</div>
                </div>
            </div>
        </div>
    );
};

export default QuickAnswerPage;
----- ./react/entities/exam/ui/SolutionPage.tsx -----
import React, { useMemo } from 'react';
import type { Problem } from '../../problem/model/types';
import MathpixRenderer from '../../../shared/ui/MathpixRenderer';
import ExamHeader from './ExamHeader';
import type { LayoutItem } from '../../../features/problem-publishing/model/examLayoutEngine';
import './ExamPage.css';
import { useHeightMeasurer } from '../../../features/problem-publishing/hooks/useHeightMeasurer';

type ProcessedProblem = Problem & { uniqueId: string; display_question_number: string; };

interface SolutionChunkItemProps {
    item: Extract<LayoutItem, { type: 'solutionChunk' }>;
    allProblems: ProcessedProblem[];
    onRenderComplete: (uniqueId: string, height: number) => void;
    useSequentialNumbering: boolean;
    contentFontSizeEm: number;
    contentFontFamily: string;
    isFirstChunk: boolean;
    parentProblem: ProcessedProblem;
}
const SolutionChunkItem: React.FC<SolutionChunkItemProps> = React.memo(({ item, allProblems, onRenderComplete, useSequentialNumbering, contentFontSizeEm, contentFontFamily, isFirstChunk, parentProblem }) => {
    
    const globalProblemIndex = useMemo(() => allProblems.findIndex(p => p.uniqueId === item.data.parentProblem.uniqueId) + 1, [allProblems, item.data.parentProblem.uniqueId]);
    
    const measureRef = useHeightMeasurer(onRenderComplete, item.uniqueId);
    
    if (!parentProblem) return null;

    const displayNumber = useSequentialNumbering ? `${globalProblemIndex}` : parentProblem.display_question_number;
    
    return (
        <div ref={measureRef} className="solution-item-container" data-solution-id={item.uniqueId}>
            {isFirstChunk && (<div className="solution-header"><span className="solution-number">{displayNumber}.</span></div>)}
            <div 
                className="solution-content-wrapper" 
                style={{ 
                    '--content-font-size-em': `${contentFontSizeEm}em`, 
                    '--content-font-family': contentFontFamily 
                } as React.CSSProperties}
            >
                <div className="mathpix-wrapper prose">
                    <MathpixRenderer text={item.data.text} />
                </div>
            </div>
        </div>
    );
});
SolutionChunkItem.displayName = 'SolutionChunkItem';

type ExamHeaderInfo = Pick<React.ComponentProps<typeof ExamHeader>, 
    | 'title' 
    | 'titleFontSize' 
    | 'titleFontFamily' 
    | 'school' 
    | 'schoolFontSize' 
    | 'schoolFontFamily' 
    | 'subject' 
    | 'subjectFontSize' 
    | 'subjectFontFamily' 
    | 'simplifiedSubjectText'
    | 'simplifiedSubjectFontSize'
    | 'simplifiedSubjectFontFamily'
    | 'simplifiedGradeText'
>;


interface SolutionPageProps {
    pageNumber: number;
    totalPages: number;
    items: LayoutItem[];
    allProblems: ProcessedProblem[];
    placementMap: Map<string, { page: number; column: number }>;
    onHeightUpdate: (uniqueId: string, height: number) => void;
    useSequentialNumbering: boolean;
    baseFontSize: string;
    contentFontSizeEm: number;
    contentFontFamily: string;
    headerInfo: ExamHeaderInfo;
    onHeaderUpdate: (targetId: string, field: string, value: any) => void;
}

const SolutionPage: React.FC<SolutionPageProps> = (props) => {
    const {
        pageNumber, totalPages, items, allProblems, placementMap, onHeightUpdate,
        useSequentialNumbering, baseFontSize, contentFontSizeEm, contentFontFamily,
        headerInfo, onHeaderUpdate,
    } = props;
    
    const leftColumnItems = useMemo(() => items.filter(item => placementMap.get(item.uniqueId)?.column === 1), [items, placementMap]);
    const rightColumnItems = useMemo(() => items.filter(item => placementMap.get(item.uniqueId)?.column === 2), [items, placementMap]);

    const latestProblemsMap = useMemo(() => new Map(allProblems.map(p => [p.uniqueId, p])), [allProblems]);

    const renderColumn = (columnItems: LayoutItem[]) => {
        return columnItems.map((item) => {
            if (item.type !== 'solutionChunk') return null;

            const parentProblem = latestProblemsMap.get(item.data.parentProblem.uniqueId);
            if (!parentProblem) return null;

            return (
                <SolutionChunkItem
                    key={item.uniqueId}
                    item={item} 
                    allProblems={allProblems}
                    onRenderComplete={onHeightUpdate}
                    useSequentialNumbering={useSequentialNumbering}
                    contentFontSizeEm={contentFontSizeEm}
                    contentFontFamily={contentFontFamily}
                    isFirstChunk={!item.uniqueId.includes('-sol-') || item.uniqueId.endsWith('-sol-0')}
                    parentProblem={parentProblem}
                />
            );
        });
    };
    
    const solutionHeaderInfo = { ...headerInfo, title: "정답 및 해설", subject: headerInfo.subject + " (해설)" };

    return (
        <div 
            className="exam-page-component solution-page solution-page-type" 
            style={{ '--base-font-size': baseFontSize } as React.CSSProperties}
        >
            <div className="exam-paper">
                <ExamHeader 
                    page={pageNumber}
                    totalPages={totalPages}
                    additionalBoxContent={allProblems[0]?.source ?? '정보 없음'}
                    {...solutionHeaderInfo}
                    onUpdate={onHeaderUpdate}
                />
                <div className="exam-columns-container">
                    <div className="exam-column">{renderColumn(leftColumnItems)}</div>
                    <div className="exam-column">{renderColumn(rightColumnItems)}</div>
                    <div className="column-divider"></div>
                </div>
                <div className="page-footer">
                    <div className="page-counter-box">{pageNumber} / {totalPages}</div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(SolutionPage);
----- ./react/entities/problem/api/problemApi.ts -----
import { handleApiResponse } from '../../../shared/api/api.utils';
import type { Problem } from '../model/types';

const API_BASE_URL = '/api/manage/problems';

interface UploadPayload {
    problems: Problem[];
}

export interface UploadResponse {
    success: boolean;
    created: number;
    updated: number;
}

/**
 * 모든 문제 목록을 가져옵니다.
 */
export const fetchProblemsAPI = async (): Promise<Problem[]> => {
    const res = await fetch(API_BASE_URL, {
        method: 'GET',
        credentials: 'include',
    });
    return handleApiResponse<Problem[]>(res);
};

/**
 * 특정 문제를 업데이트하는 API 함수입니다.
 */
export const updateProblemAPI = async (problemId: string, updatedFields: Partial<Problem>): Promise<Problem> => {
    const { problem_id, ...payload } = updatedFields;

    const res = await fetch(`${API_BASE_URL}/${problemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
    });
    return handleApiResponse<Problem>(res);
};

/**
 * [신규] 여러 문제를 영구적으로 삭제하는 API 함수입니다.
 * @param problemIds - 삭제할 문제 ID의 배열
 * @returns 성공 메시지와 삭제된 개수
 */
export const deleteProblemsAPI = async (problemIds: string[]): Promise<{ message: string; deleted_count: number }> => {
    const res = await fetch(API_BASE_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ problem_ids: problemIds })
    });
    return handleApiResponse<{ message: string; deleted_count: number }>(res);
};

/**
 * 문제 목록을 서버에 업로드합니다. (Create & Update)
 */
export const uploadProblemsAPI = async (problems: Problem[]): Promise<UploadResponse> => {
    const payload: UploadPayload = { problems };
    const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
    });
    return handleApiResponse<UploadResponse>(res);
};
----- ./react/entities/problem/model/types.ts -----

export interface Problem {
    problem_id: string; 
    source: string;
    page: number | null;
    question_number: number;
    answer: string;
    problem_type: string;
    grade: string;
    semester: string;
    major_chapter_id: string;
    middle_chapter_id: string;
    core_concept_id: string;
    problem_category: string;
    difficulty: string;
    score: string;
    question_text: string;
    solution_text: string | null; 
}

export interface Column {
	key: keyof Problem;
	label: string;
	readonly?: boolean;
	editType?: 'combobox' | 'textarea' | 'number' | 'text';
}

export type ComboboxOption = {
    value: string;
    label: string;
};
----- ./react/entities/problem/model/useProblemMutations.ts -----
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadProblemsAPI, updateProblemAPI, deleteProblemsAPI } from '../api/problemApi';
import type { Problem } from './types';
import { PROBLEMS_QUERY_KEY } from './useProblemsQuery';

import type { UploadResponse } from '../api/problemApi';

interface UpdateProblemVariables {
  id: string; 
  fields: Partial<Problem>;
}

/**
 * 문제 수정을 위한 React Query Mutation
 */
export function useUpdateProblemMutation() {
    const queryClient = useQueryClient();
    return useMutation<Problem, Error, UpdateProblemVariables>({
        mutationFn: (variables) => updateProblemAPI(variables.id, variables.fields),
        onSuccess: (_updatedProblem) => {
            queryClient.invalidateQueries({ queryKey: [PROBLEMS_QUERY_KEY] });
        },
        onError: (error) => {
            alert(`문제 업데이트 실패: ${error.message}`);
            console.error('Update failed:', error);
        },
    });
}

/**
 * 단일/다중 문제 영구 삭제를 위한 React Query Mutation
 */
export function useDeleteProblemsMutation() {
    const queryClient = useQueryClient();
    return useMutation<{ message: string, deleted_count: number }, Error, string[]>({
        mutationFn: (problemIds) => deleteProblemsAPI(problemIds),
        
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [PROBLEMS_QUERY_KEY] });
            alert(data.message || '문제가 삭제되었습니다.');
        },
        
        onError: (error) => {
            alert(`문제 삭제 실패: ${error.message}`);
            console.error('Problem delete failed:', error);
        },
    });
}

/**
 * 문제 업로드(생성/수정)를 위한 React Query Mutation
 */
export function useUploadProblemsMutation() {
    const queryClient = useQueryClient();
    return useMutation<UploadResponse, Error, Problem[]>({
        mutationFn: (problems) => uploadProblemsAPI(problems),
        onSuccess: (data) => {
            let message = "작업이 완료되었습니다.";
            if (data.created > 0 && data.updated > 0) {
                message = `${data.created}개의 문제가 생성되었고, ${data.updated}개의 문제가 업데이트되었습니다.`;
            } else if (data.created > 0) {
                message = `${data.created}개의 문제가 성공적으로 생성되었습니다.`;
            } else if (data.updated > 0) {
                message = `${data.updated}개의 문제가 성공적으로 업데이트되었습니다.`;
            }
            alert(message);
            queryClient.invalidateQueries({ queryKey: [PROBLEMS_QUERY_KEY] });
        },
        onError: (error) => {
            alert(`문제 업로드 실패: ${error.message}`);
            console.error('Upload failed:', error);
        },
    });
}
----- ./react/entities/problem/model/useProblemsQuery.ts -----

import { useQuery } from '@tanstack/react-query';
import { fetchProblemsAPI } from '../api/problemApi';
import type { Problem } from './types';

export const PROBLEMS_QUERY_KEY = 'problems';

export function useProblemsQuery() {
    return useQuery<Problem[], Error>({
        queryKey: [PROBLEMS_QUERY_KEY],
        queryFn: fetchProblemsAPI,
    });
}
----- ./react/entities/student/api/studentApi.ts -----

import type {
    Student,
    CreateStudentInput,
    UpdateStudentInput,
    UpdateStudentInputBody
} from '../model/useStudentDataWithRQ';
import { handleApiResponse } from '../../../shared/api/api.utils';

const API_BASE = '/api/manage/student';

/**
 * 모든 학생 목록을 가져옵니다.
 */
export const fetchStudentsAPI = async (): Promise<Student[]> => {
    const res = await fetch(API_BASE, {
        method: 'GET',
        credentials: 'include',
    });
    return handleApiResponse<Student[]>(res);
};

/**
 * 새로운 학생을 추가합니다.
 * @param newStudentData - 생성할 학생의 정보
 * @returns 생성된 학생 객체
 */
export const addStudentAPI = async (newStudentData: CreateStudentInput): Promise<Student> => {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newStudentData),
    });
    return handleApiResponse<Student>(res);
};

/**
 * 특정 학생의 정보를 업데이트합니다.
 * @param updateData - 업데이트할 학생의 id와 정보
 * @returns 업데이트된 학생 객체
 */
export const updateStudentAPI = async (updateData: UpdateStudentInput): Promise<Student> => {
    const { id, ...jsonData } = updateData;
    const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(jsonData as UpdateStudentInputBody),
    });
    return handleApiResponse<Student>(res);
};

/**
 * 특정 학생을 삭제(Soft Delete: 퇴원 처리)합니다.
 * @param id - 삭제할 학생의 id
 * @returns 성공 메시지와 삭제된 학생의 id
 */
export const deleteStudentAPI = async (id: string): Promise<{ message: string; id: string }> => {
    const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    return handleApiResponse<{ message: string; id: string }>(res);
};
----- ./react/entities/student/model/useStudentDataWithRQ.ts -----
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchStudentsAPI,
    addStudentAPI,
    updateStudentAPI,
    deleteStudentAPI,
} from '../api/studentApi';

export interface CreateStudentInput {
    student_name: string;
    grade: string;
    status: '재원' | '휴원' | '퇴원';
    subject: string;
    tuition: string | number;
    admission_date?: string | null;
    student_phone?: string | null;
    guardian_phone?: string | null;
    school_name?: string | null;
    class_name?: string | null;
    teacher?: string | null;
}

export interface UpdateStudentInputBody {
    student_name?: string;
    grade?: string;
    status?: '재원' | '휴원' | '퇴원';
    subject?: string;
    tuition?: string | number;
    admission_date?: string | null;
    student_phone?: string | null;
    guardian_phone?: string | null;
    school_name?: string | null;
    class_name?: string | null;
    teacher?: string | null;
    discharge_date?: string | null;
}

export interface UpdateStudentInput extends UpdateStudentInputBody {
    id: string;
}

export interface Student {
    id: string;
    tuition: number | null;
    admission_date: string | null;
    discharge_date: string | null;
    principal_id: string | null;
    grade: string;
    student_phone: string | null;
    guardian_phone: string | null;
    school_name: string | null;
    class_name: string | null;
    student_name: string;
    teacher: string | null;
    status: '재원' | '휴원' | '퇴원';
    subject: string;
    created_at: string;
    updated_at: string;
}

export interface MutationStatus<TData = unknown, TError = Error> {
    isPending: boolean;
    isError: boolean;
    error: TError | null;
    isSuccess: boolean;
    data?: TData | undefined;
}

export const GRADE_LEVELS = [
    '초1', '초2', '초3', '초4', '초5', '초6',
    '중1', '중2', '중3',
    '고1', '고2', '고3',
];

export const STUDENTS_QUERY_KEY = 'students';

export function useStudentDataWithRQ() {
    const queryClient = useQueryClient();

    const {
        data: students = [],
        isLoading: isLoadingStudents,
        isError: isStudentsError,
        error: studentsError,
        refetch: fetchStudents
    } = useQuery<Student[], Error>({
        queryKey: [STUDENTS_QUERY_KEY],
        queryFn: fetchStudentsAPI,
    });

    const addStudentMutation = useMutation<Student, Error, CreateStudentInput>({
        mutationFn: addStudentAPI,
        onSuccess: (newStudent) => {
            queryClient.setQueryData<Student[]>([STUDENTS_QUERY_KEY], (oldData = []) => 
                [...oldData, newStudent]
            );
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY] });
        }
    });

    const updateStudentMutation = useMutation<Student, Error, UpdateStudentInput>({
        mutationFn: updateStudentAPI,
        onSuccess: (updatedStudent) => {
            queryClient.setQueryData<Student[]>([STUDENTS_QUERY_KEY], (oldData = []) =>
                oldData.map(s => s.id === updatedStudent.id ? updatedStudent : s)
            );
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY] });
        }
    });

    const deleteStudentMutation = useMutation<{ message: string, id: string }, Error, string>({
        mutationFn: deleteStudentAPI,
        onSuccess: (data) => {
            queryClient.setQueryData<Student[]>([STUDENTS_QUERY_KEY], (oldData = []) =>
                oldData.filter(s => s.id !== data.id)
            );
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY] });
        }
    });

    return {
        students,
        isLoadingStudents,
        isStudentsError,
        studentsError,
        fetchStudents,

        addStudent: addStudentMutation.mutateAsync,
        updateStudent: updateStudentMutation.mutateAsync,
        deleteStudent: deleteStudentMutation.mutateAsync,

        addStudentStatus: {
            isPending: addStudentMutation.isPending,
            isError: addStudentMutation.isError,
            error: addStudentMutation.error,
            isSuccess: addStudentMutation.isSuccess,
            data: addStudentMutation.data,
        } as MutationStatus<Student, Error>,

        updateStudentStatus: {
            isPending: updateStudentMutation.isPending,
            isError: updateStudentMutation.isError,
            error: updateStudentMutation.error,
            isSuccess: updateStudentMutation.isSuccess,
            data: updateStudentMutation.data,
        } as MutationStatus<Student, Error>,

        deleteStudentStatus: {
            isPending: deleteStudentMutation.isPending,
            isError: deleteStudentMutation.isError,
            error: deleteStudentMutation.error,
            isSuccess: deleteStudentMutation.isSuccess,
            data: deleteStudentMutation.data,
        } as MutationStatus<{ message: string, id: string }, Error>,
    };
}
----- ./react/entities/student/ui/StudentDisplay.tsx -----
import React, { forwardRef } from 'react';
import type { Student } from '../model/useStudentDataWithRQ';
import { useUIStore } from '../../../shared/store/uiStore';
import StudentDisplayDesktop from './StudentDisplayDesktop';
import StudentDisplayMobile from './StudentDisplayMobile';
import type { SortConfig } from '../../../shared/ui/glasstable/GlassTable';

type StudentDisplayProps = {
    students: Student[];
    isLoading?: boolean;
    sortConfig?: SortConfig | null;
    onSort?: (key: string) => void;
    selectedIds: Set<string>;
    onToggleRow: (studentId: string) => void;
    isHeaderChecked: boolean;
    onToggleHeader: () => void;
    isHeaderDisabled?: boolean;
    editingStatusRowId: string | null;
    onEdit: (student: Student) => void;
    onNavigate: (studentId: string) => void;
    onToggleStatusEditor: (studentId: string) => void;
    onStatusUpdate: (studentId: string, status: Student['status'] | 'delete') => void;
    onCancel: () => void;
    scrollContainerProps?: React.HTMLAttributes<HTMLDivElement>;
    activeCardId: string | null;
    onCardClick: (studentId: string) => void;
    closeActiveCard: () => void;
};

const StudentDisplay = forwardRef<HTMLDivElement, StudentDisplayProps>((props, ref) => {
    const { currentBreakpoint } = useUIStore();
    
    if (currentBreakpoint === 'mobile') {
        return <StudentDisplayMobile {...props} />;
    }
    
    return <StudentDisplayDesktop ref={ref} {...props} />;
});

StudentDisplay.displayName = 'StudentDisplay';
export default StudentDisplay;
----- ./react/entities/student/ui/StudentDisplayDesktop.tsx -----
import React, { forwardRef, useMemo } from 'react';
import GlassTable, { type TableColumn, type SortConfig } from '../../../shared/ui/glasstable/GlassTable';
import Badge from '../../../shared/ui/Badge/Badge';
import { LuListChecks } from 'react-icons/lu';
import TableCellCheckbox from '../../../shared/ui/TableCellCheckbox/TableCellCheckbox';
import type { Student } from '../model/useStudentDataWithRQ';
import StudentActionButtons from '../../../features/student-actions/ui/StudentActionButtons';
import { useVisibleColumns } from '../../../shared/hooks/useVisibleColumns';
import './StudentDisplayDesktop.css';

type StudentDisplayProps = {
    students: Student[];
    isLoading?: boolean;
    sortConfig?: SortConfig | null;
    onSort?: (key: string) => void;
    selectedIds: Set<string>;
    onToggleRow: (studentId: string) => void;
    isHeaderChecked: boolean;
    onToggleHeader: () => void;
    isHeaderDisabled?: boolean;
    editingStatusRowId: string | null;
    onEdit: (student: Student) => void;
    onNavigate: (studentId: string) => void;
    onToggleStatusEditor: (studentId: string) => void;
    onStatusUpdate: (studentId: string, status: Student['status'] | 'delete') => void;
    onCancel: () => void;
    scrollContainerProps?: React.HTMLAttributes<HTMLDivElement>;
};

const StudentDisplayDesktop = forwardRef<HTMLDivElement, StudentDisplayProps>((props, ref) => {
    const {
        students, isLoading, sortConfig, onSort, selectedIds, onToggleRow,
        isHeaderChecked, onToggleHeader, isHeaderDisabled, scrollContainerProps,
        onEdit, onNavigate, onToggleStatusEditor, onStatusUpdate, onCancel, editingStatusRowId
    } = props;
    
    const visibleColumns = useVisibleColumns();
    
    const columns = useMemo(() => {
        const allColumns: TableColumn<Student>[] = [
            {
                key: 'header_action_button',
                header: <div className="header-icon-container"><button type="button" className="header-icon-button" title={isHeaderChecked ? "모든 항목 선택 해제" : "모든 항목 선택"} onClick={onToggleHeader} disabled={isHeaderDisabled || students.length === 0} aria-pressed={isHeaderChecked}><LuListChecks size={20} /></button></div>,
                render: (student) => (
                    <TableCellCheckbox
                        isChecked={selectedIds.has(student.id)}
                        onToggle={() => onToggleRow(student.id)}
                        ariaLabel={`학생 ${student.student_name} 선택`}
                    />
                ),
                className: 'sticky-col first-sticky-col',
            },
            { key: 'student_name', header: '이름', isSortable: true },
            { key: 'grade', header: '학년', isSortable: true },
            { key: 'subject', header: '과목', isSortable: true },
            { 
                key: 'status', 
                header: '상태', 
                isSortable: true, 
                render: (student) => {
                    let statusClassName = '';
                    switch (student.status) {
                        case '재원': statusClassName = 'status-enroll'; break;
                        case '휴원': statusClassName = 'status-pause'; break;
                        case '퇴원': statusClassName = 'status-leave'; break;
                        default: statusClassName = 'status-default';
                    }
                    return <Badge className={statusClassName}>{student.status}</Badge>;
                }
            },
            { key: 'teacher', header: '담당 강사', isSortable: true, render: (student) => student.teacher || '-' },
            { key: 'student_phone', header: '학생 연락처', render: (student) => student.student_phone || '-' },
            { key: 'guardian_phone', header: '학부모 연락처' },
            { key: 'school_name', header: '학교명', isSortable: true },
            { key: 'tuition', header: '수강료', isSortable: true, render: (student) => student.tuition ? student.tuition.toLocaleString() : '-' },
            { key: 'admission_date', header: '입원일', isSortable: true, render: (student) => student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '-' },
            { key: 'discharge_date', header: '퇴원일', render: (student) => student.discharge_date ? new Date(student.discharge_date).toLocaleDateString() : '-' },
            {
                key: 'actions',
                header: '관리',
                render: (student) => (
                    <StudentActionButtons 
                        studentId={student.id} 
                        studentName={student.student_name} 
                        isEditing={editingStatusRowId === student.id}
                        onEdit={() => onEdit(student)}
                        onNavigate={() => onNavigate(student.id)}
                        onToggleStatusEditor={() => onToggleStatusEditor(student.id)}
                        onStatusUpdate={onStatusUpdate} 
                        onCancel={onCancel}
                    />
                ),
                className: 'sticky-col last-sticky-col',
            },
        ];

        return allColumns.filter(col => visibleColumns[col.key as string]);

    }, [
        students,
        selectedIds,
        editingStatusRowId,
        isHeaderChecked,
        isHeaderDisabled,
        onToggleHeader,
        onToggleRow,
        onEdit,
        onNavigate,
        onToggleStatusEditor,
        onStatusUpdate,
        onCancel,
        visibleColumns,
    ]);

    return (
        <GlassTable<Student>
            ref={ref} 
            scrollContainerProps={scrollContainerProps}
            columns={columns}
            data={students}
            isLoading={isLoading}
            emptyMessage="표시할 학생 정보가 없습니다."
            sortConfig={sortConfig}
            onSort={onSort}
        />
    );
});

StudentDisplayDesktop.displayName = 'StudentDisplayDesktop';
export default StudentDisplayDesktop;
----- ./react/entities/student/ui/StudentDisplayMobile.tsx -----
import React from 'react';
import Badge from '../../../shared/ui/Badge/Badge';
import type { Student } from '../model/useStudentDataWithRQ';
import StudentActionButtons from '../../../features/student-actions/ui/StudentActionButtons';
import { useVisibleColumns } from '../../../shared/hooks/useVisibleColumns';
import './StudentDisplayMobile.css';

type StatusValue = Student['status'];

interface MobileStudentCardProps {
    student: Student;
    activeCardId: string | null;
    onCardClick: (studentId: string) => void;
    editingStatusRowId: string | null;
    onEdit: (student: Student) => void;
    onNavigate: (studentId: string) => void;
    onToggleStatusEditor: (studentId: string) => void;
    onStatusUpdate: (studentId: string, status: StatusValue | 'delete') => void;
    onCancel: () => void;
    closeActiveCard: () => void;
    selectedIds: Set<string>; // [핵심] 선택된 ID Set을 props로 받습니다.
}

const MobileStudentCard: React.FC<MobileStudentCardProps> = ({
    student, activeCardId, onCardClick, editingStatusRowId, onEdit,
    onNavigate, onToggleStatusEditor, onStatusUpdate, onCancel, closeActiveCard,
    selectedIds, // [핵심] props에서 selectedIds를 받습니다.
}) => {
    const isActive = activeCardId === student.id;
    const isEditingStatus = editingStatusRowId === student.id;
    const visibleColumns = useVisibleColumns();
    const isSelected = selectedIds.has(student.id); // [핵심] 현재 카드가 선택되었는지 확인합니다.

    const onEditRequest = () => {
        onEdit(student);
        closeActiveCard();
    };

    const onNavigateRequest = () => onNavigate(student.id);
    const onToggleStatusEditorRequest = () => onToggleStatusEditor(student.id);

    const cardClassName = `mobile-student-card ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`.trim();

    return (
        <div 
            className={cardClassName}
            onClick={() => onCardClick(student.id)}
            role="button"
            tabIndex={0}
            aria-expanded={isActive}
            aria-selected={isSelected} // [핵심] 접근성을 위해 aria-selected 속성을 추가합니다.
        >
            <div className="card-content-wrapper">
                <div className="card-main-info">
                    <div className="main-info-name-status">
                        <span className="main-info-name">{student.student_name}</span>
                        {visibleColumns.status && <Badge className={`status-${student.status.toLowerCase()}`}>{student.status}</Badge>}
                    </div>
                    <div className="main-info-tags">
                        {visibleColumns.grade && <span>{student.grade}</span>}
                        {visibleColumns.subject && <span>{student.subject}</span>}
                        {student.class_name && <span>{student.class_name}</span>}
                    </div>
                </div>
                <div className="card-details-grid">
                    <div className="detail-item phones">
                        {visibleColumns.guardian_phone && <span>학부모: {student.guardian_phone || '-'}</span>}
                        {visibleColumns.student_phone && <span>학생: {student.student_phone || '-'}</span>}
                    </div>
                    <div className="detail-item school-tuition">
                        {visibleColumns.school_name && <span>학교: {student.school_name || '-'}</span>}
                        {visibleColumns.tuition && <span>수강료: {student.tuition ? student.tuition.toLocaleString() : '-'}</span>}
                    </div>
                    <div className="detail-item dates">
                        {visibleColumns.admission_date && <span>입원일: {student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '-'}</span>}
                        {visibleColumns.discharge_date && <span>퇴원일: {student.discharge_date ? new Date(student.discharge_date).toLocaleDateString() : '-'}</span>}
                    </div>
                    <div className="detail-item teacher-info">
                        {visibleColumns.teacher && <span>담당 강사: {student.teacher || '-'}</span>}
                    </div>
                </div>
            </div>
            <div className="card-actions">
                <StudentActionButtons
                    studentId={student.id} studentName={student.student_name} isEditing={isEditingStatus}
                    onEdit={onEditRequest} onNavigate={onNavigateRequest} onToggleStatusEditor={onToggleStatusEditorRequest}
                    onStatusUpdate={onStatusUpdate} onCancel={onCancel}
                />
            </div>
        </div>
    );
};

type StudentDisplayProps = {
    students: Student[];
    isLoading?: boolean;
    editingStatusRowId: string | null;
    onEdit: (student: Student) => void;
    onNavigate: (studentId: string) => void;
    onToggleStatusEditor: (studentId: string) => void;
    onStatusUpdate: (studentId: string, status: Student['status'] | 'delete') => void;
    onCancel: () => void;
    activeCardId: string | null;
    onCardClick: (studentId: string) => void;
    closeActiveCard: () => void;
    selectedIds: Set<string>; // 이 prop이 MobileStudentCard로 전달됩니다.
};

const StudentDisplayMobile: React.FC<StudentDisplayProps> = (props) => {
    const { students, isLoading, selectedIds, ...rest } = props;

    if (isLoading) {
        return <div className="mobile-loading-state">로딩 중...</div>;
    }
    if (students.length === 0) {
        return <div className="mobile-loading-state">표시할 학생 정보가 없습니다.</div>;
    }
    return (
        <div className="mobile-student-list-container">
            {students.map(student => (
                <MobileStudentCard 
                    key={student.id} 
                    student={student}
                    selectedIds={selectedIds} // [핵심] selectedIds를 MobileStudentCard로 전달합니다.
                    {...rest}
                />
            ))}
        </div>
    );
};

export default StudentDisplayMobile;
----- ./react/features/exam-header-editing/ui/ExamHeaderEditPopover.tsx -----
import React from 'react';
import ActionButton from '../../../shared/ui/actionbutton/ActionButton';
import { LuCheck, LuUndo2 } from 'react-icons/lu';
import '../../../shared/ui/popover-content/PopoverContent.css';

interface ExamHeaderEditPopoverProps {
    targetLabel: string;
    textValue: string;
    onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fontSizeValue?: number;
    onFontSizeChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSave: () => void;
    onCancel: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
}

const ExamHeaderEditPopover: React.FC<ExamHeaderEditPopoverProps> = ({
    targetLabel,
    textValue,
    onTextChange,
    fontSizeValue,
    onFontSizeChange,
    onSave,
    onCancel,
    onKeyDown
}) => {
    return (
        <div className="edit-popover-content">
            <label htmlFor={`edit-${targetLabel}`}>{targetLabel} 수정</label>
            
            <div className="form-group form-group-gapped">
                <input 
                    id={`edit-${targetLabel}`}
                    type="text"
                    value={textValue}
                    onChange={onTextChange}
                    onKeyDown={onKeyDown}
                    className="popover-input" 
                    autoFocus 
                    placeholder="내용"
                />

                {fontSizeValue !== undefined && onFontSizeChange && (
                     <input
                        type="number"
                        step="0.01"
                        value={fontSizeValue}
                        onChange={onFontSizeChange}
                        onKeyDown={onKeyDown}
                        className="popover-input"
                        placeholder="크기(em)"
                    />
                )}
            </div>

            <div className="edit-popover-actions">
                <ActionButton onClick={onCancel} aria-label="취소">
                    <LuUndo2 size={14} className="popover-icon" />
                    취소
                </ActionButton>
                <ActionButton onClick={onSave} className="primary" aria-label="저장">
                    <LuCheck size={14} className="popover-icon" />
                    저장
                </ActionButton>
            </div>
        </div>
    );
};

export default ExamHeaderEditPopover;
----- ./react/features/image-upload/api/imageApi.ts -----
import { handleApiResponse } from '../../../shared/api/api.utils';

const API_BASE_UPLOAD = '/api/r2/upload';
const API_BASE_DELETE = '/api/r2/delete';

export interface UploadResponse {
    url: string;
    key: string;
}

/**
 * 이미지 파일을 서버에 업로드합니다.
 * @param file - 업로드할 이미지 파일
 * @returns 업로드된 이미지의 URL과 키
 */
export const uploadImageAPI = async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(API_BASE_UPLOAD, {
        method: 'POST',
        body: formData,
        credentials: 'include', // 세션/쿠키 인증을 위해 필요
    });
    return handleApiResponse<UploadResponse>(res);
};

/**
 * 서버에서 특정 키를 가진 이미지를 삭제합니다.
 * @param key - 삭제할 이미지의 키
 */
export const deleteImageAPI = async (key: string): Promise<void> => {
    const res = await fetch(API_BASE_DELETE, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key }),
    });
    await handleApiResponse<void>(res);
};
----- ./react/features/image-upload/model/useImageUploadManager.ts -----

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useUploadImageMutation, useDeleteImageMutation } from './useImageUploadWithRQ';

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * URL 문자열에서 마지막 경로 세그먼트를 파일 키로 추출합니다.
 * @param url - R2 공개 URL
 * @returns 추출된 키 또는 null
 */
function extractKeyFromUrl(url: string): string | null {
    if (!url) return null;
    try {
        const urlObject = new URL(url);
        const pathSegments = urlObject.pathname.split('/').filter(Boolean);
        return pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
    } catch (e) {
        console.warn(`Could not parse URL, falling back to substring: ${url}`, e);
        const lastSlashIndex = url.lastIndexOf('/');
        if (lastSlashIndex !== -1 && lastSlashIndex < url.length - 1) {
            return url.substring(lastSlashIndex + 1);
        }
        return null;
    }
}

/**
 * Markdown 텍스트 내의 이미지 참조를 관리하고,
 * R2에 이미지를 업로드/교체/정렬하는 로직을 담당하는 커스텀 훅.
 * @param markdownInput - 현재 에디터의 Markdown 텍스트
 */
export function useImageUploadManager(markdownInput: string) {
    const uploadMutation = useUploadImageMutation();
    const deleteMutation = useDeleteImageMutation();

    const [extractedImages, setExtractedImages] = useState<string[]>([]);
    const [localUrls, setLocalUrls] = useState<Record<string, string | undefined>>({});
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentUploadingTag, setCurrentUploadingTag] = useState<string | null>(null);
    const [isUploadingAll, setIsUploadingAll] = useState(false);
    
    const [draggingTag, setDraggingTag] = useState<string | null>(null);
    const [dragOverTag, setDragOverTag] = useState<string | null>(null);

    useEffect(() => {
        const imageRegex = /\*\*\*이미지\d+\*\*\*/g;
        const matches = markdownInput.match(imageRegex);
        const uniqueMatches = matches ? [...new Set(matches)].sort() : [];

        if (JSON.stringify(extractedImages) !== JSON.stringify(uniqueMatches)) {
            setExtractedImages(uniqueMatches);
            
            setLocalUrls(prev => {
                const next: Record<string, string | undefined> = {};
                uniqueMatches.forEach(tag => {
                    next[tag] = prev[tag] || undefined;
                });
                return next;
            });
        }
    }, [markdownInput, extractedImages]);

    const uploadImage = useCallback(async (file: File, imageTag: string): Promise<void> => {
        const oldUrl = localUrls[imageTag];
        setCurrentUploadingTag(imageTag);

        try {
            const { url: newUrl, key: newKey } = await uploadMutation.mutateAsync(file);

            setLocalUrls(prev => ({ ...prev, [imageTag]: newUrl }));

            if (oldUrl) {
                const oldKey = extractKeyFromUrl(oldUrl);
                if (oldKey && oldKey !== newKey) {
                    deleteMutation.mutate(oldKey, {
                        onSuccess: () => {
                            console.log(`Successfully deleted old image (key: ${oldKey})`);
                        },
                        onError: (deleteError) => {
                            console.error(`Failed to delete old image (key: ${oldKey}):`, deleteError);
                        }
                    });
                }
            }
        } catch (uploadError) {
            console.error(`Upload failed for tag ${imageTag}:`, uploadError);
            throw uploadError;
        } finally {
            setCurrentUploadingTag(null);
        }
    }, [localUrls, uploadMutation, deleteMutation]);

    const cleanupAfterSelection = useCallback(() => {
        setIsUploadingAll(false);
        if (fileInputRef.current) {
            fileInputRef.current.removeAttribute('multiple');
            fileInputRef.current.value = ''; // 선택된 파일 초기화
        }
    }, []);
    
    const handleFileSelected = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) {
            cleanupAfterSelection();
            return;
        }

        try {
            if (isUploadingAll) {
                const pendingTags = extractedImages.filter(tag => !localUrls[tag]);
                const filesToUpload = Array.from(files).slice(0, pendingTags.length);
                
                const uploadPromises = filesToUpload.map((file, i) => uploadImage(file, pendingTags[i]));
                await Promise.all(uploadPromises);

            } else if (currentUploadingTag) {
                await uploadImage(files[0], currentUploadingTag);
            }
        } catch (error) {
            console.error('An error occurred during file upload process:', error);
            alert('파일 업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            cleanupAfterSelection();
        }
    }, [isUploadingAll, currentUploadingTag, extractedImages, localUrls, uploadImage, cleanupAfterSelection]);
    
    const handleUploadSingleClick = useCallback((imageTag: string) => {
        setIsUploadingAll(false);
        setCurrentUploadingTag(imageTag); // 어떤 태그에 대한 업로드인지 먼저 설정
        fileInputRef.current?.click();
    }, []);

    const handleUploadAll = useCallback(() => {
        const pendingTagsCount = extractedImages.filter(tag => !localUrls[tag]).length;
        if (pendingTagsCount === 0) {
            alert('업로드할 이미지가 없습니다.');
            return;
        }
        setIsUploadingAll(true);
        setCurrentUploadingTag(null);
        if (fileInputRef.current) {
            fileInputRef.current.setAttribute('multiple', 'true');
            fileInputRef.current.click();
        }
    }, [extractedImages, localUrls]);

    const handleDragStart = useCallback((e: React.DragEvent<HTMLElement>, tag: string) => {
        if (!localUrls[tag]) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('text/plain', tag);
        e.dataTransfer.effectAllowed = 'move';
        setDraggingTag(tag);
    }, [localUrls]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLElement>, targetTag: string) => {
        e.preventDefault();
        const sourceTag = e.dataTransfer.getData('text/plain');
        if (sourceTag && targetTag && sourceTag !== targetTag) {
            setLocalUrls(prev => {
                const newUrls = { ...prev };
                [newUrls[sourceTag], newUrls[targetTag]] = [newUrls[targetTag], newUrls[sourceTag]];
                return newUrls;
            });
        }
        setDraggingTag(null);
        setDragOverTag(null);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>, tag: string) => {
        e.preventDefault(); // 드롭을 허용하기 위해 필수
        if (tag !== draggingTag) {
            setDragOverTag(tag);
        }
    }, [draggingTag]);
    
    const handleDragLeave = useCallback(() => setDragOverTag(null), []);

    const handleDragEnd = useCallback(() => {
        setDraggingTag(null);
        setDragOverTag(null);
    }, []);

    const { uploadStatuses, uploadedUrls, uploadErrors } = useMemo(() => {
        const statuses: Record<string, UploadStatus> = {};
        const errors: Record<string, string | null> = {};

        extractedImages.forEach(tag => {
            if (currentUploadingTag === tag || (isUploadingAll && !localUrls[tag] && uploadMutation.isPending)) {
                statuses[tag] = 'loading';
            } else if (localUrls[tag]) {
                statuses[tag] = 'success';
            } else if (currentUploadingTag === tag && uploadMutation.isError) {
                statuses[tag] = 'error';
                errors[tag] = uploadMutation.error?.message || 'Unknown upload error';
            } else {
                statuses[tag] = 'idle';
            }
        });

        return { uploadStatuses: statuses, uploadedUrls: localUrls, uploadErrors: errors };
    }, [extractedImages, localUrls, currentUploadingTag, isUploadingAll, uploadMutation.isPending, uploadMutation.isError, uploadMutation.error]);

    const pendingUploadCount = useMemo(() => extractedImages.filter(tag => !localUrls[tag]).length, [extractedImages, localUrls]);
    const canApply = useMemo(() => extractedImages.length > 0 && extractedImages.every(tag => !!localUrls[tag]), [extractedImages, localUrls]);

    return {
        extractedImages,
        uploadStatuses,
        uploadedUrls,
        uploadErrors,
        fileInputRef,
        draggingTag,
        dragOverTag,
        pendingUploadCount,
        canApply,
        handleFileSelected,
        onUploadSingle: handleUploadSingleClick,
        onUploadAll: handleUploadAll,
        onDragStart: handleDragStart,
        onDrop: handleDrop,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDragEnd: handleDragEnd,
    };
}
----- ./react/features/image-upload/model/useImageUploadWithRQ.ts -----
import { useMutation } from '@tanstack/react-query';
import { uploadImageAPI, deleteImageAPI, type UploadResponse } from '../api/imageApi';

/**
 * 이미지 업로드를 위한 React Query Mutation
 */
export function useUploadImageMutation() {
    return useMutation<UploadResponse, Error, File>({
        mutationFn: (file) => uploadImageAPI(file),
    });
}

/**
 * 이미지 삭제를 위한 React Query Mutation
 */
export function useDeleteImageMutation() {
    return useMutation<void, Error, string>({
        mutationFn: (key) => deleteImageAPI(key),
    });
}
----- ./react/features/image-upload/ui/ImageManager.tsx -----
import React from 'react';
import './ImageManager.css';
import { LuUndo2 } from 'react-icons/lu'; // '적용 취소' 아이콘 import

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

interface ImageManagerProps {
    extractedImages: string[];
    uploadStatuses: Record<string, UploadStatus>;
    uploadedUrls: Record<string, string | undefined>;
    uploadErrors: Record<string, string | null>;
    pendingUploadCount: number;
    canApply: boolean;
    draggingTag: string | null;
    dragOverTag: string | null;
    onUploadSingle: (tag: string) => void;
    onUploadAll: () => void;
    onApplyUrls: () => void;
    onDragStart: (e: React.DragEvent<HTMLElement>, tag: string) => void;
    onDrop: (e: React.DragEvent<HTMLElement>, tag: string) => void;
    onDragOver: (e: React.DragEvent<HTMLElement>, tag: string) => void;
    onDragLeave: (e: React.DragEvent<HTMLElement>) => void;
    onDragEnd: (e: React.DragEvent<HTMLElement>) => void;
    isApplied: boolean;
    onRevertUrls: () => void;
}

const ImageManager: React.FC<ImageManagerProps> = ({
    extractedImages, uploadStatuses, uploadedUrls, uploadErrors,
    pendingUploadCount, canApply, draggingTag, dragOverTag,
    onUploadSingle, onUploadAll, onApplyUrls,
    onDragStart, onDrop, onDragOver, onDragLeave, onDragEnd,
    isApplied,
    onRevertUrls,
}) => {

    if (extractedImages.length === 0) {
        return (
            <div className="image-manager-panel">
                <div className="panel-title-container">
                    <h2 className="panel-title">이미지 관리</h2>
                </div>
                <div className="panel-content empty-content">
                    <code>***이미지n***</code> 형식의 참조를 찾을 수 없습니다.
                </div>
            </div>
        );
    }

    return (
        <div className="image-manager-panel">
            <div className="panel-title-container">
                    <h2 className="panel-title">이미지 관리</h2>
                </div>

            <div className="button-row">
                <button onClick={onUploadAll} disabled={pendingUploadCount === 0} className="action-button secondary">
                    전체 업로드 ({pendingUploadCount})
                </button>
                
                {isApplied ? (
                    <button onClick={onRevertUrls} className="action-button secondary">
                        <LuUndo2 size={14} className="action-button-icon"/>
                        적용 취소
                    </button>
                ) : (
                    <button onClick={onApplyUrls} disabled={!canApply} className={`action-button primary ${!canApply ? 'disabled-style' : ''}`.trim()}>
                        에디터에 적용
                    </button>
                )}
            </div>

            <div className="table-content-area">
                <table className="image-table">
                    <thead>
                        <tr>
                            <th>이름</th>
                            <th>미리보기</th>
                            <th className="actions-header">액션</th>
                        </tr>
                    </thead>
                    <tbody>
                        {extractedImages.map(tag => {
                            const status = uploadStatuses[tag] || 'idle';
                            const url = uploadedUrls[tag];
                            const error = uploadErrors[tag];
                            const isDraggable = !!url;
                            
                            const rowClassName = `
                                image-table-row
                                ${draggingTag === tag ? 'dragging-row' : ''}
                                ${dragOverTag === tag ? 'drag-over-row' : ''}
                            `.trim();

                            return (
                                <tr 
                                    key={tag} 
                                    className={rowClassName}
                                    onDragOver={(e) => onDragOver(e, tag)}
                                    onDragLeave={onDragLeave}
                                    onDrop={(e) => onDrop(e, tag)}
                                    onDragEnd={onDragEnd}
                                >
                                    <td className="tag-name">
                                        {tag.slice(3, -3)}
                                    </td>
                                    <td
                                        draggable={isDraggable}
                                        onDragStart={(e) => onDragStart(e, tag)}
                                        className={`preview-cell ${isDraggable ? 'draggable' : ''}`}
                                    >
                                        <div className="preview-box">
                                            {url ? <img src={url} alt={`Preview for ${tag}`} /> : (status === 'loading' ? <span>로딩중...</span> : <span>(대기)</span>)}
                                        </div>
                                    </td>
                                    <td className="actions-cell">
                                        {status !== 'success' ? (
                                            <button onClick={() => onUploadSingle(tag)} disabled={status === 'loading'} className="action-button primary">
                                                {status === 'loading' ? '업로드 중...' : '업로드'}
                                            </button>
                                        ) : (
                                            <button onClick={() => onUploadSingle(tag)} className="action-button secondary">
                                                변경
                                            </button>
                                        )}
                                        {error && <div className="error-display" title={error}>{error}</div>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ImageManager;
----- ./react/features/json-problem-importer/model/useJsonProblemImporter.ts -----
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Problem, Column, ComboboxOption } from '../../../entities/problem/model/types';
import { useUploadProblemsMutation } from '../../../entities/problem/model/useProblemMutations';
import { produce } from 'immer';
import * as jsonc from 'jsonc-parser';

interface ParseErrorDetail {
    title: string;
    message: string;
    suggestion: string;
    line?: number;
    column?: number;
    problemIndex?: number;
}

const initialJsonInput = `{
  "problems": [
    {
      "question_number": "서답형 1",
      "question_text": "다음 함수의 최댓값을 구하시오: $f(x) = -x^2 + 4x - 1$",
      "answer": "$3$",
      "solution_text": "[해설] 완전제곱식으로 변환하면 $f(x) = -(x-2)^2 + 3$ 이므로 최댓값은 $3$이다.",
      "page": 15,
      "grade": "고1",
      "semester": "1학기",
      "source": "개념원리 수학(상)",
      "major_chapter_id": "이차방정식과 이차함수",
      "middle_chapter_id": "이차함수의 최대, 최소",
      "core_concept_id": "이차함수 표준형 변환",
      "problem_category": "이차함수 최댓값 구하기",
      "difficulty": "하",
      "score": "5점"
    }
  ]
}`;

const columns: Column[] = [
    { key: 'problem_id', label: 'ID', readonly: true }, // [추가] problem_id 컬럼
    { key: 'question_number', label: '번호', editType: 'number' },
    { key: 'problem_type', label: '유형(객/주)', editType: 'combobox' },
    { key: 'grade', label: '학년', editType: 'text' },
    { key: 'semester', label: '학기', editType: 'text' },
    { key: 'source', label: '출처', editType: 'text' },
    { key: 'major_chapter_id', label: '대단원', editType: 'text' },
    { key: 'middle_chapter_id', label: '중단원', editType: 'text' },
    { key: 'core_concept_id', label: '핵심개념', editType: 'text' },
    { key: 'problem_category', label: '문제 유형', editType: 'text' },
    { key: 'difficulty', label: '난이도', editType: 'combobox' },
    { key: 'score', label: '배점', editType: 'text' },
    { key: 'question_text', label: '문제 본문/보기', editType: 'textarea' },
    { key: 'answer', label: '정답', editType: 'text' },
    { key: 'page', label: '페이지', editType: 'number' },
    { key: 'solution_text', label: '해설', editType: 'textarea' },
];


export function useJsonProblemImporter() {
    const [jsonInput, setJsonInput] = useState(initialJsonInput);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [parseError, setParseError] = useState<ParseErrorDetail | null>(null);
    
    const [editingCell, setEditingCell] = useState<{ rowIndex: number; colKey: keyof Problem } | null>(null);
    const [editingValue, setEditingValue] = useState<string | number | null | undefined>('');
    const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);

    const [commonSource, setCommonSource] = useState('');
    const [commonGradeLevel, setCommonGradeLevel] = useState('');
    const [commonSemester, setCommonSemester] = useState('');

    const uploadMutation = useUploadProblemsMutation();
    const isUploading = uploadMutation.isPending;

    const previousJsonInputRef = useRef('');

    const getPosition = (offset: number) => {
        const lines = jsonInput.substring(0, offset).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        return { line, column };
    };

    const translateJsonError = (error: jsonc.ParseError): ParseErrorDetail => {
        const position = getPosition(error.offset);
        const commonSuggestions = {
            1: "객체 멤버 사이에 쉼표(,)가 빠졌거나, 마지막 멤버 뒤에 불필요한 쉼표가 있는지 확인하세요. (예: `\"key\": \"value\",`)",
            2: "키(key)와 값(value) 사이에 콜론(:)이 빠졌는지 확인하세요. (예: `\"key\": \"value\"`)",
            3: "객체(Object)를 시작하는 여는 중괄호 '{'가 빠졌거나 잘못된 위치에 있는지 확인하세요.",
            4: "객체(Object)를 닫는 닫는 중괄호 '}'가 빠졌거나 짝이 맞지 않는지 확인하세요.",
            5: "배열(Array)을 시작하는 여는 대괄호 '['가 빠졌거나 잘못된 위치에 있는지 확인하세요.",
            6: "배열(Array)을 닫는 닫는 대괄호 ']'가 빠졌거나 짝이 맞지 않는지 확인하세요.",
            10: "문자열(String)은 항상 큰따옴표(\")로 감싸야 합니다. 작은따옴표(')는 사용할 수 없습니다. (예: `\"text\"`)",
            14: "키(key)는 항상 큰따옴표(\")로 감싸진 문자열이어야 합니다. (예: `\"problems\"`)",
            15: "JSON 데이터가 중간에 예기치 않게 끝났습니다. 모든 괄호('{}', '[]')가 제대로 닫혔는지 확인하세요.",
            16: "숫자 형식이 올바르지 않습니다. 따옴표 없이 숫자만 입력해야 하며, `01`과 같이 0으로 시작할 수 없습니다.",
            17: "키-값 쌍의 키(key)는 반드시 문자열이어야 합니다. (예: `\"my_key\": ...`)"
        };
        return {
            title: "JSON 구문 오류",
            message: jsonc.printParseErrorCode(error.error),
            suggestion: commonSuggestions[error.error as keyof typeof commonSuggestions] || "JSON 문법을 다시 한번 꼼꼼히 확인해주세요.",
            line: position.line,
            column: position.column
        };
    };

    useEffect(() => {
        if (editingCell) return;
        if (jsonInput === previousJsonInputRef.current) return;

        previousJsonInputRef.current = jsonInput;
        
        const parseErrors: jsonc.ParseError[] = [];
        const parsedData = jsonc.parse(jsonInput, parseErrors, { allowTrailingComma: true });

        if (parseErrors.length > 0) {
            setProblems([]);
            setParseError(translateJsonError(parseErrors[0]));
            return;
        }

        try {
            if (typeof parsedData !== 'object' || parsedData === null) throw { title: "JSON 구조 오류", message: "최상위 데이터가 객체(Object)가 아닙니다.", suggestion: "데이터 전체를 중괄호 `{}`로 감싸주세요." };
            if (!('problems' in parsedData)) throw { title: "필수 키 누락", message: "'problems' 키를 찾을 수 없습니다.", suggestion: "최상위 객체 안에 `\"problems\": [ ... ]` 형식이 포함되어야 합니다." };
            if (!Array.isArray(parsedData.problems)) throw { title: "데이터 타입 오류", message: "'problems' 키의 값이 배열(Array)이 아닙니다.", suggestion: "'problems'의 값은 대괄호 `[]`로 감싸진 배열이어야 합니다." };

            const validationErrors: ParseErrorDetail[] = [];
            
            const transformedProblems = parsedData.problems
                .map((p: any, index: number): Problem | null => {
                    const problemIndex = index + 1;

                    if (typeof p !== 'object' || p === null) {
                        validationErrors.push({ title: "데이터 타입 오류", message: `배열의 ${problemIndex}번째 항목이 객체(Object)가 아닙니다.`, suggestion: "각 문제는 중괄호 `{}`로 감싸야 합니다.", problemIndex });
                        return null;
                    }
                    if (!('question_number' in p)) {
                        validationErrors.push({ title: "필수 필드 누락", message: `'question_number' 필드가 없습니다.`, suggestion: "모든 문제에는 `question_number` 필드가 반드시 포함되어야 합니다.", problemIndex });
                        return null;
                    }
                     if (!('question_text' in p)) {
                        validationErrors.push({ title: "필수 필드 누락", message: `'question_text' 필드가 없습니다.`, suggestion: "모든 문제에는 `question_text` 필드가 반드시 포함되어야 합니다.", problemIndex });
                        return null;
                    }

                    const problemNumRaw = p.question_number;
                    let finalProblemNum: number;
                    let parsedProblemType: string | null = null;

                    if (typeof problemNumRaw === 'string') {
                        const numericMatch = problemNumRaw.match(/[\d.]+/);
                        if (numericMatch) {
                            finalProblemNum = parseFloat(numericMatch[0]);
                            const textPart = problemNumRaw.replace(/[\d.]+/, '').trim();
                            if (textPart) parsedProblemType = textPart;
                        } else {
                             validationErrors.push({ title: "데이터 형식 오류", message: `'question_number' ("${problemNumRaw}")에서 숫자를 찾을 수 없습니다.`, suggestion: "문제 번호에 숫자 부분이 포함되어야 합니다. (예: '서답형 1', '5.2')", problemIndex });
                            return null;
                        }
                    } else if (typeof problemNumRaw === 'number') {
                        finalProblemNum = problemNumRaw;
                    } else {
                        validationErrors.push({ title: "데이터 타입 오류", message: `'question_number'가 숫자나 문자열이 아닙니다.`, suggestion: "문제 번호는 숫자(예: 5) 또는 문자열(예: '서답형 1')이어야 합니다.", problemIndex });
                        return null;
                    }

                    const finalProblemType = p.problem_type || parsedProblemType || '서답형';

                    const pageNumRaw = p.page;
                    let pageNum: number | null = null;
                    if (pageNumRaw !== null && pageNumRaw !== undefined && String(pageNumRaw).trim() !== '') {
                         const pageNumParsed = parseFloat(pageNumRaw);
                         if (!isNaN(pageNumParsed)) pageNum = pageNumParsed;
                    }
                    
                    return {
                        problem_id: p.problem_id || `new-${Date.now()}-${index}`, // ID가 있으면 사용, 없으면 임시 ID 생성
                        question_number: finalProblemNum,
                        problem_type: finalProblemType,
                        question_text: String(p.question_text ?? ''),
                        answer: p.answer ?? null,
                        solution_text: p.solution_text ?? null,
                        page: pageNum,
                        grade: String(p.grade ?? ''),
                        semester: String(p.semester ?? ''),
                        source: String(p.source ?? ''),
                        major_chapter_id: String(p.major_chapter_id ?? ''),
                        middle_chapter_id: String(p.middle_chapter_id ?? ''),
                        core_concept_id: String(p.core_concept_id ?? ''),
                        problem_category: String(p.problem_category ?? ''),
                        difficulty: String(p.difficulty ?? '중'),
                        score: String(p.score ?? ''),
                    };
                })
                .filter((p: Problem | null): p is Problem => p !== null);
            
            setProblems(transformedProblems);

            if (validationErrors.length > 0) {
                 setParseError(validationErrors[0]);
            } else {
                setParseError(null);
            }

        } catch (e: any) {
            setProblems([]);
            if (e.title && e.message && e.suggestion) {
                setParseError(e);
            } else {
                setParseError({
                    title: "알 수 없는 오류",
                    message: e.message || "데이터를 처리하는 중 알 수 없는 오류가 발생했습니다.",
                    suggestion: "JSON 구조와 내용을 다시 한번 확인해주세요."
                });
            }
        }
    }, [jsonInput, editingCell]);

    const formatValue = useCallback((value: Problem[keyof Problem] | null | undefined): string => {
        if (value === null || value === undefined) return '-';
        if (Array.isArray(value)) return value.join(', ');

        const strValue = String(value);
        if (strValue.startsWith('new-')) return '(신규)'; // 임시 ID는 '신규'로 표시
        
        if (strValue.length > 20 && strValue.includes('-')) {
            return `${strValue.substring(0, 8)}...`;
        }
        return strValue;
    }, []);

    const startEdit = useCallback((rowIndex: number, colKey: keyof Problem, currentValue: any, anchorEl: HTMLElement, isReadonly?: boolean) => {
        if (isReadonly) return;
        if (editingCell?.rowIndex === rowIndex && editingCell?.colKey === colKey) return;

        setEditingCell({ rowIndex, colKey });
        setPopoverAnchor(anchorEl);
        setEditingValue(currentValue ?? '');
    }, [editingCell]);

    const cancelEdit = useCallback(() => {
        setEditingCell(null);
        setPopoverAnchor(null);
        setEditingValue('');
    }, []);

    const saveEdit = useCallback((valueToSave?: any) => {
        if (!editingCell) return;
        const { rowIndex, colKey } = editingCell;
        
        const finalValue = valueToSave !== undefined ? valueToSave : editingValue;

        const nextProblems = produce(problems, draft => {
            const targetProblem = draft[rowIndex];
            if (!targetProblem) return;

            if (colKey === 'question_number' || colKey === 'page') {
                const numValue = parseFloat(String(finalValue));
                (targetProblem as any)[colKey] = isNaN(numValue) ? (finalValue === '' || finalValue === null ? null : (targetProblem as any)[colKey]) : numValue;
            } else {
                (targetProblem as any)[colKey] = finalValue;
            }
        });
        
        setProblems(nextProblems);
        const problemsForJson = nextProblems.map(p => {
            const { ...rest } = p;
            if (p.problem_id.startsWith('new-')) {
                delete (rest as any).problem_id;
            }
            return rest;
        });
        setJsonInput(JSON.stringify({ problems: problemsForJson }, null, 2));
        
        cancelEdit();
    }, [editingCell, editingValue, problems, cancelEdit]);

    const handleInputKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !(event.target instanceof HTMLTextAreaElement && event.shiftKey)) {
            event.preventDefault();
            saveEdit();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            cancelEdit();
        }
    }, [saveEdit, cancelEdit]);

    const applyCommonData = useCallback(() => {
        if (problems.length === 0) return;
        
        const nextProblems = produce(problems, draft => {
            draft.forEach(problem => {
                if (commonSource.trim()) problem.source = commonSource;
                if (commonGradeLevel.trim()) problem.grade = commonGradeLevel;
                if (commonSemester.trim()) problem.semester = commonSemester;
            });
        });

        setProblems(nextProblems);
        const problemsForJson = nextProblems.map(p => {
            const { ...rest } = p;
            if (p.problem_id.startsWith('new-')) {
                delete (rest as any).problem_id;
            }
            return rest;
        });
        setJsonInput(JSON.stringify({ problems: problemsForJson }, null, 2));
        alert('공통 정보가 적용되었습니다.');
    }, [problems, commonSource, commonGradeLevel, commonSemester]);

    const uploadProblems = useCallback(() => {
        if (problems.length === 0 || parseError) {
            alert('업로드할 문제가 없거나 데이터에 오류가 있습니다. 오류 메시지를 확인해주세요.');
            return;
        }
        
        const problemsToUpload = problems.map(p => {
            const { ...problemToSend } = p;

            if (problemToSend.problem_id.startsWith('new-')) {
                delete (problemToSend as Partial<Problem>).problem_id;
            }
            
            return problemToSend;
        });

        uploadMutation.mutate(problemsToUpload as Problem[]);

    }, [problems, parseError, uploadMutation]);
    
    const problemTypeOptions: ComboboxOption[] = [ { value: '객관식', label: '객관식' }, { value: '서답형', label: '서답형' }, { value: '논술형', label: '논술형' } ];
    const difficultyOptions: ComboboxOption[] = [ { value: '최상', label: '최상' }, { value: '상', label: '상' }, { value: '중', label: '중' }, { value: '하', label: '하' }, { value: '최하', label: '최하' } ];
    const answerOptions: ComboboxOption[] = [ { value: '①', label: '①' }, { value: '②', label: '②' }, { value: '③', label: '③' }, { value: '④', label: '④' }, { value: '⑤', label: '⑤' }, { value: '⑥', label: '⑥' } ];
    const gradeOptions: ComboboxOption[] = ['초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'].map(g => ({ value: g, label: g }));
    const semesterOptions: ComboboxOption[] = ['1학기', '2학기', '공통'].map(s => ({ value: s, label: s }));

    return {
        jsonInput, setJsonInput,
        problems,
        parseError,
        editingCell, startEdit, cancelEdit, saveEdit,
        editingValue, setEditingValue,
        popoverAnchor,
        handleInputKeyDown,
        commonSource, setCommonSource,
        commonGradeLevel, setCommonGradeLevel,
        commonSemester, setCommonSemester,
        applyCommonData,
        uploadProblems, isUploading,
        columns, formatValue,
        problemTypeOptions, difficultyOptions, answerOptions, gradeOptions, semesterOptions,
    };
}
----- ./react/features/json-problem-importer/ui/EditPopoverContent.tsx -----
import React from 'react';
import ActionButton from '../../../shared/ui/actionbutton/ActionButton';
import type { ComboboxOption } from '../../../entities/problem/model/types';
import { LuCheck, LuUndo2 } from 'react-icons/lu';

interface PopoverContentProps {
    label: string;
    onSave: () => void;
    onCancel: () => void;
}
interface PopoverInputProps extends PopoverContentProps, React.InputHTMLAttributes<HTMLInputElement> {}
interface PopoverTextareaProps extends PopoverContentProps, React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

interface PopoverComboboxProps {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    options: ComboboxOption[];
}

export const PopoverInput: React.FC<PopoverInputProps> = ({ label, onSave, onCancel, ...inputProps }) => (
    <div className="edit-popover-content">
        <label htmlFor={`edit-${label}`}>{label} 수정</label>
        <input id={`edit-${label}`} {...inputProps} className="popover-input" autoFocus />
        <div className="edit-popover-actions">
            <ActionButton onClick={onCancel} aria-label="취소">
                <LuUndo2 size={14} className="popover-icon" />
                취소
            </ActionButton>
            <ActionButton onClick={onSave} className="primary" aria-label="저장">
                <LuCheck size={14} className="popover-icon" />
                저장
            </ActionButton>
        </div>
    </div>
);


export const PopoverTextarea: React.FC<PopoverTextareaProps> = ({ label, onSave, onCancel, ...textareaProps }) => (
    <div className="edit-popover-content">
        <label htmlFor={`edit-${label}`}>{label} 수정</label>
        
        {/* [핵심] textarea와 버튼을 함께 담는 새로운 컨테이너 */}
        <div className="textarea-container">
            <textarea id={`edit-${label}`} {...textareaProps} className="popover-textarea" autoFocus />
            
            {/* [핵심] 버튼 그룹을 textarea와 같은 컨테이너 안으로 이동 */}
            <div className="edit-popover-actions on-textarea">
                <ActionButton onClick={onCancel} aria-label="취소">
                    <LuUndo2 size={14} className="popover-icon" />
                    취소
                </ActionButton>
                <ActionButton onClick={onSave} className="primary" aria-label="저장">
                    <LuCheck size={14} className="popover-icon" />
                    저장
                </ActionButton>
            </div>
        </div>
    </div>
);

export const PopoverCombobox: React.FC<PopoverComboboxProps> = ({ label, value, onValueChange, options }) => {
    return (
        <div className="edit-popover-content combobox-content">
            <div className="combobox-label">{label}</div>
            {options.map(option => (
                <button
                    key={option.value}
                    onClick={() => onValueChange(option.value)}
                    className="combobox-option"
                    aria-selected={value === option.value}
                >
                    {value === option.value && <LuCheck size={16} className="check-icon" />}
                    <span className="option-label">{option.label}</span>
                </button>
            ))}
        </div>
    );
};
----- ./react/features/json-viewer/ui/JsonViewerPanel.tsx -----
import React, { useMemo, useState, useCallback } from 'react';
import { LuCopy, LuCopyCheck } from 'react-icons/lu';
import type { ProcessedProblem } from '../../problem-publishing/model/problemPublishingStore';
import ActionButton from '../../../shared/ui/actionbutton/ActionButton';
import './JsonViewerPanel.css';

interface JsonViewerPanelProps {
    problems: ProcessedProblem[];
}

const JsonViewerPanel: React.FC<JsonViewerPanelProps> = ({ problems }) => {
    const [isCopied, setIsCopied] = useState(false);

    const problemsForJson = useMemo(() => {
        return problems.map(p => {
            return {
                problem_id: p.problem_id, // ✨ 핵심: problem_id는 반드시 포함시켜 업데이트의 키로 사용합니다.
                question_number: p.question_number,
                problem_type: p.problem_type,
                question_text: p.question_text,
                answer: p.answer,
                solution_text: p.solution_text,
                page: p.page,
                grade: p.grade,
                semester: p.semester,
                source: p.source,
                major_chapter_id: p.major_chapter_id,
                middle_chapter_id: p.middle_chapter_id,
                core_concept_id: p.core_concept_id,
                problem_category: p.problem_category,
                difficulty: p.difficulty,
                score: p.score,
            };
        });
    }, [problems]);

    const jsonString = useMemo(() => {
        if (problemsForJson.length === 0) {
            return "{\n  \"problems\": []\n}";
        }
        return JSON.stringify({ problems: problemsForJson }, null, 2);
    }, [problemsForJson]);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(jsonString).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy JSON: ', err);
            alert('클립보드 복사에 실패했습니다.');
        });
    }, [jsonString]);

    return (
        <div className="json-viewer-panel">
            <div className="json-viewer-header">
                <h4 className="json-viewer-title">필터링된 문제 JSON 변환</h4>
                <ActionButton onClick={handleCopy} className="primary">
                    {isCopied ? <LuCopyCheck size={16} /> : <LuCopy size={16} />}
                    {isCopied ? '복사 완료!' : 'JSON 복사'}
                </ActionButton>
            </div>
            <div className="json-viewer-content">
                <pre><code>{jsonString}</code></pre>
            </div>
        </div>
    );
};

export default JsonViewerPanel;
----- ./react/features/popovermenu/ProfileMenuContent.tsx -----
import React from 'react';
import { Link, useNavigate } from 'react-router'; //이게 올바른 import로 바뀜.
import { LuUser, LuSettings, LuLogIn, LuLogOut } from 'react-icons/lu';
import { useAuthStore, selectIsAuthenticated, selectUser, selectIsLoadingAuth } from '../../shared/store/authStore';
import './ProfileMenuContent.css';

interface ProfileMenuContentProps {
    onClose?: () => void;
}

const ProfileMenuContent: React.FC<ProfileMenuContentProps> = ({ onClose }) => {
    const navigate = useNavigate();
    
    const isAuthenticated = useAuthStore(selectIsAuthenticated);
    const user = useAuthStore(selectUser);
    const isLoading = useAuthStore(selectIsLoadingAuth);
    const signOut = useAuthStore((state) => state.signOut);

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    const handleLoginClick = () => {
        navigate('/login');
        handleClose();
    };

    const handleLogoutClick = async () => {
        try {
            await signOut();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error("[ProfileMenuContent] Error during sign out:", error);
            navigate('/login', { replace: true });
        } finally {
            handleClose();
        }
    };
    
    if (isLoading) {
        return <div className="profile-popover-content loading-state"><p>로딩 중...</p></div>;
    }

    return (
        <div className="profile-popover-content">
            {isAuthenticated && user ? (
                <>
                    <div className="profile-user-info">
                        <p className="profile-user-name">{user.user_metadata?.name || user.user_metadata?.full_name || '사용자'}</p>
                        <p className="profile-user-email">{user.email}</p>
                    </div>
                    <ul className="profile-menu-list">
                        <li className="profile-menu-item-li">
                            <Link to="/profile" className="profile-menu-item" onClick={handleClose} aria-label="내 프로필 보기" >
                                <LuUser size={16} className="profile-menu-icon" /> <span className="profile-menu-text">내 프로필</span>
                            </Link>
                        </li>
                        <li className="profile-menu-item-li">
                            <Link to="/settings/account" className="profile-menu-item" onClick={handleClose} aria-label="계정 설정으로 이동" >
                                <LuSettings size={16} className="profile-menu-icon" /> <span className="profile-menu-text">계정 설정</span>
                            </Link>
                        </li>
                        <li className="profile-menu-item-li">
                            <button type="button" className="profile-menu-item" onClick={handleLogoutClick} aria-label="로그아웃" >
                                <LuLogOut size={16} className="profile-menu-icon" /> <span className="profile-menu-text">로그아웃</span>
                            </button>
                        </li>
                    </ul>
                </>
            ) : (
                <ul className="profile-menu-list">
                    <li className="profile-menu-item-li">
                        <button type="button" className="profile-menu-item" onClick={handleLoginClick} aria-label="로그인" >
                            <LuLogIn size={16} className="profile-menu-icon" /> <span className="profile-menu-text">로그인</span>
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
};

export default ProfileMenuContent;
----- ./react/features/problem-publishing/hooks/useExamHeaderState.ts -----
import { useState, useCallback } from 'react';

type HeaderUpdateValue = {
    text: string;
    fontSize?: number;
    fontFamily?: string;
};

export type HeaderInfoState = {
    title: string;
    titleFontSize: number;
    titleFontFamily: string;
    school: string;
    schoolFontSize: number;
    schoolFontFamily: string;
    subject: string;
    subjectFontSize: number;
    subjectFontFamily: string;
    simplifiedSubjectText: string;
    simplifiedSubjectFontSize: number;
    simplifiedSubjectFontFamily: string;
    simplifiedGradeText: string;
    source: string;
};

export function useExamHeaderState() {
    const [headerInfo, setHeaderInfo] = useState<HeaderInfoState>({
        title: '2025학년도 3월 전국연합학력평가', titleFontSize: 1.64, titleFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        school: '제2교시', schoolFontSize: 1, schoolFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        subject: '수학 영역', subjectFontSize: 3, subjectFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        simplifiedSubjectText: '수학 영역', simplifiedSubjectFontSize: 1.6, simplifiedSubjectFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        simplifiedGradeText: '고3',
        source: '정보 없음',
    });

    const handleHeaderUpdate = useCallback((targetId: string, _field: string, value: HeaderUpdateValue) => {
        setHeaderInfo(prev => {
            const newState = { ...prev };
            const newFontSize = value.fontSize;

            switch (targetId) {
                case 'title':
                    newState.title = value.text;
                    if (newFontSize !== undefined) newState.titleFontSize = newFontSize;
                    break;
                case 'school':
                    newState.school = value.text;
                    if (newFontSize !== undefined) newState.schoolFontSize = newFontSize;
                    break;
                case 'subject':
                    newState.subject = value.text;
                    if (newFontSize !== undefined) newState.subjectFontSize = newFontSize;
                    break;
                case 'simplifiedSubject':
                    newState.simplifiedSubjectText = value.text;
                    if (newFontSize !== undefined) newState.simplifiedSubjectFontSize = newFontSize;
                    break;
                case 'simplifiedGrade':
                    newState.simplifiedGradeText = value.text;
                    break;
            }
            return newState;
        });
    }, []);

    return {
        headerInfo,
        onHeaderUpdate: handleHeaderUpdate,
        setHeaderInfo,
    };
}
----- ./react/features/problem-publishing/hooks/useExamPreviewManager.ts -----
import { useState, useCallback } from 'react';
import { useExamLayoutStore } from '../model/examLayoutStore';

export function useExamPreviewManager() {
    const {
        setItemHeight,
        baseFontSize,
        contentFontSizeEm,
        useSequentialNumbering,
        setBaseFontSize,
        setContentFontSizeEm,
        setUseSequentialNumbering,
    } = useExamLayoutStore();

    const [problemBoxMinHeight, setProblemBoxMinHeight] = useState(31);
    const [measuredHeights, setMeasuredHeights] = useState<Map<string, number>>(new Map());

    const handleHeightUpdate = useCallback((uniqueId: string, height: number) => {
        setItemHeight(uniqueId, height);
        setMeasuredHeights(prev => new Map(prev).set(uniqueId, height));
    }, [setItemHeight]);
    
    return {
        baseFontSize,
        contentFontSizeEm,
        useSequentialNumbering,
        problemBoxMinHeight,
        measuredHeights,

        onBaseFontSizeChange: setBaseFontSize,
        onContentFontSizeEmChange: setContentFontSizeEm,
        onToggleSequentialNumbering: () => setUseSequentialNumbering(!useSequentialNumbering),
        setProblemBoxMinHeight,
        onHeightUpdate: handleHeightUpdate,
    };
}
----- ./react/features/problem-publishing/hooks/useHeightMeasurer.ts -----
import { useCallback, useEffect, useRef } from 'react';

/**
 * ResizeObserver를 사용하여 렌더링된 요소의 높이 변경을 지속적으로 감지하고 보고하는 훅.
 */
export function useHeightMeasurer(onHeightUpdate: (uniqueId: string, height: number) => void, uniqueId: string) {
    const nodeRef = useRef<HTMLDivElement | null>(null);
    const lastReportedHeightRef = useRef<number | null>(null);

    const setRef = useCallback((node: HTMLDivElement | null) => {
        nodeRef.current = node;
    }, []);

    useEffect(() => {
        const element = nodeRef.current;
        if (!element) {
            return;
        }

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const styles = window.getComputedStyle(entry.target);
                const marginBottom = parseFloat(styles.marginBottom);
                
                const totalHeight = (entry.target as HTMLElement).offsetHeight + (isNaN(marginBottom) ? 0 : marginBottom);

                if (totalHeight > 0 && totalHeight !== lastReportedHeightRef.current) {
                    lastReportedHeightRef.current = totalHeight;
                    onHeightUpdate(uniqueId, totalHeight);
                }
            }
        });

        observer.observe(element);

        return () => {
            observer.disconnect();
        };

    }, [uniqueId, onHeightUpdate]);

    return setRef;
}
----- ./react/features/problem-publishing/hooks/usePdfGenerator.ts -----
import { useState, useCallback, RefObject, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PdfGeneratorProps {
    previewAreaRef: RefObject<HTMLDivElement | null>;
    getExamTitle: () => string;
    getSelectedProblemCount: () => number;
}

export interface PdfExportOptions {
    includeProblems: boolean;
    includeAnswers: boolean;
    includeSolutions: boolean;
}

export function usePdfGenerator({ previewAreaRef, getExamTitle, getSelectedProblemCount }: PdfGeneratorProps) {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0, message: '' });
    
    const isProcessingRef = useRef(false);

    const generatePdf = useCallback(async (options: PdfExportOptions) => {
        if (isProcessingRef.current) return;
        
        const livePreviewElement = previewAreaRef.current;
        if (!livePreviewElement || getSelectedProblemCount() === 0) {
            alert('PDF로 변환할 시험지 내용이 없습니다.');
            return;
        }

        const selectors = [];
        if (options.includeProblems) selectors.push('.problem-page-type');
        if (options.includeAnswers) selectors.push('.answer-page-type');
        if (options.includeSolutions) selectors.push('.solution-page-type');

        if (selectors.length === 0) {
            alert('PDF로 출력할 항목을 하나 이상 선택해주세요.');
            return;
        }
        
        const selectorString = selectors.join(', ');

        isProcessingRef.current = true;
        setIsGeneratingPdf(true);
        setPdfProgress({ current: 0, total: 1, message: '준비 중...' });

        setTimeout(async () => {
            const pageElements = livePreviewElement.querySelectorAll<HTMLElement>(selectorString);

            if (pageElements.length === 0) {
                alert('선택된 항목에 해당하는 페이지가 없습니다. PDF를 생성할 수 없습니다.');
                setIsGeneratingPdf(false);
                setPdfProgress({ current: 0, total: 0, message: '' });
                isProcessingRef.current = false;
                return;
            }

            setPdfProgress({ current: 0, total: pageElements.length, message: '시험지 정리 중...' });
            
            const printContainer = document.createElement('div');
            Object.assign(printContainer.style, {
                position: 'absolute', left: '-9999px', top: '0px',
                width: `${livePreviewElement.offsetWidth}px`,
            });
            document.body.appendChild(printContainer);
            
            try {
                pageElements.forEach(page => {
                    const clone = page.cloneNode(true) as HTMLElement;
                    clone.querySelectorAll('.editable-trigger-button .edit-icon-overlay, .problem-deselect-button, .measured-height, .global-index').forEach(el => el.remove());
                    clone.querySelectorAll<HTMLElement>('.problem-container').forEach(el => { el.style.border = 'none'; });
                    printContainer.appendChild(clone);
                });
                
                const scale = 2;
                const firstClonedPage = printContainer.querySelector<HTMLElement>('.exam-page-component');
                if (!firstClonedPage) throw new Error("복제된 요소를 찾을 수 없습니다.");

                const singlePageWidth = firstClonedPage.offsetWidth;
                const singlePageHeight = firstClonedPage.offsetHeight;
                const singlePageOffsetX = firstClonedPage.offsetLeft;
                
                setPdfProgress(prev => ({ ...prev, message: '시험지 이미지 생성 중...' }));
                
                const canvas = await html2canvas(printContainer, {
                    scale: scale,
                    useCORS: true,
                    logging: false,
                    width: printContainer.scrollWidth,
                    height: printContainer.scrollHeight,
                });
                
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const VERTICAL_MARGIN_MM = 10;

                for (let i = 0; i < pageElements.length; i++) {
                    const percentage = Math.round(((i + 1) / pageElements.length) * 100);
                    setPdfProgress(prev => ({ ...prev, current: i + 1, message: `${percentage}% 변환 중...` }));

                    if (i > 0) pdf.addPage();
                    
                    const sourceY = (singlePageHeight * i) * scale;
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = singlePageWidth * scale;
                    tempCanvas.height = singlePageHeight * scale;
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    if (tempCtx) {
                        tempCtx.drawImage(canvas, singlePageOffsetX * scale, sourceY, singlePageWidth * scale, singlePageHeight * scale, 0, 0, singlePageWidth * scale, singlePageHeight * scale);
                        const pageImgData = tempCtx.canvas.toDataURL('image/png');
                        const availableHeight = pdfHeight - (VERTICAL_MARGIN_MM * 2);
                        const imageAspectRatio = singlePageWidth / singlePageHeight;
                        let imgHeight = availableHeight;
                        let imgWidth = imgHeight * imageAspectRatio;
                        if (imgWidth > pdfWidth) {
                            imgWidth = pdfWidth;
                            imgHeight = imgWidth / imageAspectRatio;
                        }
                        const xOffset = (pdfWidth - imgWidth) / 2;
                        const yOffset = (pdfHeight - imgHeight) / 2;
                        pdf.addImage(pageImgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
                    }
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
                
                const examTitle = getExamTitle() || '시험지';
                pdf.save(`${examTitle}.pdf`);

            } catch (error) {
                console.error("PDF 생성 중 오류 발생:", error);
                alert("PDF를 생성하는 데 실패했습니다. 콘솔을 확인해주세요.");
            } finally {
                document.body.removeChild(printContainer);
                setIsGeneratingPdf(false);
                setPdfProgress({ current: 0, total: 0, message: '' });
                isProcessingRef.current = false;
            }
        }, 50);

    }, [previewAreaRef, getExamTitle, getSelectedProblemCount]);

    const progressPercentage = pdfProgress.total > 0 ? Math.round((pdfProgress.current / pdfProgress.total) * 100) : 0;
    const loadingMessage = pdfProgress.message || (isGeneratingPdf ? '변환 중...' : '');
    const finalLoadingText = isGeneratingPdf && pdfProgress.total > 0 && progressPercentage > 0 ? `${loadingMessage} (${progressPercentage}%)` : loadingMessage;
    
    return {
        isGeneratingPdf,
        pdfProgress: { ...pdfProgress, message: finalLoadingText || pdfProgress.message },
        generatePdf,
    };
}
----- ./react/features/problem-publishing/hooks/useProblemEditor.ts -----
import { useCallback } from 'react';
import { useLayoutStore } from '../../../shared/store/layoutStore';
import { useProblemPublishing } from '../model/useProblemPublishing';
import { useExamLayoutStore } from '../model/examLayoutStore';
import type { ProcessedProblem } from '../model/problemPublishingStore';

interface ProblemEditorProps {
    problemBoxMinHeight: number;
}

export function useProblemEditor({ problemBoxMinHeight }: ProblemEditorProps) {
    const {
        handleSaveProblem, handleLiveProblemChange, handleRevertProblem,
        startEditingProblem, setEditingProblemId
    } = useProblemPublishing();

    const { setRightSidebarConfig } = useLayoutStore.getState();
    const { forceRecalculateLayout } = useExamLayoutStore();

    const handleCloseEditor = useCallback(() => {
        setEditingProblemId(null);
        setRightSidebarConfig({ contentConfig: { type: null } });
        forceRecalculateLayout(problemBoxMinHeight);
    }, [setEditingProblemId, setRightSidebarConfig, forceRecalculateLayout, problemBoxMinHeight]);

    const handleSaveAndClose = useCallback(async (problem: ProcessedProblem) => {
        await handleSaveProblem(problem);
        handleCloseEditor();
    }, [handleSaveProblem, handleCloseEditor]);

    const handleRevertAndKeepOpen = useCallback((problemId: string) => {
        handleRevertProblem(problemId);
    }, [handleRevertProblem]);

    const handleProblemClick = useCallback((problem: ProcessedProblem) => {
        startEditingProblem();
        setEditingProblemId(problem.uniqueId);
        setRightSidebarConfig({
            contentConfig: {
                type: 'problemEditor',
                props: {
                    onProblemChange: handleLiveProblemChange,
                    onSave: handleSaveAndClose,
                    onRevert: handleRevertAndKeepOpen,
                    onClose: handleCloseEditor,
                    isSaving: false // 이 값은 usePublishingPageSetup에서 동적으로 업데이트됨
                }
            },
            isExtraWide: true
        });
    }, [
        startEditingProblem, setEditingProblemId, setRightSidebarConfig,
        handleLiveProblemChange, handleSaveAndClose, handleRevertAndKeepOpen, handleCloseEditor
    ]);

    return { onProblemClick: handleProblemClick };
}
----- ./react/features/problem-publishing/hooks/usePublishingPageSetup.ts -----
import { useEffect, useCallback, useMemo, useRef } from 'react'; // [수정] useRef 임포트
import { useLayoutStore } from '../../../shared/store/layoutStore';
import { useUIStore } from '../../../shared/store/uiStore';
import { useColumnPermissions } from '../../../shared/hooks/useColumnPermissions';
import { useProblemPublishing } from '../model/useProblemPublishing';
import type { ProcessedProblem } from '../model/problemPublishingStore';

interface PublishingPageSetupProps {
    selectedProblems: ProcessedProblem[];
    allProblems: ProcessedProblem[];
}

export function usePublishingPageSetup({ selectedProblems, allProblems }: PublishingPageSetupProps) {
    const { setRightSidebarConfig, setSearchBoxProps, registerPageActions } = useLayoutStore.getState();
    const { setRightSidebarExpanded, setColumnVisibility } = useUIStore.getState();
    const { permittedColumnsConfig } = useColumnPermissions();
    const { isSavingProblem } = useProblemPublishing();

    useEffect(() => {
        const initialVisibility: Record<string, boolean> = {};
        permittedColumnsConfig.forEach(col => {
            initialVisibility[col.key] = !col.defaultHidden;
        });
        setColumnVisibility(initialVisibility);
    }, [permittedColumnsConfig, setColumnVisibility]);
    
    const handleCloseSidebar = useCallback(() => {
        setRightSidebarConfig({ contentConfig: { type: null } });
        setRightSidebarExpanded(false);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    const handleOpenLatexHelpSidebar = useCallback(() => {
        setRightSidebarConfig({ contentConfig: { type: 'latexHelp' } });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    const handleOpenSettingsSidebar = useCallback(() => {
        setRightSidebarConfig({ contentConfig: { type: 'settings' } });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    const jsonStringToCombine = useMemo(() => {
        const problemsToConvert = selectedProblems.length > 0 ? selectedProblems : allProblems.slice(0, 1);
        if (problemsToConvert.length === 0) return '';

        const problemsForJson = problemsToConvert.map(p => ({
            problem_id: p.problem_id, question_number: p.question_number, problem_type: p.problem_type,
            question_text: p.question_text, answer: p.answer, solution_text: p.solution_text,
            page: p.page, grade: p.grade, semester: p.semester, source: p.source,
            major_chapter_id: p.major_chapter_id, middle_chapter_id: p.middle_chapter_id,
            core_concept_id: p.core_concept_id, problem_category: p.problem_category,
            difficulty: p.difficulty, score: p.score,
        }));
        return JSON.stringify({ problems: problemsForJson }, null, 2);
    }, [selectedProblems, allProblems]);

    const jsonStringToCombineRef = useRef(jsonStringToCombine);
    useEffect(() => {
        jsonStringToCombineRef.current = jsonStringToCombine;
    }, [jsonStringToCombine]);

    const handleOpenPromptSidebar = useCallback(() => {
        setRightSidebarConfig({
            contentConfig: { type: 'prompt', props: { workbenchContent: jsonStringToCombineRef.current } },
            isExtraWide: false
        });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    useEffect(() => {
        registerPageActions({
            onClose: handleCloseSidebar,
            openLatexHelpSidebar: handleOpenLatexHelpSidebar,
            openSearchSidebar: () => { /* No-op for this page */ },
            openSettingsSidebar: handleOpenSettingsSidebar,
            openPromptSidebar: handleOpenPromptSidebar,
        });
        return () => {
            setRightSidebarConfig({ contentConfig: { type: null } });
            setSearchBoxProps(null);
        };
    }, [handleCloseSidebar, setRightSidebarConfig, handleOpenLatexHelpSidebar, registerPageActions, setSearchBoxProps, handleOpenSettingsSidebar, handleOpenPromptSidebar]);

    useEffect(() => {
        const { contentConfig } = useLayoutStore.getState().rightSidebar;
        if (contentConfig.type === 'problemEditor' && contentConfig.props) {
            setRightSidebarConfig({
                contentConfig: { ...contentConfig, props: { ...contentConfig.props, isSaving: isSavingProblem } },
                isExtraWide: true
            });
        }
    }, [isSavingProblem, setRightSidebarConfig]);
}
----- ./react/features/problem-publishing/index.ts -----
export { useProblemPublishing } from './model/useProblemPublishing';
export { useExamLayoutStore } from './model/examLayoutStore';
export { useProblemPublishingStore } from './model/problemPublishingStore';
export { useProblemPublishingPage } from './model/useProblemPublishingPage';
export { useProblemSelection } from './model/useProblemSelection';

export { useExamHeaderState } from './hooks/useExamHeaderState';
export { usePdfGenerator } from './hooks/usePdfGenerator';
export { useProblemEditor } from './hooks/useProblemEditor';
export { useExamPreviewManager } from './hooks/useExamPreviewManager';
export { usePublishingPageSetup } from './hooks/usePublishingPageSetup';


export type { ProcessedProblem } from './model/problemPublishingStore';
export type { LayoutItem } from './model/examLayoutEngine';
----- ./react/features/problem-publishing/model/examLayoutEngine.ts -----
import type { ProcessedProblem } from './problemPublishingStore';

const PROBLEM_COLUMN_MAX_HEIGHT_FIRST_PAGE = 920;
const PROBLEM_COLUMN_MAX_HEIGHT_OTHER_PAGES = 990; // 2페이지 이상부터 적용될 높이
const SOLUTION_COLUMN_MAX_HEIGHT = 980; // 해설 페이지는 동일하게 유지
const DEFAULT_SOLUTION_CHUNK_ESTIMATED_HEIGHT = 40;

export type ProblemPlacementInfo = { page: number; column: number };

export type LayoutItem = 
    | { type: 'problem'; data: ProcessedProblem; uniqueId: string; }
    | { type: 'solutionChunk'; data: { text: string; parentProblem: ProcessedProblem }; uniqueId: string; };

type ProblemGroup = { items: LayoutItem[]; totalHeight: number };

/**
 * [핵심 수정] 레이아웃 계산 함수가 페이지 번호를 인자로 받아 최대 높이를 동적으로 결정하도록 변경합니다.
 * @param itemsToLayout - 배치할 아이템 목록
 * @param heightsMap - 각 아이템의 측정된 높이 맵
 * @param defaultHeight - 측정되지 않은 아이템의 기본 높이
 * @param getMaxHeight - 페이지 번호를 인자로 받아 해당 페이지의 최대 높이를 반환하는 함수
 */
const runLayoutCalculation = (
    itemsToLayout: LayoutItem[],
    heightsMap: Map<string, number>,
    defaultHeight: number, 
    getMaxHeight: (pageNumber: number) => number // maxHeight를 함수로 변경
): { pages: LayoutItem[][]; placements: Map<string, ProblemPlacementInfo> } => {
    const problemGroups: ProblemGroup[] = [];
    let currentGroupItems: LayoutItem[] = [];
    let currentGroupHeight = 0;
    
    const conservativeMaxHeight = Math.min(getMaxHeight(1), getMaxHeight(2));

    for (const item of itemsToLayout) {
        const itemHeight = heightsMap.get(item.uniqueId) || defaultHeight;
        if (itemHeight > conservativeMaxHeight) {
            if (currentGroupItems.length > 0) problemGroups.push({ items: currentGroupItems, totalHeight: currentGroupHeight });
            problemGroups.push({ items: [item], totalHeight: itemHeight });
            currentGroupItems = [];
            currentGroupHeight = 0;
        } else if (currentGroupHeight + itemHeight <= conservativeMaxHeight || currentGroupItems.length === 0) {
            currentGroupItems.push(item);
            currentGroupHeight += itemHeight;
        } else {
            problemGroups.push({ items: currentGroupItems, totalHeight: currentGroupHeight });
            currentGroupItems = [item];
            currentGroupHeight = itemHeight;
        }
    }
    if (currentGroupItems.length > 0) problemGroups.push({ items: currentGroupItems, totalHeight: currentGroupHeight });

    const newPages: LayoutItem[][] = [];
    const newPlacementMap = new Map<string, ProblemPlacementInfo>();
    
    let currentPageNumber = 1;
    let currentColumnIndex = 0; // 0: 왼쪽 단, 1: 오른쪽 단
    let currentColumnHeight = 0;
    let pageItemBuffer: LayoutItem[] = [];

    for (const group of problemGroups) {
        const currentMaxHeight = getMaxHeight(currentPageNumber);

        if (currentColumnHeight + group.totalHeight <= currentMaxHeight) {
            pageItemBuffer.push(...group.items);
            currentColumnHeight += group.totalHeight;
            group.items.forEach(item => {
                newPlacementMap.set(item.uniqueId, { page: currentPageNumber, column: currentColumnIndex + 1 });
            });
        } else {
            currentColumnIndex++;
            currentColumnHeight = 0;

            if (currentColumnIndex > 1) { // 오른쪽 단도 꽉 찼으면 다음 페이지로
                newPages.push([...pageItemBuffer]);
                pageItemBuffer = [];
                currentPageNumber++;
                currentColumnIndex = 0;
            }

            pageItemBuffer.push(...group.items);
            currentColumnHeight += group.totalHeight;
            group.items.forEach(item => {
                newPlacementMap.set(item.uniqueId, { page: currentPageNumber, column: currentColumnIndex + 1 });
            });
        }
    }
    
    if (pageItemBuffer.length > 0) newPages.push([...pageItemBuffer]);
    return { pages: newPages, placements: newPlacementMap };
};


export const calculateInitialLayout = (selectedProblems: ProcessedProblem[], problemBoxMinHeight: number, itemHeightsMap: Map<string, number>) => {
    console.log(`[LayoutEngine] 🎬 Calculating layout using existing height map.`);
    const initialEstimatedProblemHeight = problemBoxMinHeight * 12;
    const problemLayoutItems: LayoutItem[] = selectedProblems.map(p => ({ type: 'problem', data: p, uniqueId: p.uniqueId }));
    
    const problemResult = runLayoutCalculation(
        problemLayoutItems, 
        itemHeightsMap,
        initialEstimatedProblemHeight,
        (page) => page === 1 ? PROBLEM_COLUMN_MAX_HEIGHT_FIRST_PAGE : PROBLEM_COLUMN_MAX_HEIGHT_OTHER_PAGES
    );

    const solutionLayoutItems: LayoutItem[] = [];
    selectedProblems.forEach(p => {
        if (p.solution_text?.trim()) {
            p.solution_text.split(/\n\s*\n/).filter(c => c.trim()).forEach((chunk, index) => {
                solutionLayoutItems.push({
                    type: 'solutionChunk',
                    data: { text: chunk, parentProblem: p },
                    uniqueId: `${p.uniqueId}-sol-${index}`
                });
            });
        }
    });
    
    const solutionResult = runLayoutCalculation(
        solutionLayoutItems,
        itemHeightsMap,
        DEFAULT_SOLUTION_CHUNK_ESTIMATED_HEIGHT,
        () => SOLUTION_COLUMN_MAX_HEIGHT
    );
    
    console.log(`[LayoutEngine] ✅ Layout calculation finished.`);
    return {
        problems: problemResult,
        solutions: solutionResult,
    };
};

export const recalculateProblemLayout = (problemsForLayout: ProcessedProblem[], itemHeightsMap: Map<string, number>, problemBoxMinHeight: number) => {
    console.log(`[LayoutEngine] 🚀 RE-calculating PROBLEM layout ONLY with actual heights.`);
    
    const fallbackProblemHeight = problemBoxMinHeight * 12;

    const problemLayoutItems: LayoutItem[] = problemsForLayout.map(p => ({ type: 'problem', data: p, uniqueId: p.uniqueId }));
    
    const problemResult = runLayoutCalculation(
        problemLayoutItems, 
        itemHeightsMap, 
        fallbackProblemHeight, 
        (page) => page === 1 ? PROBLEM_COLUMN_MAX_HEIGHT_FIRST_PAGE : PROBLEM_COLUMN_MAX_HEIGHT_OTHER_PAGES
    );

    console.log(`[LayoutEngine] ✅ Problem re-calculation finished.`);
    return problemResult;
};

export const recalculateSolutionLayout = (selectedProblems: ProcessedProblem[], itemHeightsMap: Map<string, number>) => {
    console.log(`[LayoutEngine] 🚀 RE-calculating SOLUTION layout ONLY with actual heights.`);

    const solutionLayoutItems: LayoutItem[] = [];
    selectedProblems.forEach(p => {
        if (p.solution_text?.trim()) {
            p.solution_text.split(/\n\s*\n/).filter(c => c.trim()).forEach((chunk, index) => {
                solutionLayoutItems.push({
                    type: 'solutionChunk',
                    data: { text: chunk, parentProblem: p },
                    uniqueId: `${p.uniqueId}-sol-${index}`
                });
            });
        }
    });
    
    const solutionResult = runLayoutCalculation(
        solutionLayoutItems,
        itemHeightsMap,
        DEFAULT_SOLUTION_CHUNK_ESTIMATED_HEIGHT,
        () => SOLUTION_COLUMN_MAX_HEIGHT
    );
    
    console.log(`[LayoutEngine] ✅ Solution re-calculation finished.`);
    return solutionResult;
};
----- ./react/features/problem-publishing/model/examLayoutStore.ts -----
import { create } from 'zustand';
import type { ProcessedProblem } from './problemPublishingStore';
import { calculateInitialLayout, recalculateProblemLayout, recalculateSolutionLayout, type LayoutItem, type ProblemPlacementInfo } from './examLayoutEngine';
import { useProblemPublishingStore } from './problemPublishingStore';

let itemHeightsMap = new Map<string, number>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let recalculateTimer: ReturnType<typeof setTimeout> | null = null;

interface ExamUIOptions {
    baseFontSize: string;
    contentFontSizeEm: number;
    useSequentialNumbering: boolean;
}

interface ExamLayoutState extends ExamUIOptions {
    distributedPages: LayoutItem[][];
    placementMap: Map<string, ProblemPlacementInfo>;
    distributedSolutionPages: LayoutItem[][];
    solutionPlacementMap: Map<string, ProblemPlacementInfo>;
    problemsForLayout: ProcessedProblem[];
    isLayoutFinalized: boolean; 
    isDraggingControl: boolean;
}

interface ExamLayoutActions {
    setItemHeight: (uniqueId: string, height: number) => void;
    startLayoutCalculation: (selectedProblems: ProcessedProblem[], problemBoxMinHeight: number) => void;
    resetLayout: () => void;
    setBaseFontSize: (size: string) => void;
    setContentFontSizeEm: (size: number) => void;
    setUseSequentialNumbering: (use: boolean) => void;
    setDraggingControl: (isDragging: boolean) => void;
    forceRecalculateLayout: (minHeight: number) => void;
}

const logLayoutResult = (problems: ProcessedProblem[], problemPlacements: Map<string, ProblemPlacementInfo>, solutionPlacements: Map<string, ProblemPlacementInfo>) => {
    console.groupCollapsed('--- Layout Calculation Result ---');
    
    problemPlacements.forEach((placement, uniqueId) => {
        const problem = problems.find(p => p.uniqueId === uniqueId);
        const height = itemHeightsMap.get(uniqueId) || 'N/A';
        if (problem) {
            console.log(
                `[Problem] Num: ${problem.display_question_number}, Page: ${placement.page}, Col: ${placement.column}, Height: ${typeof height === 'number' ? height.toFixed(1) + 'px' : height}`
            );
        }
    });

    solutionPlacements.forEach((placement, uniqueId) => {
        const parentProblemId = uniqueId.split('-sol-')[0];
        const problem = problems.find(p => p.uniqueId === parentProblemId);
        const height = itemHeightsMap.get(uniqueId) || 'N/A';
        if (problem) {
            console.log(
                `  [Solution Chunk] For: ${problem.display_question_number}, Page: ${placement.page}, Col: ${placement.column}, Height: ${typeof height === 'number' ? height.toFixed(1) + 'px' : height}`
            );
        }
    });

    console.groupEnd();
};

const runDebouncedRecalculation = (get: () => ExamLayoutState & ExamLayoutActions) => {
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
        const state = get();
        const isEditing = !!useProblemPublishingStore.getState().editingProblemId;

        if (state.isLayoutFinalized || state.isDraggingControl || isEditing) {
             console.log("[LOG] examLayoutStore: 레이아웃이 확정되었거나, 드래그 중이거나, 편집 중이므로 디바운스된 재계산을 건너뜁니다.");
            return;
        }
    }, 500);
};

export const useExamLayoutStore = create<ExamLayoutState & ExamLayoutActions>((set, get) => ({
    baseFontSize: '12px',
    contentFontSizeEm: 1,
    useSequentialNumbering: false,
    
    distributedPages: [],
    placementMap: new Map(),
    distributedSolutionPages: [],
    solutionPlacementMap: new Map(),
    problemsForLayout: [],
    isLayoutFinalized: true,
    isDraggingControl: false,

    setDraggingControl: (isDragging) => set({ isDraggingControl: isDragging }),

    setItemHeight: (uniqueId, height) => {
        const oldHeight = itemHeightsMap.get(uniqueId);
        if (oldHeight === height) return;
        
        itemHeightsMap.set(uniqueId, height);

        if (recalculateTimer) clearTimeout(recalculateTimer);
        recalculateTimer = setTimeout(() => {
            console.log('[LOG] examLayoutStore: 높이 측정 완료 후 최종 레이아웃 재계산을 시도합니다.');
            const { problemsForLayout, isLayoutFinalized, isDraggingControl } = get();
            const isEditing = !!useProblemPublishingStore.getState().editingProblemId;

            if (isLayoutFinalized || isDraggingControl || isEditing || problemsForLayout.length === 0) {
                return;
            }
            
            const allItemsToMeasure: string[] = [];
            problemsForLayout.forEach(p => {
                allItemsToMeasure.push(p.uniqueId);
                if (p.solution_text?.trim()) {
                    p.solution_text.split(/\n\s*\n/).filter(c => c.trim()).forEach((_, index) => {
                        allItemsToMeasure.push(`${p.uniqueId}-sol-${index}`);
                    });
                }
            });

            const allMeasured = allItemsToMeasure.every(id => itemHeightsMap.has(id));

            if (allMeasured) {
                console.log('[LOG] examLayoutStore: ✅ 모든 항목의 높이가 측정되었습니다. 최종 레이아웃을 실행합니다.');
                get().forceRecalculateLayout(31);
            } else {
                console.log('[LOG] examLayoutStore: ⏳ 아직 측정되지 않은 항목이 있습니다. 재계산을 보류합니다.');
            }
        }, 500);
    },
    
    forceRecalculateLayout: (minHeight) => {
        if (get().isDraggingControl) return;
        if (debounceTimer) clearTimeout(debounceTimer);

        console.log(`[LOG] examLayoutStore: ⚡️ 강제 레이아웃 재계산 (minHeight: ${minHeight})`);
        const { problemsForLayout } = get();
        if (problemsForLayout.length === 0) return;

        const problemResult = recalculateProblemLayout(problemsForLayout, itemHeightsMap, minHeight);
        const solutionResult = recalculateSolutionLayout(problemsForLayout, itemHeightsMap);

        set({
            distributedPages: problemResult.pages,
            placementMap: problemResult.placements,
            distributedSolutionPages: solutionResult.pages,
            solutionPlacementMap: solutionResult.placements,
            isLayoutFinalized: true,
        });
        logLayoutResult(problemsForLayout, problemResult.placements, solutionResult.placements);
    },

    resetLayout: () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        if (recalculateTimer) clearTimeout(recalculateTimer);
        itemHeightsMap = new Map<string, number>();
        set({
            distributedPages: [],
            placementMap: new Map(),
            distributedSolutionPages: [],
            solutionPlacementMap: new Map(),
            problemsForLayout: [],
            isLayoutFinalized: true,
        });
    },

    startLayoutCalculation: (selectedProblems, problemBoxMinHeight) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        if (recalculateTimer) clearTimeout(recalculateTimer);
        
        const newHeightsMap = new Map<string, number>();
        const selectedIds = new Set(selectedProblems.map(p => p.uniqueId));
        itemHeightsMap.forEach((height, id) => {
            const problemId = id.includes('-sol-') ? id.split('-sol-')[0] : id;
            if (selectedIds.has(problemId)) {
                newHeightsMap.set(id, height);
            }
        });
        itemHeightsMap = newHeightsMap;

        const { problems, solutions } = calculateInitialLayout(selectedProblems, problemBoxMinHeight, itemHeightsMap);
        
        set({ 
            problemsForLayout: selectedProblems,
            distributedPages: problems.pages,
            placementMap: problems.placements,
            distributedSolutionPages: solutions.pages,
            solutionPlacementMap: solutions.placements,
            isLayoutFinalized: false,
        });

        logLayoutResult(selectedProblems, problems.placements, solutions.placements);

        recalculateTimer = setTimeout(() => {
            get().setItemHeight('', -1);
        }, 600);
    },

    setBaseFontSize: (size) => {
        set({ baseFontSize: size, isLayoutFinalized: false });
        runDebouncedRecalculation(get);
    },
    setContentFontSizeEm: (size) => {
        set({ contentFontSizeEm: size, isLayoutFinalized: false });
        runDebouncedRecalculation(get);
    },
    setUseSequentialNumbering: (use) => set({ useSequentialNumbering: use }),
}));
----- ./react/features/problem-publishing/model/problemPublishingStore.ts -----
import { create } from 'zustand';
import { produce } from 'immer';
import type { Problem } from '../../../entities/problem/model/types';

export type ProcessedProblem = Problem & { display_question_number: string; uniqueId: string; };

interface ProblemPublishingState {
  initialProblems: ProcessedProblem[];
  draftProblems: ProcessedProblem[] | null;
  editingProblemId: string | null;
}

interface ProblemPublishingActions {
  setInitialData: (problems: ProcessedProblem[]) => void;
  startEditing: () => void;
  revertChanges: () => void;
  updateDraftProblem: (updatedProblem: ProcessedProblem) => void;
  revertSingleProblem: (problemId: string) => void;
  setEditingProblemId: (problemId: string | null) => void;
  saveProblem: (problemToSave: ProcessedProblem) => void; // 저장 후 상태 동기화를 위한 액션
}

export const useProblemPublishingStore = create<ProblemPublishingState & ProblemPublishingActions>((set, get) => ({
  initialProblems: [],
  draftProblems: null,
  editingProblemId: null,

  setInitialData: (problems) => {
    set({ initialProblems: problems, draftProblems: null, editingProblemId: null });
  },

  startEditing: () => {
    if (get().draftProblems === null) {
      set(state => ({
        draftProblems: JSON.parse(JSON.stringify(state.initialProblems))
      }));
    }
  },

  revertChanges: () => {
    set({ draftProblems: null });
  },

  updateDraftProblem: (updatedProblem) => {
    console.log('[LOG] problemPublishingStore: 📝 updateDraftProblem 액션 실행', { uniqueId: updatedProblem.uniqueId, textLength: updatedProblem.question_text.length });
    set(produce((state: ProblemPublishingState) => {
      if (state.draftProblems) {
        const index = state.draftProblems.findIndex(p => p.uniqueId === updatedProblem.uniqueId);
        if (index !== -1) {
          state.draftProblems[index] = updatedProblem;
        }
      }
    }));
  },

  revertSingleProblem: (problemId) => {
    set(produce((state: ProblemPublishingState) => {
      const originalProblem = state.initialProblems.find(p => p.uniqueId === problemId);
      if (originalProblem && state.draftProblems) {
        const index = state.draftProblems.findIndex(p => p.uniqueId === problemId);
        if (index !== -1) {
          state.draftProblems[index] = originalProblem;
        }
      }
    }));
  },
  
  setEditingProblemId: (problemId) => {
    set({ editingProblemId: problemId });
  },

  saveProblem: (problemToSave) => {
    set(produce((state: ProblemPublishingState) => {
        const initialIndex = state.initialProblems.findIndex(p => p.uniqueId === problemToSave.uniqueId);
        if (initialIndex !== -1) {
            state.initialProblems[initialIndex] = problemToSave;
        }
        if (state.draftProblems) {
            const draftIndex = state.draftProblems.findIndex(p => p.uniqueId === problemToSave.uniqueId);
            if (draftIndex !== -1) {
                state.draftProblems[draftIndex] = problemToSave;
            }
        }
    }));
  }
}));
----- ./react/features/problem-publishing/model/useExamLayoutManager.ts -----
import { useEffect, useRef } from 'react';
import { useExamLayoutStore } from './examLayoutStore';
import type { ProcessedProblem } from './problemPublishingStore';

interface ExamLayoutManagerProps {
    selectedProblems: ProcessedProblem[];
    problemBoxMinHeight: number;
}

/**
 * 선택된 문제 목록을 받아 시험지 레이아웃 계산을 관리하는 훅.
 */
export function useExamLayoutManager({ selectedProblems, problemBoxMinHeight }: ExamLayoutManagerProps) {
    const { startLayoutCalculation, resetLayout } = useExamLayoutStore();
    
    const prevSelectedIdsRef = useRef<string>('');

    useEffect(() => {
        const currentSelectedIds = selectedProblems.map(p => p.uniqueId).sort().join(',');

        if (currentSelectedIds !== prevSelectedIdsRef.current) {
            console.log('[useExamLayoutManager] Detected change in selected problems. Triggering full layout calculation.');
            prevSelectedIdsRef.current = currentSelectedIds; // 이전 ID 목록을 현재 목록으로 업데이트

            if (selectedProblems.length > 0) {
                startLayoutCalculation(selectedProblems, problemBoxMinHeight);
            } else {
                resetLayout();
            }
        }
    }, [selectedProblems, problemBoxMinHeight, startLayoutCalculation, resetLayout]);

    useEffect(() => {
        return () => {
            resetLayout();
        };
    }, [resetLayout]);
}
----- ./react/features/problem-publishing/model/useProblemPublishing.ts -----
import { useMemo, useCallback, useEffect } from 'react';
import { useProblemsQuery } from '../../../entities/problem/model/useProblemsQuery';
import { useUpdateProblemMutation, useDeleteProblemsMutation } from '../../../entities/problem/model/useProblemMutations';
import { useProblemPublishingStore, type ProcessedProblem } from './problemPublishingStore';
import { useRowSelection } from '../../row-selection/model/useRowSelection';

export type { ProcessedProblem } from './problemPublishingStore';
export type { LayoutItem } from './examLayoutEngine';

export function useProblemPublishing() {
    const { data: rawProblems = [], isLoading: isLoadingProblems } = useProblemsQuery();
    const updateProblemMutation = useUpdateProblemMutation();
    const { mutateAsync: updateProblem } = updateProblemMutation;
    const { mutate: deleteProblems, isPending: isDeletingProblems } = useDeleteProblemsMutation();
    
    const {
        initialProblems, draftProblems, setInitialData,
        setEditingProblemId, saveProblem,
        updateDraftProblem, revertSingleProblem, startEditing
    } = useProblemPublishingStore();
    
    const problemUniqueIds = useMemo(() => initialProblems.map(p => p.uniqueId), [initialProblems]);
    const { selectedIds, toggleRow, clearSelection, setSelectedIds, toggleItems } = useRowSelection<string>({ allItems: problemUniqueIds });
    
    useEffect(() => {
        if (!isLoadingProblems && rawProblems.length > 0) {
            const typeOrder: Record<string, number> = { '객관식': 1, '주관식': 2, '서답형': 3, '논술형': 4 };
            const processed = [...rawProblems]
                .sort((a, b) => {
                    const sourceCompare = a.source.localeCompare(b.source);
                    if (sourceCompare !== 0) return sourceCompare;
                    const typeA_Rank = typeOrder[a.problem_type] || 99;
                    const typeB_Rank = typeOrder[b.problem_type] || 99;
                    if (typeA_Rank !== typeB_Rank) return typeA_Rank - typeB_Rank;
                    return a.question_number - b.question_number;
                })
                .map((p): ProcessedProblem => ({
                    ...p,
                    question_text: p.question_text ?? '',
                    solution_text: p.solution_text ?? '',
                    uniqueId: p.problem_id,
                    display_question_number: p.problem_type === '서답형' ? `서답형 ${p.question_number}` : String(p.question_number),
                }));
            setInitialData(processed);
        }
    }, [rawProblems, isLoadingProblems, setInitialData]);

    const displayProblems = useMemo(() => draftProblems ?? initialProblems, [draftProblems, initialProblems]);
    const selectedProblems = useMemo(() => displayProblems.filter(p => selectedIds.has(p.uniqueId)), [displayProblems, selectedIds]);
    
    const handleSaveProblem = useCallback(async (updatedProblem: ProcessedProblem) => {
        const payload = { ...updatedProblem };
        delete (payload as any).uniqueId;
        delete (payload as any).display_question_number;

        const savedData = await updateProblem({ id: payload.problem_id!, fields: payload });
        
        const processedSavedData: ProcessedProblem = {
            ...savedData,
            uniqueId: savedData.problem_id,
            display_question_number: savedData.problem_type === '서답형' ? `서답형 ${savedData.question_number}` : String(savedData.question_number)
        };
        saveProblem(processedSavedData);
    }, [updateProblem, saveProblem]);

    return {
        allProblems: displayProblems,
        isLoadingProblems,
        selectedProblems,
        selectedIds,
        setSelectedIds,
        toggleRow,
        toggleItems,
        clearSelection,
        isSavingProblem: updateProblemMutation.isPending,
        handleSaveProblem,
        handleLiveProblemChange: updateDraftProblem,
        handleRevertProblem: revertSingleProblem,
        startEditingProblem: startEditing,
        setEditingProblemId,
        deleteProblems, // [수정] 반환
        isDeletingProblems, // [수정] 반환
    };
}
----- ./react/features/problem-publishing/model/useProblemPublishingPage.ts -----
import { useCallback, useRef, useMemo, useState, useEffect } from 'react'; // [추가] useEffect 임포트
import { useProblemPublishing } from './useProblemPublishing';
import { useExamLayoutStore } from './examLayoutStore';
import { useExamLayoutManager } from './useExamLayoutManager';
import { useExamHeaderState } from '../hooks/useExamHeaderState';
import { useProblemEditor } from '../hooks/useProblemEditor';
import { useExamPreviewManager } from '../hooks/useExamPreviewManager';
import { usePublishingPageSetup } from '../hooks/usePublishingPageSetup';
import { useRowSelection } from '../../row-selection/model/useRowSelection';
import { usePdfGenerator, type PdfExportOptions } from '../hooks/usePdfGenerator';

export function useProblemPublishingPage() {
    const { allProblems, isLoadingProblems } = useProblemPublishing();
    const allProblemIds = useMemo(() => allProblems.map(p => p.uniqueId), [allProblems]);
    const { selectedIds, toggleRow, clearSelection, toggleItems, setSelectedIds } = useRowSelection({ allItems: allProblemIds });
    const selectedProblems = useMemo(() => allProblems.filter(p => selectedIds.has(p.uniqueId)), [allProblems, selectedIds]);
    
    const handleDeselectProblem = useCallback((uniqueId: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(uniqueId);
            return newSet;
        });
    }, [setSelectedIds]);

    const previewManager = useExamPreviewManager();
    useExamLayoutManager({ selectedProblems, problemBoxMinHeight: previewManager.problemBoxMinHeight });
    const { distributedPages, placementMap, distributedSolutionPages, solutionPlacementMap } = useExamLayoutStore();
    
    const { headerInfo, onHeaderUpdate, setHeaderInfo } = useExamHeaderState();
    const { onProblemClick } = useProblemEditor({ problemBoxMinHeight: previewManager.problemBoxMinHeight });
    usePublishingPageSetup({ selectedProblems, allProblems });

    useEffect(() => {
        if (selectedProblems.length > 0) {
            const newSource = selectedProblems[0].source || '정보 없음';
            setHeaderInfo(prev => ({
                ...prev,
                source: newSource
            }));
        } else {
            setHeaderInfo(prev => ({
                ...prev,
                source: '정보 없음'
            }));
        }
    }, [selectedProblems, setHeaderInfo]);

    const previewAreaRef = useRef<HTMLDivElement>(null);
    
    const { isGeneratingPdf, generatePdf, pdfProgress } = usePdfGenerator({
        previewAreaRef,
        getExamTitle: () => headerInfo.title,
        getSelectedProblemCount: () => selectedProblems.length,
    });

    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [pdfOptions, setPdfOptions] = useState<PdfExportOptions>({
        includeProblems: true,
        includeAnswers: true,
        includeSolutions: false,
    });

    const handlePdfOptionChange = useCallback((option: keyof PdfExportOptions) => {
        setPdfOptions(prev => ({ ...prev, [option]: !prev[option] }));
    }, []);

    const handleOpenPdfModal = useCallback(() => {
        if (selectedProblems.length === 0) {
            alert('PDF로 출력할 문제가 선택되지 않았습니다.');
            return;
        }
        setIsPdfModalOpen(true);
    }, [selectedProblems.length]);
    
    const handleConfirmPdfDownload = useCallback(() => {
        setIsPdfModalOpen(false);
        setTimeout(() => {
            generatePdf(pdfOptions);
        }, 100);
    }, [generatePdf, pdfOptions]);
    
    return {
        allProblems,
        isLoadingProblems,
        selectedProblems,
        selectedIds,
        toggleRow,
        toggleItems,
        clearSelection,
        distributedPages,
        placementMap,
        distributedSolutionPages,
        solutionPlacementMap,
        headerInfo,
        onHeaderUpdate,
        onProblemClick,
        handleDeselectProblem,
        
        isGeneratingPdf,
        onDownloadPdf: handleOpenPdfModal,
        pdfProgress,
        previewAreaRef,
        ...previewManager,

        isPdfModalOpen,
        onClosePdfModal: () => setIsPdfModalOpen(false),
        pdfOptions,
        onPdfOptionChange: handlePdfOptionChange,
        onConfirmPdfDownload: handleConfirmPdfDownload,
    };
}
----- ./react/features/problem-publishing/model/useProblemSelection.ts -----
import { useState, useMemo, useCallback } from 'react';
import type { ProcessedProblem } from './problemPublishingStore';
import { useTableSearch } from '../../table-search/model/useTableSearch';
import { useRowSelection } from '../../row-selection/model/useRowSelection';

export function useProblemSelection(sourceProblems: ProcessedProblem[]) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({});
    
    const [startNumber, setStartNumber] = useState('');
    const [endNumber, setEndNumber] = useState('');
    const [problemTypeFilter, setProblemTypeFilter] = useState('all');

    const problemUniqueIds = useMemo(() => sourceProblems.map(p => p.uniqueId), [sourceProblems]);

    const {
        selectedIds,
        setSelectedIds,
        toggleRow,
        toggleItems,
        clearSelection
    } = useRowSelection<string>({ allItems: problemUniqueIds });

    const problemsFilteredByCustomControls = useMemo(() => {
        let items = [...sourceProblems];

        if (problemTypeFilter !== 'all') {
            items = items.filter(item => item.problem_type === problemTypeFilter);
        }

        const numStart = parseInt(startNumber, 10);
        const numEnd = parseInt(endNumber, 10);
        const isStartValid = !isNaN(numStart);
        const isEndValid = !isNaN(numEnd);

        if (isStartValid || isEndValid) {
            items = items.filter(item => {
                const qNum = item.question_number;
                if (isStartValid && isEndValid) {
                    return qNum >= numStart && qNum <= numEnd;
                }
                if (isStartValid) {
                    return qNum >= numStart;
                }
                if (isEndValid) {
                    return qNum <= numEnd;
                }
                return true;
            });
        }
        
        return items;
    }, [sourceProblems, startNumber, endNumber, problemTypeFilter]);


    const filteredProblems = useTableSearch({
        data: problemsFilteredByCustomControls,
        searchTerm,
        searchableKeys: ['display_question_number', 'source', 'grade', 'semester', 'major_chapter_id', 'middle_chapter_id', 'core_concept_id', 'problem_category'],
        activeFilters,
    }) as ProcessedProblem[];

    const filteredProblemIds = useMemo(() => new Set(filteredProblems.map(p => p.uniqueId)), [filteredProblems]);
    const hasActiveSearchOrFilter = searchTerm.trim() !== '' || Object.keys(activeFilters).length > 0 || startNumber !== '' || endNumber !== '' || problemTypeFilter !== 'all';

    const isAllSelected = useMemo(() => {
        if (!hasActiveSearchOrFilter || filteredProblems.length === 0) return false;
        return filteredProblems.every(p => selectedIds.has(p.uniqueId));
    }, [filteredProblems, selectedIds, hasActiveSearchOrFilter]);

    const handleToggleAll = useCallback(() => {
        toggleItems(Array.from(filteredProblemIds));
    }, [filteredProblemIds, toggleItems]);

    const handleFilterChange = useCallback((key: string, value: string) => {
        setActiveFilters(prev => {
            const newFilters = { ...prev };
            const currentSet = new Set(newFilters[key] || []);
            currentSet.has(value) ? currentSet.delete(value) : currentSet.add(value);
            if (currentSet.size === 0) delete newFilters[key]
            else newFilters[key] = currentSet;
            return newFilters;
        });
    }, []);

    const handleResetFilters = useCallback(() => {
      setActiveFilters({});
      setSearchTerm('');
      setSelectedIds(new Set());
      setStartNumber('');
      setEndNumber('');
      setProblemTypeFilter('all');
    }, [setSelectedIds]);

    const handleResetHeaderFilters = useCallback(() => {
        setStartNumber('');
        setEndNumber('');
        setProblemTypeFilter('all');
    }, []);


    return {
        searchTerm,
        setSearchTerm,
        activeFilters,
        handleFilterChange,
        handleResetFilters,
        selectedIds,
        clearSelection,
        toggleRow,
        handleToggleAll,
        isAllSelected,
        filteredProblems,
        startNumber,
        setStartNumber,
        endNumber,
        setEndNumber,
        problemTypeFilter,
        setProblemTypeFilter,
        handleResetHeaderFilters, // [신규] 부분 초기화 함수 반환
    };
}
----- ./react/features/problem-text-editing/ui/ProblemMetadataEditor.tsx -----
import React, { useState } from 'react';
import type { Problem, ComboboxOption } from '../../../entities/problem/model/types';
import GlassPopover from '../../../shared/components/GlassPopover';
import { PopoverCombobox } from '../../json-problem-importer/ui/EditPopoverContent';
import { LuChevronsUpDown } from 'react-icons/lu';

const GRADE_OPTIONS: ComboboxOption[] = ['초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'].map(g => ({ value: g, label: g }));
const SEMESTER_OPTIONS: ComboboxOption[] = ['1학기', '2학기', '공통'].map(s => ({ value: s, label: s }));
const DIFFICULTY_OPTIONS: ComboboxOption[] = ['최상', '상', '중', '하', '최하'].map(d => ({ value: d, label: d }));
const TYPE_OPTIONS: ComboboxOption[] = ['객관식', '서답형', '논술형'].map(t => ({ value: t, label: t }));

const ANSWER_OPTIONS: ComboboxOption[] = ['①', '②', '③', '④', '⑤', '⑥'].map(a => ({ value: a, label: a }));

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
        const isAnswerCombobox = field === 'answer' && problemData.problem_type === '객관식';
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
                const isAnswerCombobox = field === 'answer' && problemData.problem_type === '객관식';
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
                                value={String(currentValue)} // [수정] 항상 문자열로 변환하여 제어 컴포넌트 경고 방지
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
                        options={SELECT_OPTIONS_MAP[popoverTargetField]}
                    />
                )}
            </GlassPopover>
        </div>
    );
};

export default ProblemMetadataEditor;
----- ./react/features/problem-text-editing/ui/ProblemTextEditor.tsx -----
import React, { useCallback, useEffect, useState } from 'react';
import type { Problem } from '../../../entities/problem/model/types';
import Editor from '../../../shared/ui/codemirror-editor/Editor';
import LoadingButton from '../../../shared/ui/loadingbutton/LoadingButton';
import ActionButton from '../../../shared/ui/actionbutton/ActionButton';
import { LuCheck, LuUndo2, LuTrash2 } from 'react-icons/lu';
import ProblemMetadataEditor from './ProblemMetadataEditor';
import Modal from '../../../shared/ui/modal/Modal';
import { useDeleteProblemsMutation } from '../../../entities/problem/model/useProblemMutations';
import './ProblemTextEditor.css';

const EDITABLE_METADATA_FIELDS: (keyof Problem)[] = [
    'question_number', 'source', 'grade', 'semester', 'major_chapter_id', 
    'middle_chapter_id', 'core_concept_id', 'problem_category', 
    'difficulty', 'score', 'answer', 'page', 'problem_type'
];

type ProcessedProblem = Problem & { uniqueId: string; display_question_number: string; };

interface ProblemTextEditorProps {
    problem: ProcessedProblem;
    isSaving?: boolean;
    onSave: (updatedProblem: ProcessedProblem) => void;
    onRevert: (problemId: string) => void; 
    onClose: () => void;
    onProblemChange: (updatedProblem: ProcessedProblem) => void;
}

const ProblemTextEditor: React.FC<ProblemTextEditorProps> = ({ 
    problem, 
    isSaving = false,
    onSave, 
    onRevert,
    onClose,
    onProblemChange,
}) => {
    const [localQuestionText, setLocalQuestionText] = useState(problem.question_text ?? '');
    const [localSolutionText, setLocalSolutionText] = useState(problem.solution_text ?? '');
    const [localProblemData, setLocalProblemData] = useState(problem);
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const { mutate: deleteProblem, isPending: isDeleting } = useDeleteProblemsMutation();

    useEffect(() => {
        setLocalQuestionText(problem.question_text ?? '');
        setLocalSolutionText(problem.solution_text ?? '');
        setLocalProblemData(problem);
    }, [problem]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (problem.question_text !== localQuestionText || problem.solution_text !== localSolutionText) {
                onProblemChange({ 
                    ...localProblemData, 
                    question_text: localQuestionText,
                    solution_text: localSolutionText
                });
            }
        }, 300); // 300ms 디바운스

        return () => {
            clearTimeout(handler);
        };
    }, [localQuestionText, localSolutionText, onProblemChange, problem, localProblemData]);
    
    const handleMetadataChange = useCallback((field: keyof Problem, value: string | number) => {
        const updatedProblem = { ...localProblemData, [field]: value };
        setLocalProblemData(updatedProblem);
        onProblemChange(updatedProblem);
    }, [localProblemData, onProblemChange]);

    const handleSave = () => {
        onSave({ 
            ...localProblemData, 
            question_text: localQuestionText,
            solution_text: localSolutionText 
        });
    };

    const handleRevert = () => {
        onRevert(problem.uniqueId);
    };

    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        deleteProblem([problem.problem_id], {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                onClose(); 
            },
            onError: () => {
                setIsDeleteModalOpen(true); 
            }
        });
    };

    return (
        <>
            <div className="problem-text-editor-container">
                <div className="editor-header">
                    <h4 className="editor-title">{problem.display_question_number}번 문제 수정</h4>
                    <div className="editor-actions">
                        <ActionButton onClick={handleRevert} aria-label="변경사항 초기화" disabled={isSaving || isDeleting}>
                            <LuUndo2 size={14} className="action-icon" />
                            초기화
                        </ActionButton>
                        
                        <LoadingButton
                            onClick={handleDeleteClick}
                            className="destructive"
                            aria-label="문제 영구 삭제"
                            isLoading={isDeleting}
                            disabled={isSaving}
                            loadingText="삭제중..."
                        >
                            <LuTrash2 size={14} className="action-icon" />
                            영구 삭제
                        </LoadingButton>

                        <LoadingButton 
                            onClick={handleSave} 
                            className="primary" 
                            aria-label="변경사항 저장"
                            isLoading={isSaving}
                            disabled={isDeleting}
                            loadingText="저장중..."
                        >
                            <LuCheck size={14} className="action-icon" />
                            저장
                        </LoadingButton>
                    </div>
                </div>
                
                <div className="editor-body-wrapper">
                    <div className="editor-section">
                        <h5 className="editor-section-title">문제 본문</h5>
                        <div className="editor-wrapper-body">
                            <Editor 
                                initialContent={localQuestionText}
                                onContentChange={setLocalQuestionText}
                            />
                        </div>
                    </div>

                    <ProblemMetadataEditor
                        fields={EDITABLE_METADATA_FIELDS}
                        problemData={localProblemData}
                        onDataChange={handleMetadataChange}
                    />

                    <div className="editor-section">
                        <h5 className="editor-section-title">해설</h5>
                        <div className="editor-wrapper-body">
                            <Editor
                                initialContent={localSolutionText}
                                onContentChange={setLocalSolutionText}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                isConfirming={isDeleting}
                title="문제 영구 삭제 확인"
                confirmText="삭제"
                size="small"
            >
                <p>
                    정말로 이 문제를 영구적으로 삭제하시겠습니까?
                    <br />
                    이 작업은 되돌릴 수 없습니다.
                </p>
            </Modal>
        </>
    );
};

export default React.memo(ProblemTextEditor);
----- ./react/features/prompt-collection/model/usePromptManager.ts -----
import { useState, useEffect, useCallback } from 'react';
import { produce } from 'immer';

export interface Prompt {
    id: string;
    title: string;
    content: string;
}

const defaultPrompts: Prompt[] = [
    {
        id: 'default-1',
        title: '문제 작업',
        content: `**당신은 수학 시험지 스캔본(이미지 또는 PDF)을 보고 내용을 정확하게 타이핑하는 전문가입니다.**

**지시사항:**

1.  **입력:** 처리할 수학 문제의 스캔 이미지 또는 PDF 페이지를 받습니다.
2.  **작업:**
    *   문제 번호(**사이에 번호작성), 문제 본문, 보기(객관식), 배점 등 문제와 직접 관련된 텍스트만 'code block'에
 타이핑합니다. (정답, 해설은 이 단계에서 제외)
    *   **수학 기호, 숫자, 변수는 즉시 LaTeX 문법으로 변환하여 '$' 기호 사이에 작성합니다. 분수는 윗첨자나 아랫 첨자가 아닌 경우에는 /dfrac으로 표현합니다.** (예: 3x + 5 -> '$3x+5$', 분수 1/2 -> '$\\dfrac{1}{2}$')
    *   LaTeX 변환 규칙:
        *   모든 수학적 표현 (숫자, 변수, 기호)은 '$...$' 안에 넣습니다.
        *   분수는 기본적으로 '\\dfrac' 사용 (예: '$\\dfrac{a+b}{c}$'). 지수/첨자 등 작은 분수는 '\\frac' 사용 (예: '$e^{\\frac{1}{2}}$').
        *   모든 수식은 displaystyle로 작성합니다. 기호 앞에 '\\displaystyle'를 붙이거나 \\dfrac사용. (예: '$\\displaystyle\\lim_{n \\to \\infty}$', '$\\displaystyle\\int_{a}^{b}$')
        *   작은 네모 박스 안 텍스트는 '$\\fbox{   텍스트   }$' 형식으로 작성합니다. (예: '$\\fbox{   (가)   }$')
    *   **이미지가 들어가야 할 위치에는 '***이미지N***' (N은 숫자) 형식으로 표시합니다.**
    *   개념 설명 등 문제 자체가 아닌 부분은 타이핑하지 않습니다.
3.  **출력:** LaTeX 가 적용된 문제 텍스트 문자열을 반환합니다. (JSON 형식이 아님)

**예시 작업:다음과 같은 결과물이 나오면 됩니다. 위 라텍스 규칙에 맞춰 작성하고, 문제와 보기사이는 <br> +엔터 으로 띄워쓰고 보기와 보기 사이에는 띄워쓰기가 필요하면"$amp;emsp;"를 한 번 또는 두 번 입력하면 됩니다. <br> 다음에는 "엔터"를 써서 <br>과 문제 사이에 빈줄이 오도록 합니다. [$3.8$점]앞에도
"문제 ... 
[$3.8$점]" 이런 식으로 [$3.8$점]앞에 엔터를 한 번 입력합니다.**


1 수열 \${a_n}이 모든 자연수 $n$에 대하여 $a_{n+1} = 2a_n$을 만족시킨다. $a_2 = 4$일 때, $a_8$의 값은?
[$3.8$점]

<br>

① $16$ 	&emsp;② $32$ 	&emsp;③ $64$ 	&emsp;④ $128$ 	&emsp;⑤ $256$

2 제$2$항이 $-6$, 제$10$항이 $26$인 등차수열의 제$6$항은?
[$3.8$점]

<br>

① $9$ &emsp;&emsp;② $10$ &emsp;&emsp;③ $11$ &emsp;&emsp;④ $12$ &emsp;&emsp;⑤ $13$


**박스 작성 요령 : 작은 박스는 '$과 $ 사이에 라텍스 수식으로 $\\fbox{   (가)   }$' 이런 식으로 작성하면 되고 큰 글상자는 아래 라텍스 문법에 맞춰 작성해주면 됩니다.**

3 다음은 $n \\ge 5$인 모든 자연수 $n$에 대하여 부등식 $2^n > n^2 \\cdots (\\star)$이 성립함을 수학적 귀납법으로 증명한 것이다.
\\begin{tabular}{|l|}\\hline
(i) $n=$ $\\fbox{  A  }$ 이면 (좌변)= $\\fbox{ B }$  >  $\\fbox{ C }$ $=$(우변)이므로 $(\\star)$이 성립한다.<br><br>
 (ii) $n=k(k \\ge 5)$일 때 $(\\star)$는 성립한다고 가정하면 $2^k > k^2$이다.
 양변에 $\\fbox{ D }$ 를 곱하면 $2^{k+1} >  \\fbox{ D } k^2$이다.
<br>이때, $f(k) =  \\fbox{ D } k^2 - (k+1)^2$이라 하면 $f(k)$의 최솟값은 $\\fbox{ E }$ 이므로 $f(k) > 0$이다.
즉, $2^{k+1} > (k+1)^2$이다.
따라서 $n=k+1$일 때도 $(\\star)$는 성립한다.<br><br>
 (i), (ii)에 의하여 $n \\ge 5$인 모든 자연수 $n$에 대하여 $(\\star)$은 성립한다.\\\\
 \\hline
\\end{tabular}

위의 $A, B, C, D, E$ 에 알맞은 수를 각각 $a, b, c, d, e$라 할 때, $a+b+c+d+e$의 값은?
[$4.6$점]

<br>

① $64$ 	&emsp;&emsp;② $71$ 	&emsp;&amp;emsp;③ $78$ 	&emsp;&emsp;④ $82$ 	&emsp;&emsp;⑤ $86$


**이미지가 들어갈 자리엔 다음처럼 내가 이미지 url로 바꿀꺼야 따라서 당신은 이미지가 들어갈 자리에 '***이미지N***'이라고 잘 작성해 줘야 합니다.

4 똑같은 성냥개비를 사용하여 그림과 같은 모양을 계속 만들려고 한다. $n$단계의 모양을 만드는 데 필요한 성냥개비의 개수를 $a_n$이라고 할 때, $a_n$과 $a_{n+1}$ 사이의 관계식을 $a_{n+1} = a_n + f(n)$이라 하자. $f(5)$의 값은?
[$4.3$점]
***이미지1***

<br>

① $10$ &emsp;&emsp;② $13$ &emsp;&emsp;③ $14$ &emsp;&emsp;④ $17$ &emsp;&emsp;⑤ $18$`
    },
    {
        id: 'default-2',
        title: '해설 작업',
        content: `**당신은 수학 문제 풀이 전문가입니다.**

**지시사항:**

1.  **입력:** LaTeX로 변환된 문제 텍스트 json을 받습니다. 
2.  **작업:**
    *   입력된 문제의 **정답**을 찾거나 생성합니다.
        *   객관식: 보기 번호 (예: '③') 또는 기호.
        *   주관식: 숫자, 식, 단어 등 문제에서 요구하는 형태의 답.(수학 기호 같은 경우는 라텍스 문법으로 표현)
    *   문제에 대한 **상세하고 단계적인 해설**을 작성합니다.
        *   해설 내의 모든 수학 기호, 숫자, 변수는 입력값과 동일한 LaTeX 규칙('$', '\\dfrac', '\\displaystyle' 등)을 사용하여 작성합니다. 수학 수식이 너무 가로로 길지 않게 줄바꿈을 잘 활용해서 작성해주세요. 수식 줄바꿈은 "$수식A 수식B$"라고 하면
        "$수식A$ (여기서 엔터 누르고)
        $수식B$" 이런 식으로 작성하면 됩니다. 그러면 수식이 두줄로 나옵니다.
        *   **수학 기호, 숫자, 변수는 즉시 LaTeX 문법으로 변환하여 '$' 기호 사이에 작성합니다. 분수는 윗첨자나 아랫 첨자가 아닌 경우에는 /dfrac으로 표현합니다.** (예: 3x + 5 -> '$3x+5$', 분수 1/2 -> '$\\dfrac{1}{2}$')
    *   LaTeX 변환 규칙:
        *   모든 수학적 표현 (숫자, 변수, 기호)은 '$...$' 안에 넣습니다.
        *   분수는 기본적으로 '\\dfrac' 사용 (예: '$\\dfrac{a+b}{c}$'). 지수/첨자 등 작은 분수는 '\\frac' 사용 (예: '$e^{\\frac{1}{2}}$').
        *   모든 수식은 displaystyle로 작성합니다. 기호 앞에 '\\displaystyle'를 붙이거나 \\dfrac사용. (예: '$\\displaystyle\\lim_{n \\to \\infty}$', '$\\displaystyle\\int_{a}^{b}$')
        *   작은 네모 박스 안 텍스트는 '\$\\fbox{텍스트}$' 형식으로 작성합니다. (예: '\$\\fbox{  가  }$')
        * 난이도는 최하, 하, 중, 상, 최상 중 하나로 작성합니다. 해설을 보면 난이도도 알 수 있죠? 즉 당신이 수정할 수 있는 칼럼은 정답, 해설, 난이도입니다.
    *   만약 정답이나 해설 생성이 불가능하거나 원본에 없다면, '정답 없음' 또는 '해설 생성 불가' 와 같이 명확히 표시하거나 'null'에 해당하는 값을 준비합니다.
    * 코드블럭에 결과물을 작성합니다.

**예시 작업:**

*   **출력:**
    {
  "problems": [
    {
      "problem_id": "244919dc-a659-457f-8a5d-37a2aa89e5b5",
      "question_number": 1,
      "problem_type": "객관식",
      "question_text": "수열 \${a_n}$이 모든 자연수 $n$에 대하여 $a_{n+1} = 2a_n$을 만족시킨다. $a_2 = 4$일 때, $a_8$의 값은? \\n[$3.8$점] \\n <br> \\n ① $16$ &emsp;② $32$ &emsp;③ $64$ &emsp;④ $128$ &emsp;⑤ $256$",
      "answer": "⑤",
      "solution_text": "주어진 점화식 $a_{n+1} = 2a_n$은 수열 \${a_n}$이 공비가 $2$인 등비수열임을 의미합니다. 제$2$항 $a_2=4$이므로 제$8$항 $a_8$은 $a_8 = a_2 \\\\times r^{8-2} = a_2 \\\\times 2^6$으로 구할 수 있습니다. 따라서 $a_8 = 4 \\\\times 2^6$ \\n$= 2^2 \\\\times 2^6 = 2^8 = 256$입니다.",
      "page": null,
      "grade": "고2",
      "semester": "1학기",
      "source": "2022학년도 계양고등학교 2학년 1학기 기말고사",
      "major_chapter_id": "수열",
      "middle_chapter_id": "등비수열",
      "core_concept_id": "등비수열의 일반항",
      "problem_category": "등비수열의 특정 항 구하기",
      "difficulty": "중",
      "score": "3.8점"
    },
    {
      "problem_id": "ef5dd5a4-b6c4-4c3e-b026-3ded9d00cac6",
      "question_number": 4,
      "problem_type": "서답형",
      "question_text": "그림과 같이 모선의 길이가 $6$이고 밑면의 반지름이 $2$인 원뿔이 있다. 원뿔의 밑면인 원의 둘레 위의 점 P에서 모선 OP의 중점 Q까지 원뿔의 표면을 따라서 길을 표시하고자 할 때, 표시된 길의 최단 거리를 구하는 풀이 과정과 답을 작성하시오. [$6$점]\\n![](https://pub-f13c8ed5c4ed4bf990ca088c26785c34.r2.dev/704cdb31-88e3-4ed5-8148-eb435f79320e.png)",
      "answer": "$3\\\\sqrt{7}$",
      "solution_text": "원뿔 표면을 따르는 최단 거리는 원뿔의 전개도에서 직선 거리와 같습니다.\\n\\n1. **전개도 그리기**\\n   원뿔을 펼치면 모선의 길이가 반지름이 되는 부채꼴이 됩니다. \\n   - 부채꼴의 반지름(R): 원뿔의 모선의 길이와 같으므로 $R = 6$ 입니다.\\n   - 부채꼴의 호의 길이(l): 원뿔 밑면의 둘레와 같으므로 $l = 2\\\\pi r = 2\\\\pi(2) = 4\\\\pi$ 입니다.\\n\\n2. **부채꼴의 중심각($\\\\theta$) 구하기**\\n   부채꼴의 호의 길이 공식 $l = R\\\\theta$ 를 이용합니다.\\n   $4\\\\pi = 6 \\\\times \\\\theta \\implies \\\\theta = \\\\dfrac{4\\\\pi}{6} = \\\\dfrac{2\\\\pi}{3}$ (또는 $120^\\\\circ$)\\n\\n3. **전개도에서 점 P와 Q의 위치 파악**\\n   '밑면 둘레 위의 점 P'는 전개도에서 부채꼴의 호 위에 있는 한 점입니다. 전개도를 만들기 위해 모선 OP를 따라 잘랐다고 생각하면, 점 P는 부채꼴의 양쪽 끝 반지름(OP와 OP') 중 한 곳에 위치하게 됩니다.\\n   '모선 OP의 중점 Q'는 이 모선(반지름 OP)의 중점이 됩니다.\\n   최단 경로는 점 P에서 출발하여 원뿔 표면을 한 바퀴 돌아 다시 원래의 모선 OP의 중점 Q로 오는 경로를 의미합니다. 전개도 상에서는 한쪽 끝점 P'에서 다른 쪽 반지름 OP 위의 중점 Q까지의 직선 거리를 구하는 것과 같습니다.\\n\\n   따라서 우리는 꼭짓점이 O이고, 변이 OP', OQ인 삼각형 OP'Q에서 변 P'Q의 길이를 구하면 됩니다.\\n   - $\\\\overline{OP'} = 6$ (부채꼴의 반지름)\\n   - $\\\\overline{OQ} = \\\\dfrac{6}{2} = 3$ (모선의 중점)\\n   - $\\\\angle P'OQ = \\\\theta = \\\\dfrac{2\\\\pi}{3}$\\n\\n4. **최단 거리 계산 (코사인법칙 이용)**\\n   삼각형 OP'Q에 코사인법칙을 적용하여 $\\\\overline{P'Q}$의 길이를 구합니다.\\n   $\\\\overline{P'Q}^2 = \\\\overline{OP'}^2 + \\\\overline{OQ}^2 - 2(\\\\overline{OP'})(\\\\overline{OQ})\\\\cos\\\\theta$\\n   $\\\\overline{P'Q}^2 = 6^2 + 3^2 - 2(6)(3)\\\\cos(\\\\dfrac{2\\\\pi}{3})$\\n   $\\\\cos(\\\\dfrac{2\\\\pi}{3}) = -\\\\dfrac{1}{2}$ 이므로,\\n   $\\\\overline{P'Q}^2 = 36 + 9 - 36(-\\\\dfrac{1}{2}) = 45 + 18 = 63$\\n   $\\\\overline{P'Q} = \\\\sqrt{63} = \\\\sqrt{9 \\\\times 7} = 3\\\\sqrt{7}$\\n\\n   따라서 최단 거리는 $3\\\\sqrt{7}$ 입니다.",
      "page": null,
      "grade": "고2",
      "semester": "1학기",
      "source": "2022학년도 계양고등학교 2학년 1학기 기말고사",
      "major_chapter_id": "삼각함수의 활용",
      "middle_chapter_id": "도형에서의 활용",
      "core_concept_id": "원뿔의 전개도를 이용한 최단 거리",
      "problem_category": "입체도형 표면의 최단 거리",
      "difficulty": "중",
      "score": "6점"
    }
  ]
}

##작업할 파일은 아래에 있습니다. 문제 텍스트의 라텍스 규칙에 맞춰서 해설과 정답칸, 난이도칸을 채워주고 다른 칼럼의 데이터는 원본 그대로 보존해주세요.
    `
    },
    {
        id: 'default-3',
        title: '문제 개별화 작업',
        content: `**당신은 텍스트 데이터를 분석하여 아래 제공된 JSON 스키마 구조에 맞게 정리하는 데이터 구조화 전문가입니다.**

**지시사항:**

1.  **입력:**
    *   'problem_text_latex': 1단계에서 생성된 LaTeX 형식의 문제 텍스트.
    *   'answer_string': (null가능).
    *   'solution_string_latex': 데이터가 있으면 쓰고 없으면 null (또는 null).
    *   (선택) 'page', 'grade', 'source' 등 파악 가능한 추가 정보.
    *   **참조:** 아래 'edit code'로 제공되는 JSON 스키마.

2.  **작업:**
    *   **[중요] \`question_number\` 및 \`problem_type\` 처리:**
        *   원본 문제 번호가 "서답형 1"과 같이 텍스트와 숫자가 섞여 있으면, **JSON의 \`question_number\`에는 숫자 \`1\`만, \`problem_type\`에는 "서답형"을 입력**합니다.
        *   원본 문제 번호가 그냥 숫자 "5.1"이면, \`question_number\`에 \`5.1\`을 입력하고, 문제에 선택지가 있으면 \`problem_type\`을 "객관식", 없으면 "서답형"으로 설정합니다.
    *   **[중요] \`question_text\` 필드 처리:**
        *   **\`question_text\` 필드에는 문제의 질문 본문과 객관식 선택지를 모두 포함**시켜야 합니다.
    *   **[중요] Null 값 처리:**
        *   만약 정답이나 해설이 없다면, \`answer\`와 \`solution_text\` 필드 값은 반드시 **null**로 설정해주세요. (빈 문자열 ""이 아님)
    *   **[중요] 문제와 보기 사이에는 "\\n <br> \\n"을 넣어서 빈 줄을 만듭니다. <br> 다음에 \\n을 넣어야 줄바꿈이 제대로 입력됩니다.
    *   **보기와 보기 사이에는 "&emsp;"를 한 번 또는 두 번 써서 적당히 여백을 만듭니다.
    *   ** score를 필드에 입력했으면 문제 텍스트의 점수부분은 제거합니다.(문제 텍스트는 무결성이 중요하니까 다른 부분은 건드리지 않습니다.)
    *   **메타데이터 추론:** \`major_chapter_id\`, \`middle_chapter_id\`, \`core_concept_id\`, \`problem_category\` 필드는 문제 내용과 해설을 분석하여 가장 관련성 높은 **단일 문자열 값**을 추론하여 채웁니다. (예: "미적분", "이차함수")

3.  **출력:** 아래 'edit code'의 JSON 스키마 **구조**를 준수하는 JSON 객체 문자열.

**예시 (스키마 반영):**
\`\`\`json
{
  "problems": [
    {
      "question_number": 1,
      "problem_type": "객관식",
      "question_text": "세 수 $6, x, \\\\dfrac{3}{8}$이 이 순서대로 등비수열일 때, $x^2$의 값은? \\n[$3.4$점]\\n <br> \\n① $\\\\dfrac{3}{2}$ &emsp;&emsp;② $\\\\dfrac{9}{4}$ &emsp;&emsp;③ $3$ &emsp;&emsp;④ $9$ &emsp;&emsp;⑤ $27$",
      "answer": null,
      "solution_text": null,
      "page": null,
      "grade": "고2",
      "semester": "1학기",
      "source": "2024학년도 서운고등학교 2학년 1학기 기말고사",
      "major_chapter_id": "수열",
      "middle_chapter_id": "등비수열",
      "core_concept_id": "등비중항",
      "problem_category": "등비중항을 이용한 값 구하기",
      "difficulty": "중",
      "score": "3.4점"
    },
    {
      "question_number": 2,
      "problem_type": "객관식",
      "question_text": "제2항이 $19$, 제5항이 $10$인 등차수열 \${a_n}$의 제10항은? [$3.5$점]\\n <br> \\n① $1$ &emsp;&emsp;② $-1$ &emsp;&emsp;③ $-3$ &emsp;&emsp;④ $-5$ &emsp;&emsp;⑤ $-7$",
      "answer": null,
      "solution_text": null,
      "page": null,
      "grade": "고2",
      "semester": "1학기",
      "source": "2024학년도 서운고등학교 2학년 1학기 기말고사",
      "major_chapter_id": "수열",
      "middle_chapter_id": "등차수열",
      "core_concept_id": "등차수열의 일반항",
      "problem_category": "등차수열의 특정 항 구하기",
      "difficulty": "중",
      "score": "3.5점"
    }
    ]
}
\`\`\`
    
  ##실제 작업할 문제는 아래에\`
    `
    }
];

const STORAGE_KEY = 'promptCollection';

export function usePromptManager() {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [editingContent, setEditingContent] = useState('');
    const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null);

    useEffect(() => {
        let initialPrompts: Prompt[] = [];
        try {
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                initialPrompts = JSON.parse(storedData);
                defaultPrompts.forEach(defaultPrompt => {
                    if (!initialPrompts.some((p: Prompt) => p.id === defaultPrompt.id)) {
                        initialPrompts.unshift(defaultPrompt);
                    }
                });
            } else {
                initialPrompts = [...defaultPrompts];
            }
        } catch (error) {
            console.error("Failed to load prompts from localStorage", error);
            initialPrompts = [...defaultPrompts];
        }
        
        setPrompts(initialPrompts);
        setExpandedPromptId(null);
    }, []);

    useEffect(() => {
        if (prompts.length > 0) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
            } catch (error) {
                console.error("Failed to save prompts to localStorage", error);
            }
        } else {
             localStorage.removeItem(STORAGE_KEY);
        }
    }, [prompts]);

    const addPrompt = useCallback(() => {
        const newPrompt: Prompt = {
            id: `prompt-${Date.now()}`,
            title: '새 프롬프트',
            content: '여기에 프롬프트 내용을 작성하세요.'
        };
        const nextPrompts = produce(prompts, draft => {
            draft.push(newPrompt);
        });
        setPrompts(nextPrompts);
        setEditingPromptId(newPrompt.id);
        setEditingTitle(newPrompt.title);
        setEditingContent(newPrompt.content);
        setExpandedPromptId(newPrompt.id);
    }, [prompts]);

    const deletePrompt = useCallback((idToDelete: string) => {
        if (idToDelete.startsWith('default-')) {
            alert('기본 프롬프트는 삭제할 수 없습니다.');
            return;
        }
        if (window.confirm("정말로 이 프롬프트를 삭제하시겠습니까?")) {
            setPrompts(prev => prev.filter(p => p.id !== idToDelete));
        }
    }, []);
    
    const resetDefaultPrompt = useCallback((idToReset: string) => {
        const originalPrompt = defaultPrompts.find(p => p.id === idToReset);
        if (!originalPrompt || !window.confirm('이 프롬프트를 기본값으로 되돌리시겠습니까? 변경사항은 사라집니다.')) {
            return;
        }
        
        const nextPrompts = produce(prompts, draft => {
            const promptToReset = draft.find(p => p.id === idToReset);
            if (promptToReset) {
                promptToReset.title = originalPrompt.title;
                promptToReset.content = originalPrompt.content;
            }
        });
        setPrompts(nextPrompts);
    }, [prompts]);
    
    const startEditing = useCallback((prompt: Prompt) => {
        setEditingPromptId(prompt.id);
        setEditingTitle(prompt.title);
        setEditingContent(prompt.content);
        setExpandedPromptId(prompt.id);
    }, []);

    const cancelEditing = useCallback(() => {
        setEditingPromptId(null);
        setEditingTitle('');
        setEditingContent('');
    }, []);

    const saveEditing = useCallback(() => {
        if (!editingPromptId) return;
        
        const nextPrompts = produce(prompts, draft => {
            const promptToUpdate = draft.find(p => p.id === editingPromptId);
            if (promptToUpdate) {
                promptToUpdate.title = editingTitle.trim() || '제목 없음';
                promptToUpdate.content = editingContent;
            }
        });
        setPrompts(nextPrompts);
        cancelEditing();
    }, [editingPromptId, editingTitle, editingContent, prompts, cancelEditing]);

    const toggleExpand = useCallback((id: string) => {
        if (editingPromptId && editingPromptId !== id) return;
        setExpandedPromptId(prevId => (prevId === id ? null : id));
    }, [editingPromptId]);

    return {
        prompts,
        editingPromptId,
        editingTitle,
        setEditingTitle,
        editingContent,
        setEditingContent,
        expandedPromptId,
        toggleExpand,
        addPrompt,
        deletePrompt,
        resetDefaultPrompt,
        startEditing,
        cancelEditing,
        saveEditing,
    };
}
----- ./react/features/prompt-collection/ui/PromptCollection.tsx -----
import React from 'react';
import { LuCirclePlus } from 'react-icons/lu';
import { usePromptManager } from '../model/usePromptManager';
import PromptMemo from './PromptMemo';
import './PromptCollection.css';

interface PromptCollectionProps {
    workbenchContent?: string;
}

const PromptCollection: React.FC<PromptCollectionProps> = ({ workbenchContent }) => {
    const {
        prompts,
        editingPromptId,
        editingTitle,
        setEditingTitle,
        editingContent,
        setEditingContent,
        expandedPromptId,
        toggleExpand,
        addPrompt,
        deletePrompt,
        resetDefaultPrompt,
        startEditing,
        cancelEditing,
        saveEditing
    } = usePromptManager();

    return (
        <div className="prompt-collection-container">
            <div className="prompt-collection-header">
                <h4 className="prompt-collection-title">프롬프트 모음</h4>
            </div>
            <div className="add-prompt-section">
                <button onClick={addPrompt} className="add-prompt-button">
                    <LuCirclePlus size={16} />
                    <span>새 프롬프트 추가</span>
                </button>
            </div>

            <div className="prompt-list">
                {prompts.map(prompt => (
                    <PromptMemo
                        key={prompt.id}
                        prompt={prompt}
                        isEditing={editingPromptId === prompt.id}
                        isExpanded={expandedPromptId === prompt.id}
                        editingTitle={editingTitle}
                        onSetEditingTitle={setEditingTitle}
                        editingContent={editingContent}
                        onSetEditingContent={setEditingContent}
                        onStartEditing={startEditing}
                        onSave={saveEditing}
                        onCancel={cancelEditing}
                        onDelete={deletePrompt}
                        onReset={resetDefaultPrompt}
                        onToggleExpand={toggleExpand}
                        workbenchContent={workbenchContent} // [추가] prop 전달
                    />
                ))}
                {prompts.length === 0 && (
                    <div className="empty-prompt-list">
                        <p>저장된 프롬프트가 없습니다.</p>
                        <p>'새 프롬프트 추가' 버튼을 눌러 시작하세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromptCollection;
----- ./react/features/prompt-collection/ui/PromptMemo.tsx -----
import React, { useState } from 'react';
import { useLocation } from 'react-router';
import { LuCopy, LuCopyCheck, LuPencil, LuTrash2, LuSave, LuCircleX, LuRotateCcw, LuChevronDown, LuLayers } from 'react-icons/lu';
import Tippy from '@tippyjs/react';
import type { Prompt } from '../model/usePromptManager';
import './PromptCollection.css';

interface PromptMemoProps {
    prompt: Prompt;
    isEditing: boolean;
    isExpanded: boolean;
    editingTitle: string;
    onSetEditingTitle: (title: string) => void;
    editingContent: string;
    onSetEditingContent: (content: string) => void;
    onStartEditing: (prompt: Prompt) => void;
    onSave: () => void;
    onCancel: () => void;
    onDelete: (id: string) => void;
    onReset: (id: string) => void;
    onToggleExpand: (id: string) => void;
    workbenchContent?: string; // prop 받기
}

const PromptMemo: React.FC<PromptMemoProps> = ({
    prompt, isEditing, isExpanded, editingTitle, onSetEditingTitle, editingContent, onSetEditingContent,
    onStartEditing, onSave, onCancel, onDelete, onReset, onToggleExpand, workbenchContent
}) => {
    const location = useLocation();
    const [isCopied, setIsCopied] = useState(false);
    const [isCombinedCopied, setIsCombinedCopied] = useState(false); // 새 버튼을 위한 상태

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(prompt.content).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('클립보드 복사에 실패했습니다.');
        });
    };

    const handleCombinedCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!workbenchContent) {
            alert('복사할 작업 내용이 없습니다.');
            return;
        }

        const combinedText = `${prompt.content}\n${workbenchContent}`;
        
        navigator.clipboard.writeText(combinedText).then(() => {
            setIsCombinedCopied(true);
            setTimeout(() => setIsCombinedCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy combined text: ', err);
            alert('클립보드 복사에 실패했습니다.');
        });
    };


    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onStartEditing(prompt);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(prompt.id);
    };

    const handleResetClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onReset(prompt.id);
    };
    
    const editModeHeader = (
        <div className="prompt-memo-header non-clickable">
            <input 
                type="text" 
                value={editingTitle} 
                onChange={(e) => onSetEditingTitle(e.target.value)} 
                className="title-input"
                placeholder="프롬프트 제목"
            />
            <div className="button-group">
                <Tippy content="저장" theme="custom-glass"><button onClick={onSave} className="prompt-action-button save"><LuSave size={16} /></button></Tippy>
                <Tippy content="취소" theme="custom-glass"><button onClick={onCancel} className="prompt-action-button cancel"><LuCircleX size={16} /></button></Tippy>
            </div>
        </div>
    );
    
    const viewModeHeader = (
        <div className="prompt-memo-header" onClick={() => onToggleExpand(prompt.id)}>
            <div className="header-top-row">
                <button className="expand-toggle-button" aria-expanded={isExpanded}>
                    <LuChevronDown size={18} className="chevron-icon" />
                </button>
                <h5 className="prompt-memo-title">{prompt.title}</h5>
            </div>
            <div className="header-bottom-row">
                <div className="button-group">
                    <Tippy content={isCopied ? "복사 완료!" : "프롬프트 복사"} theme="custom-glass"><button onClick={handleCopy} className="prompt-action-button copy">{isCopied ? <LuCopyCheck size={16} /> : <LuCopy size={16} />}</button></Tippy>
                    
                    {/* [핵심 수정] 페이지 경로와 프롬프트 ID에 따라 '합쳐서 복사' 버튼을 조건부로 렌더링 */}
                    {workbenchContent && (
                        <>
                            {/* '문제 출제' 페이지에서는 '해설 작업'(default-2) 프롬프트에만 표시 */}
                            {location.pathname === '/problem-publishing' && prompt.id === 'default-2' && (
                                <Tippy content={isCombinedCopied ? "복사 완료!" : "해설 프롬프트와 JSON을 함께 복사"} theme="custom-glass">
                                    <button onClick={handleCombinedCopy} className="prompt-action-button combined-copy">
                                        {isCombinedCopied ? <LuCopyCheck size={16} /> : <LuLayers size={16} />}
                                    </button>
                                </Tippy>
                            )}
                            
                            {/* '문제 작업' 페이지에서는 '개별화 작업'(default-3) 프롬프트에만 표시 */}
                            {location.pathname === '/problem-workbench' && prompt.id === 'default-3' && (
                                <Tippy content={isCombinedCopied ? "복사 완료!" : "개별화 프롬프트와 작업 내용을 함께 복사"} theme="custom-glass">
                                    <button onClick={handleCombinedCopy} className="prompt-action-button combined-copy">
                                        {isCombinedCopied ? <LuCopyCheck size={16} /> : <LuLayers size={16} />}
                                    </button>
                                </Tippy>
                            )}
                        </>
                    )}

                    <Tippy content="수정" theme="custom-glass"><button onClick={handleEditClick} className="prompt-action-button edit"><LuPencil size={16} /></button></Tippy>
                    
                    {prompt.id.startsWith('default-') && (
                         <Tippy content="기본값으로 초기화" theme="custom-glass"><button onClick={handleResetClick} className="prompt-action-button reset"><LuRotateCcw size={16} /></button></Tippy>
                    )}
                    
                    <Tippy content="삭제" theme="custom-glass"><button onClick={handleDeleteClick} disabled={prompt.id.startsWith('default-')} className="prompt-action-button delete"><LuTrash2 size={16} /></button></Tippy>
                </div>
            </div>
        </div>
    );


    if (isEditing) {
        return (
            <div className="prompt-memo-card editing expanded"> 
                {editModeHeader}
                <div className="prompt-memo-content">
                    <textarea 
                        value={editingContent} 
                        onChange={(e) => onSetEditingContent(e.target.value)} 
                        className="content-textarea"
                        placeholder="프롬프트 내용"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={`prompt-memo-card ${isExpanded ? 'expanded' : ''}`}>
            {viewModeHeader}
            <div className="prompt-memo-content">
                <pre>{prompt.content}</pre>
            </div>
        </div>
    );
};

export default PromptMemo;
----- ./react/features/row-selection/model/useRowSelection.ts -----
import { useState, useCallback, useMemo } from 'react';

interface UseRowSelectionProps<T extends string | number> {
    initialSelectedIds?: Set<T>;
    allItems?: T[]; 
}

interface UseRowSelectionReturn<T extends string | number> {
    selectedIds: Set<T>;
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<T>>>; // [추가] 외부에서 직접 제어
    toggleRow: (id: T) => void;
    isRowSelected: (id: T) => boolean;
    toggleSelectAll: () => void;
    isAllSelected: boolean;
    clearSelection: () => void;
    toggleItems: (ids: T[]) => void;
    replaceSelection: (ids: T[]) => void; // [추가]
}

export function useRowSelection<T extends string | number>({
    initialSelectedIds = new Set<T>(),
    allItems = [],
}: UseRowSelectionProps<T> = {}): UseRowSelectionReturn<T> {
    const [selectedIds, setSelectedIds] = useState<Set<T>>(initialSelectedIds);

    const toggleRow = useCallback((id: T) => {
        setSelectedIds(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
            return newSelected;
        });
    }, []);

    const isRowSelected = useCallback((id: T) => selectedIds.has(id), [selectedIds]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const isAllSelected = useMemo(() => {
        if (allItems.length === 0) return false;
        return allItems.every(id => selectedIds.has(id));
    }, [allItems, selectedIds]);

    const toggleSelectAll = useCallback(() => {
        if (allItems.length === 0) return;

        if (isAllSelected) {
            const newSelectedIds = new Set(selectedIds);
            allItems.forEach(id => newSelectedIds.delete(id));
            setSelectedIds(newSelectedIds);
        } else {
            const newSelectedIds = new Set(selectedIds);
            allItems.forEach(id => newSelectedIds.add(id));
            setSelectedIds(newSelectedIds);
        }
    }, [allItems, isAllSelected, selectedIds]);

    const toggleItems = useCallback((idsToToggle: T[]) => {
        if (idsToToggle.length === 0) return;

        const allFilteredAreSelected = idsToToggle.every(id => selectedIds.has(id));
        
        setSelectedIds(prev => {
            const newSelected = new Set(prev);
            if (allFilteredAreSelected) {
                idsToToggle.forEach(id => newSelected.delete(id));
            } else {
                idsToToggle.forEach(id => newSelected.add(id));
            }
            return newSelected;
        });
    }, [selectedIds]);
    
    const replaceSelection = useCallback((ids: T[]) => {
        setSelectedIds(new Set(ids));
    }, []);

    return {
        selectedIds,
        setSelectedIds, // [추가]
        toggleRow,
        isRowSelected,
        toggleSelectAll,
        isAllSelected,
        clearSelection,
        toggleItems,
        replaceSelection, // [추가]
    };
}
----- ./react/features/student-actions/ui/StudentActionButtons.tsx -----
import React from 'react';
import { LuPencil, LuBookUser, LuCircleArrowOutDownRight } from 'react-icons/lu';
import Tippy from '@tippyjs/react';
import './StudentActionButtons.css';
import StudentStatusChanger from '../../student-status-changer/ui/StudentStatusChanger';
import type { Student } from '../../../entities/student/model/useStudentDataWithRQ';

type StatusValue = Student['status'];

interface StudentActionButtonsProps {
    studentId: string;
    studentName: string;
    isEditing: boolean;
    onEdit: () => void;
    onNavigate: () => void;
    onToggleStatusEditor: () => void;
    onStatusUpdate: (id: string, status: StatusValue | 'delete') => void;
    onCancel: () => void;
}

const StudentActionButtons: React.FC<StudentActionButtonsProps> = ({
    studentId,
    studentName,
    isEditing,
    onEdit,
    onNavigate,
    onToggleStatusEditor,
    onStatusUpdate,
    onCancel,
}) => {
    if (isEditing) {
        return <StudentStatusChanger studentId={studentId} onStatusSelect={onStatusUpdate} onCancel={onCancel} />;
    }

    return (
        <div className="action-cell-buttons">
            {/* 1. 수정 아이콘 */}
            <Tippy content="수정" theme="custom-glass" placement="top">
                <button type="button" className="action-icon-button"
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    aria-label={`${studentName} 학생 정보 수정`}>
                    <LuPencil size={16} color="#3498db" />
                </button>
            </Tippy>
            {/* 2. 상세보기 아이콘 */}
            <Tippy content="상세 보기" theme="custom-glass" placement="top">
                 <button type="button" className="action-icon-button"
                    onClick={(e) => { e.stopPropagation(); onNavigate(); }}
                    aria-label={`${studentName} 학생 상세 정보 보기`}>
                    <LuBookUser size={16} color="#3498db" />
                </button>
            </Tippy>
            {/* 3. 상태 변경(퇴원 처리 등) 아이콘 */}
            <Tippy content="상태 변경" theme="custom-glass" placement="top">
                <button type="button" className="action-icon-button"
                    onClick={(e) => { e.stopPropagation(); onToggleStatusEditor(); }}
                    aria-label={`${studentName} 학생 상태 변경`}>
                    <LuCircleArrowOutDownRight size={16} color="#3498db" />
                </button>
            </Tippy>
        </div>
    );
};

export default StudentActionButtons;
----- ./react/features/student-dashboard/index.ts -----
export { useStudentDashboard } from './model/useStudentDashboard';
----- ./react/features/student-dashboard/model/useStudentDashboard.ts -----

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLayoutStore } from '../../../shared/store/layoutStore';
import { useUIStore } from '../../../shared/store/uiStore';
import { useStudentDataWithRQ, type Student, GRADE_LEVELS } from '../../../entities/student/model/useStudentDataWithRQ';
import { useRowSelection } from '../../row-selection/model/useRowSelection';
import { useTableSearch } from '../../table-search/model/useTableSearch';
import type { SuggestionGroup } from '../../../features/table-search/ui/TableSearch'; 

export function useStudentDashboard() {
    const { registerPageActions, setRightSidebarConfig, setSearchBoxProps } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore.getState();
    
    const { students, isLoadingStudents, isStudentsError, studentsError } = useStudentDataWithRQ();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({});

    const currentStudents = students || [];
    const studentIds = useMemo(() => currentStudents.map(s => s.id), [currentStudents]);

    const { selectedIds, toggleRow, toggleItems, setSelectedIds } = useRowSelection<string>({ allItems: studentIds });

    const filteredStudents = useTableSearch({
        data: currentStudents,
        searchTerm,
        searchableKeys: ['student_name', 'grade', 'subject', 'school_name', 'class_name', 'teacher'],
        activeFilters,
    }) as Student[];
    const filteredStudentIds = useMemo(() => filteredStudents.map(s => s.id), [filteredStudents]);
    
    const isAllSelected = useMemo(() => {
        if (filteredStudentIds.length === 0) return false;
        return filteredStudentIds.every(id => selectedIds.has(id));
    }, [filteredStudentIds, selectedIds]);

    const suggestionGroups = useMemo((): SuggestionGroup[] => {
        const getUniqueSortedValues = (items: Student[], key: keyof Student): string[] => {
            if (!items || !Array.isArray(items) || items.length === 0) return [];
            const values = items.map(item => item[key]).filter((value): value is string => value != null && String(value).trim() !== '');
            const uniqueValues = Array.from(new Set(values));
            if (key === 'grade') {
                return uniqueValues.sort((a, b) => GRADE_LEVELS.indexOf(a) - GRADE_LEVELS.indexOf(b));
            }
            return uniqueValues.sort();
        };

        return [
            { key: 'grade', suggestions: getUniqueSortedValues(currentStudents, 'grade') },
            { key: 'subject', suggestions: getUniqueSortedValues(currentStudents, 'subject') },
            { key: 'class_name', suggestions: getUniqueSortedValues(currentStudents, 'class_name') },
        ];
    }, [currentStudents]);
    
    const suggestionGroupsJSON = useMemo(() => JSON.stringify(suggestionGroups), [suggestionGroups]);

    const handleFilterChange = useCallback((key: string, value: string) => {
        setActiveFilters(prev => {
            const newFilters = { ...prev };
            const currentSet = new Set(newFilters[key] || []);
            if (currentSet.has(value)) currentSet.delete(value);
            else currentSet.add(value);
            if (currentSet.size === 0) delete newFilters[key];
            else newFilters[key] = currentSet;
            return newFilters;
        });
    }, []);

    const handleResetFilters = useCallback(() => {
      setActiveFilters({});
      setSearchTerm('');
      setSelectedIds(new Set());
    }, [setSelectedIds]);
    
    const handleToggleAll = useCallback(() => toggleItems(filteredStudentIds), [toggleItems, filteredStudentIds]);

    const handleCreateProblemSet = useCallback(() => {
        if (selectedIds.size === 0) return alert('선택된 학생이 없습니다.');
        console.log('문제 출제 대상 학생 ID:', [...selectedIds]);
        alert(`${selectedIds.size}명의 학생을 대상으로 문제 출제 로직을 실행합니다.`);
    }, [selectedIds]);

    const handleCloseSidebar = useCallback(() => {
        setRightSidebarConfig({ contentConfig: { type: null } });
        setRightSidebarExpanded(false);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);
    
    const handleRequestEdit = useCallback((student: Student) => {
        setRightSidebarConfig({ 
            contentConfig: { type: 'edit', props: { student } },
            isExtraWide: false 
        });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    const handleOpenRegisterSidebar = useCallback(() => {
        setRightSidebarConfig({ contentConfig: { type: 'register' }, isExtraWide: false });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);
    
    const handleOpenSettingsSidebar = useCallback(() => {
        setRightSidebarConfig({ contentConfig: { type: 'settings' }, isExtraWide: false });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    useEffect(() => {
        registerPageActions({
            openRegisterSidebar: handleOpenRegisterSidebar,
            openSettingsSidebar: handleOpenSettingsSidebar,
            onClose: handleCloseSidebar,
        });
        return () => {
            registerPageActions({ openRegisterSidebar: undefined, openSettingsSidebar: undefined, onClose: undefined });
            handleCloseSidebar();
        };
    }, [registerPageActions, handleOpenRegisterSidebar, handleOpenSettingsSidebar, handleCloseSidebar]);
    
    useEffect(() => {
        setSearchBoxProps({
            searchTerm,
            onSearchTermChange: setSearchTerm,
            activeFilters,
            onFilterChange: handleFilterChange,
            onResetFilters: handleResetFilters,
            suggestionGroups: suggestionGroupsJSON,
            onToggleFiltered: handleToggleAll,
            onCreateProblemSet: handleCreateProblemSet,
            selectedCount: selectedIds.size,
            showActionControls: true,
            isSelectionComplete: isAllSelected,
            onHide: undefined,
        });

        return () => setSearchBoxProps(null);
    }, [
        searchTerm, activeFilters, suggestionGroupsJSON, selectedIds.size, isAllSelected,
        handleFilterChange, handleResetFilters, handleToggleAll, handleCreateProblemSet, setSearchBoxProps
    ]);
    
    return {
        students: filteredStudents,
        isLoading: isLoadingStudents,
        isError: isStudentsError,
        error: studentsError,
        selectedIds,
        toggleRow,
        isAllSelected,
        toggleSelectAll: handleToggleAll,
        onRequestEdit: handleRequestEdit,
    };
}
----- ./react/features/student-editing/ui/StudentEditForm.tsx -----
import React, { useState, useEffect, useMemo } from 'react';
import { 
    useStudentDataWithRQ, 
    type Student, 
    type UpdateStudentInput, 
    GRADE_LEVELS 
} from '../../../entities/student/model/useStudentDataWithRQ';
import CategoryInput from '../../student-registration/ui/CategoryInput';
import '../../student-registration/ui/StudentRegistrationForm.css';

interface StudentEditFormProps {
    student: Student;
    onSuccess: () => void;
}

const statusOptions: Student['status'][] = ['재원', '휴원', '퇴원'];

const getUniqueValues = <T extends object, K extends keyof T>(items: T[], key: K): (string | number)[] => {
    if (!items || items.length === 0) { // 오타 수정
        return [];
    }

    const uniqueValues = items.reduce((acc: Set<string | number>, item) => {
        const value = item[key];
        if (typeof value === 'string' && value.trim() !== '') {
            acc.add(value);
        } else if (typeof value === 'number') {
            acc.add(value);
        }
        return acc;
    }, new Set<string | number>());

    return Array.from(uniqueValues);
};


const StudentEditForm: React.FC<StudentEditFormProps> = ({ student, onSuccess }) => {
    const { students, updateStudent, updateStudentStatus } = useStudentDataWithRQ();

    const [name, setName] = useState('');
    const [grade, setGrade] = useState('');
    const [className, setClassName] = useState('');
    const [subject, setSubject] = useState('');
    const [teacher, setTeacher] = useState('');
    const [status, setStatus] = useState<Student['status']>('재원');
    const [studentPhone, setStudentPhone] = useState('');
    const [guardianPhone, setGuardianPhone] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [tuition, setTuition] = useState('');

    const uniqueClassNames = useMemo(() => getUniqueValues(students, 'class_name').sort(), [students]);
    const uniqueSubjects = useMemo(() => getUniqueValues(students, 'subject').sort(), [students]);
    const uniqueSchoolNames = useMemo(() => getUniqueValues(students, 'school_name').sort(), [students]);
    const uniqueTeachers = useMemo(() => getUniqueValues(students, 'teacher').sort(), [students]);
    
    useEffect(() => {
        if (student) {
            setName(student.student_name);
            setGrade(student.grade);
            setClassName(student.class_name || '');
            setSubject(student.subject);
            setStatus(student.status);
            setTeacher(student.teacher || '');
            setStudentPhone(student.student_phone || '');
            setGuardianPhone(student.guardian_phone || '');
            setSchoolName(student.school_name || '');
            setTuition(String(student.tuition || ''));
        }
    }, [student]);

    useEffect(() => {
        if (updateStudentStatus.isSuccess) {
            onSuccess();
        }
    }, [updateStudentStatus.isSuccess, onSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const updatedData: UpdateStudentInput = {
            id: student.id,
            student_name: name.trim(),
            grade: grade.trim(),
            class_name: className.trim() || null,
            subject: subject.trim(),
            teacher: teacher.trim() || null,
            status: status,
            student_phone: studentPhone.trim() || null,
            guardian_phone: guardianPhone.trim() || null,
            school_name: schoolName.trim() || null,
            tuition: tuition ? Number(String(tuition).replace(/,/g, '')) : 0,
        };
        try {
            await updateStudent(updatedData);
        } catch (err) {
            console.error('Failed to update student:', err);
        }
    };
    
    return (
        <div className="student-registration-container">
            <h4 className="registration-form-title">학생 정보 수정</h4>
            <form onSubmit={handleSubmit} className="registration-form" noValidate>
                <div className="form-group">
                    <label htmlFor="student-name-edit" className="form-label">이름 *</label>
                    <input id="student-name-edit" type="text" value={name} onChange={e => setName(e.target.value)} required className="form-input" />
                </div>
                
                <CategoryInput
                    label="상태"
                    value={status}
                    onChange={(newStatus) => setStatus(newStatus as Student['status'])}
                    suggestions={statusOptions}
                    hideInput={true}
                />
                
                <CategoryInput
                    label="학년"
                    value={grade}
                    onChange={setGrade}
                    suggestions={GRADE_LEVELS}
                    hideInput={true}
                />

                <CategoryInput 
                    label="반" 
                    value={className} 
                    onChange={setClassName} 
                    suggestions={uniqueClassNames} 
                    placeholder="직접 입력 (예: 1반, 심화반)"
                />

                <CategoryInput 
                    label="과목" 
                    value={subject} 
                    onChange={setSubject} 
                    suggestions={uniqueSubjects} 
                    placeholder="직접 입력 (예: 수학, 영어)"
                />
                <CategoryInput 
                    label="담당 강사" 
                    value={teacher} 
                    onChange={setTeacher} 
                    suggestions={uniqueTeachers} 
                    placeholder="직접 입력 (예: 김리액)"
                />
                <CategoryInput 
                    label="학생 연락처" 
                    value={studentPhone} 
                    onChange={setStudentPhone} 
                    suggestions={[]} 
                    placeholder="010-1234-5678" 
                    type="tel"
                />
                <CategoryInput 
                    label="학부모 연락처" 
                    value={guardianPhone} 
                    onChange={setGuardianPhone} 
                    suggestions={[]} 
                    placeholder="010-9876-5432" 
                    type="tel"
                />
                <CategoryInput 
                    label="학교명" 
                    value={schoolName} 
                    onChange={setSchoolName} 
                    suggestions={uniqueSchoolNames} 
                    placeholder="직접 입력 (예: OO고등학교)"
                />
                <CategoryInput 
                    label="수강료" 
                    value={tuition} 
                    onChange={setTuition} 
                    suggestions={[]} 
                    placeholder="직접 입력 (숫자만)" 
                    type="text"
                />
                <div className="form-actions">
                    {updateStudentStatus.isError && <p className="form-error-message">수정 실패: {updateStudentStatus.error?.message}</p>}
                    <button type="submit" className="submit-button" disabled={updateStudentStatus.isPending || !name}>
                        {updateStudentStatus.isPending ? '저장 중...' : '변경 내용 저장'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StudentEditForm;
----- ./react/features/student-registration/ui/CategoryInput.tsx -----
import React from 'react';
import './CategoryInput.css';

interface CategoryInputProps {
    label: string;
    value: string;
    suggestions: (string | number)[];
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'text' | 'number' | 'tel';
    required?: boolean;
    hideInput?: boolean; 
}

const CategoryInput: React.FC<CategoryInputProps> = ({
    label,
    value,
    suggestions,
    onChange,
    placeholder,
    type = 'text',
    required = false,
    hideInput = false, 
}) => {
    return (
        <div className="category-input-group">
            <label className="form-label">{label} {required && '*'}</label>
            <div className="category-suggestions">
                {suggestions.map((suggestion) => (
                    <button
                        type="button"
                        key={suggestion}
                        className={`suggestion-button ${String(value) === String(suggestion) ? 'active' : ''}`}
                        onClick={() => onChange(String(suggestion))}
                    >
                        {label === '수강료' && typeof suggestion === 'number' ? suggestion.toLocaleString() : suggestion}
                    </button>
                ))}
            </div>
            
            {!hideInput && (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="form-input"
                    required={required}
                />
            )}
        </div>
    );
};

export default CategoryInput;
----- ./react/features/student-registration/ui/StudentRegistrationForm.tsx -----
import React, { useState, useMemo, useEffect } from 'react';
import { useStudentDataWithRQ, type CreateStudentInput, GRADE_LEVELS } from '../../../entities/student/model/useStudentDataWithRQ';
import CategoryInput from './CategoryInput';
import './StudentRegistrationForm.css';
import { LuUserPlus } from 'react-icons/lu';

interface StudentRegistrationFormProps {
    onSuccess?: () => void;
}

const getUniqueValues = <T extends object, K extends keyof T>(items: T[], key: K): (string | number)[] => {
    if (!items || items.length === 0) { // 오타 수정
        return [];
    }

    const uniqueValues = items.reduce((acc: Set<string | number>, item) => {
        const value = item[key];
        if (typeof value === 'string' && value.trim() !== '') {
            acc.add(value);
        } else if (typeof value === 'number') {
            acc.add(value);
        }
        return acc;
    }, new Set<string | number>());

    return Array.from(uniqueValues);
};


const StudentRegistrationForm: React.FC<StudentRegistrationFormProps> = ({ onSuccess }) => {
    const { students, addStudent, addStudentStatus } = useStudentDataWithRQ();

    const [name, setName] = useState('');
    const [grade, setGrade] = useState('');
    const [subject, setSubject] = useState('');
    const [className, setClassName] = useState('');
    const [teacher, setTeacher] = useState('');
    const [studentPhone, setStudentPhone] = useState('');
    const [guardianPhone, setGuardianPhone] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [tuition, setTuition] = useState('');

    const uniqueClassNames = useMemo(() => getUniqueValues(students, 'class_name').sort(), [students]);
    const uniqueSubjects = useMemo(() => getUniqueValues(students, 'subject').sort(), [students]);
    const uniqueSchoolNames = useMemo(() => getUniqueValues(students, 'school_name').sort(), [students]);
    const uniqueTuitions = useMemo(() => getUniqueValues(students, 'tuition').sort((a,b) => (a as number) - (b as number)), [students]);
    const uniqueTeachers = useMemo(() => getUniqueValues(students, 'teacher').sort(), [students]);

    const resetForm = () => {
        setName(''); setGrade(''); setSubject(''); setClassName(''); setTeacher('');
        setStudentPhone(''); setGuardianPhone(''); setSchoolName(''); setTuition('');
    };
    
    useEffect(() => {
        if (addStudentStatus.isSuccess) {
            resetForm();
            if (onSuccess) {
                onSuccess();
            }
        }
    }, [addStudentStatus.isSuccess, onSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newStudent: CreateStudentInput = {
            student_name: name.trim(),
            grade: grade.trim(),
            class_name: className.trim() || null,
            subject: subject.trim(),
            teacher: teacher.trim() || null,
            student_phone: studentPhone.trim() || null,
            guardian_phone: guardianPhone.trim() || null,
            school_name: schoolName.trim() || null,
            tuition: tuition ? Number(String(tuition).replace(/,/g, '')) : 0,
            status: '재원',
        };
        try {
            await addStudent(newStudent);
        } catch (err) {
            console.error('Failed to add student:', err);
        }
    };

    return (
        <div className="student-registration-container">
            <h4 className="registration-form-title">
                <LuUserPlus size={18} />
                <span>신입생 등록</span>
            </h4>
            <form onSubmit={handleSubmit} className="registration-form" noValidate>
                <div className="form-group">
                    <label htmlFor="student-name" className="form-label">이름 *</label>
                    <input id="student-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="form-input" placeholder="학생 이름을 입력하세요"/>
                </div>
                <CategoryInput 
                    label="학년"
                    value={grade}
                    onChange={setGrade}
                    suggestions={GRADE_LEVELS}
                    hideInput={true}
                />
                <CategoryInput label="반" value={className} onChange={setClassName} suggestions={uniqueClassNames} placeholder="직접 입력 (예: 1반, 심화반)"/>
                <CategoryInput label="과목" value={subject} onChange={setSubject} suggestions={uniqueSubjects} placeholder="직접 입력 (예: 수학, 영어)"/>
                <CategoryInput label="담당 강사" value={teacher} onChange={setTeacher} suggestions={uniqueTeachers} placeholder="직접 입력 (예: 김리액)"/>
                <CategoryInput label="학생 연락처" value={studentPhone} onChange={setStudentPhone} suggestions={[]} placeholder="010-1234-5678" type="tel"/>
                <CategoryInput label="학부모 연락처" value={guardianPhone} onChange={setGuardianPhone} suggestions={[]} placeholder="010-9876-5432" type="tel"/>
                <CategoryInput label="학교명" value={schoolName} onChange={setSchoolName} suggestions={uniqueSchoolNames} placeholder="직접 입력 (예: OO고등학교)"/>
                <CategoryInput label="수강료" value={tuition} onChange={setTuition} suggestions={uniqueTuitions} placeholder="직접 입력 (숫자만)" type="text"/>

                <div className="form-actions">
                    {addStudentStatus.isError && (
                        <p className="form-error-message">등록 실패: {addStudentStatus.error?.message}</p>
                    )}
                    <button type="submit" className="submit-button" disabled={addStudentStatus.isPending || !name.trim()}>
                        {addStudentStatus.isPending ? '등록 중...' : '학생 등록하기'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StudentRegistrationForm;
----- ./react/features/student-status-changer/ui/StudentStatusChanger.tsx -----
import React from 'react';
import Badge from '../../../shared/ui/Badge/Badge';
import type { Student } from '../../../entities/student/model/useStudentDataWithRQ';
import './StudentStatusChanger.css';
import { LuUndo2 } from 'react-icons/lu';
import Tippy from '@tippyjs/react';

type StatusValue = Student['status'];

interface StudentStatusChangerProps {
    studentId: string;
    onStatusSelect: (studentId: string, status: StatusValue | 'delete') => void;
    onCancel: () => void; // [추가] 취소 함수를 위한 prop
}

const StudentStatusChanger: React.FC<StudentStatusChangerProps> = ({ studentId, onStatusSelect, onCancel }) => {
    const statuses: { label: string, value: StatusValue | 'delete', className: string }[] = [
        { label: '재원', value: '재원', className: 'status-enroll' },
        { label: '휴원', value: '휴원', className: 'status-pause' },
        { label: '퇴원', value: '퇴원', className: 'status-leave' },
        { label: '삭제', value: 'delete', className: 'status-delete' },
    ];

    return (
        <div className="status-changer-container">
            {/* [추가] 뒤로가기(취소) 아이콘 버튼 */}
            <Tippy content="취소" theme="custom-glass" placement="top">
                <button
                    type="button"
                    className="action-icon-button cancel-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onCancel();
                    }}
                    aria-label="상태 변경 취소"
                >
                    <LuUndo2 size={16} />
                </button>
            </Tippy>

            {/* 기존 Badge 그룹 */}
            {statuses.map(({ label, value, className }) => (
                <Badge
                    key={value}
                    className={`clickable-badge ${className}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onStatusSelect(studentId, value);
                    }}
                    role="button"
                    tabIndex={0}
                >
                    {label}
                </Badge>
            ))}
        </div>
    );
};

export default StudentStatusChanger;
----- ./react/features/table-column-toggler/ui/TableColumnToggler.tsx -----
import React, { useState, useMemo } from 'react';
import { useUIStore, type ProblemPublishingColumnKey } from '../../../shared/store/uiStore';
import { useColumnPermissions } from '../../../shared/hooks/useColumnPermissions';
import { LuEye, LuEyeOff, LuGripVertical } from 'react-icons/lu';
import './TableColumnToggler.css';

const TableColumnToggler: React.FC = () => {
  const {
    columnVisibility,
    toggleColumnVisibility,
    problemPublishingColumnOrder,
    setProblemPublishingColumnOrder,
  } = useUIStore();
  
  const { permittedColumnsConfig } = useColumnPermissions();

  const columnConfigMap = useMemo(() =>
    new Map(permittedColumnsConfig.map(c => [c.key, c]))
  , [permittedColumnsConfig]);

  const [draggedKey, setDraggedKey] = useState<ProblemPublishingColumnKey | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, key: ProblemPublishingColumnKey) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
    setTimeout(() => {
      setDraggedKey(key);
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggedKey(null);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLButtonElement>, targetKey: ProblemPublishingColumnKey) => {
    e.preventDefault();
    const sourceKey = e.dataTransfer.getData('text/plain') as ProblemPublishingColumnKey;
    setDraggedKey(null);

    if (sourceKey && sourceKey !== targetKey) {
        const sourceIndex = problemPublishingColumnOrder.indexOf(sourceKey);
        const targetIndex = problemPublishingColumnOrder.indexOf(targetKey);

        const newOrder: ProblemPublishingColumnKey[] = Array.from(problemPublishingColumnOrder);
        const [removed] = newOrder.splice(sourceIndex, 1);
        newOrder.splice(targetIndex, 0, removed);
        
        setProblemPublishingColumnOrder(newOrder);
    }
  };

  return (
    <div className="column-toggler-panel">
      <h4 className="toggler-title">테이블 컬럼 설정</h4>
      <p className="toggler-description">핸들을 드래그하여 순서를 변경하세요.</p>
      <div className="toggler-list">
        {problemPublishingColumnOrder.map((key) => {
          const config = columnConfigMap.get(key);
          if (!config) return null;

          const isVisible = columnVisibility[key] ?? !config.defaultHidden;
          const isDragging = draggedKey === key;
          
          return (
            <button
              key={key}
              type="button"
              draggable
              onDragStart={(e) => handleDragStart(e, key)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, key)}
              onDragEnd={handleDragEnd}
              className={`toggler-button ${isVisible ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
              onClick={() => toggleColumnVisibility(key)}
              aria-pressed={isVisible}
            >
              <LuGripVertical className="drag-handle" size={16} />
              <span className="button-label">{config.label}</span>
              {isVisible ? (
                <LuEye size={16} className="button-icon" />
              ) : (
                <LuEyeOff size={16} className="button-icon" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TableColumnToggler;
----- ./react/features/table-search/model/useTableSearch.ts -----
import { useMemo } from 'react';

type DataItem = Record<string, any>;

interface UseTableSearchOptions {
    data: DataItem[];
    searchTerm: string; 
    activeFilters: Record<string, Set<string>>; // [수정] 타입을 Set<string>으로 변경
    searchableKeys: string[];
}

export function useTableSearch({
    data,
    searchTerm,
    searchableKeys,
    activeFilters,
}: UseTableSearchOptions): DataItem[] {
    
    if (!data) {
        return [];
    }
    
    const filteredData = useMemo(() => {
        let items = [...data];

        const filterKeys = Object.keys(activeFilters);
        if (filterKeys.length > 0) {
            items = items.filter(item => {
                return filterKeys.every(key => {
                    const filterValues = activeFilters[key]; // Set
                    if (!filterValues || filterValues.size === 0) {
                        return true; 
                    }
                    const itemValue = item[key];
                    return itemValue != null && filterValues.has(String(itemValue));
                });
            });
        }

        const terms = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
        if (terms.length > 0) {
            items = items.filter(item => {
                const combinedSearchableText = searchableKeys
                    .map(key => item[key])
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                
                return terms.every(term => combinedSearchableText.includes(term));
            });
        }

        return items;
    }, [data, searchTerm, activeFilters, searchableKeys]);

    return filteredData;
}
----- ./react/features/table-search/ui/TableSearch.tsx -----

import React from 'react';
import { LuSearch, LuX, LuRotateCcw, LuCirclePlus, LuListChecks, LuEyeOff } from 'react-icons/lu';
import './TableSearch.css';

export interface SuggestionGroup {
    key: string;
    suggestions: string[];
}

export interface TableSearchProps {
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    suggestionGroups: SuggestionGroup[];
    activeFilters: Record<string, Set<string>>;
    onFilterChange: (key: string, value: string) => void;
    onResetFilters: () => void;
    onHide?: () => void;
    onToggleFiltered?: () => void;
    onCreateProblemSet?: () => void;
    selectedCount?: number;
    showActionControls?: boolean;
    isSelectionComplete?: boolean;
}

const TableSearch: React.FC<TableSearchProps> = ({
    searchTerm,
    onSearchTermChange,
    suggestionGroups,
    activeFilters,
    onFilterChange,
    onResetFilters,
    onHide,
    onToggleFiltered,
    onCreateProblemSet,
    selectedCount = 0,
    showActionControls = true,
    isSelectionComplete = false,
}) => {
    const hasActiveFilters = Object.keys(activeFilters).length > 0 || searchTerm.trim() !== '';

    return (
        <div className="table-search-panel">
            <div className="search-input-wrapper">
                <LuSearch className="search-input-icon" size={20} />
                <input
                    type="text"
                    placeholder="검색어를 입력하세요 (예: 고1 수학)"
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                />
            </div>
            
            <div className="filter-actions-container">
                <div className="filter-chips-area">
                    {suggestionGroups.map((group) => (
                        group.suggestions.length > 0 && (
                            <div key={group.key} className="suggestion-group">
                                <div className="suggestion-buttons-wrapper">
                                    {group.suggestions.map((suggestion) => {
                                        const isActive = activeFilters[group.key]?.has(suggestion) ?? false;
                                        return (
                                            <button
                                                key={suggestion}
                                                type="button"
                                                className={`suggestion-chip ${isActive ? 'active' : ''}`}
                                                onClick={() => onFilterChange(group.key, suggestion)}
                                            >
                                                {suggestion}
                                                {isActive && <LuX size={14} className="suggestion-chip-clear" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    ))}
                </div>

                {showActionControls && (
                    <div className="action-controls-area">
                        {onCreateProblemSet && (
                             <button
                                type="button"
                                className="control-button primary"
                                onClick={onCreateProblemSet}
                                disabled={selectedCount === 0}
                            >
                                <LuCirclePlus size={16} />
                                <span>문제 출제 ({selectedCount})</span>
                            </button>
                        )}
                       
                        {onToggleFiltered && (
                            <button
                                type="button"
                                className="control-button primary"
                                onClick={onToggleFiltered}
                                disabled={isSelectionComplete}
                            >
                                <LuListChecks size={16} />
                                <span>결과 선택</span>
                            </button>
                        )}
                        
                        {onHide && (
                            <button
                                type="button"
                                className="control-button"
                                onClick={onHide}
                            >
                                <LuEyeOff size={16} />
                                <span>검색창 숨기기</span>
                            </button>
                        )}

                        <button 
                            type="button" 
                            className="control-button"
                            onClick={onResetFilters}
                            disabled={!hasActiveFilters}
                            title="필터 초기화"
                        >
                            <LuRotateCcw size={16} />
                            <span>초기화</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TableSearch;
----- ./react/main.tsx -----

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";





const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

----- ./react/pages/DashBoard.tsx -----
import React from 'react';
import StudentTableWidget from '../widgets/student-table/StudentTableWidget';
import { useStudentDashboard } from '../features/student-dashboard';
import './DashBoard.css';

const DashBoard: React.FC = () => {
    const {
        students,
        isLoading,
        isError,
        error,
        selectedIds,
        toggleRow,
        isAllSelected,
        toggleSelectAll,
        onRequestEdit,
    } = useStudentDashboard();
    
    if (isError) {
        return (
            <div className="dashboard-error-container">
                <h2>학생 데이터 로딩 오류</h2>
                <p>{error?.message || '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <StudentTableWidget 
                students={students} 
                isLoading={isLoading}
                onRequestEdit={onRequestEdit}
                selectedIds={selectedIds}
                toggleRow={toggleRow}
                isAllSelected={isAllSelected}
                toggleSelectAll={toggleSelectAll}
            />
        </div>
    );
};

export default DashBoard;
----- ./react/pages/HomePage.tsx -----
import React from "react";
import {
  useAuthStore,
  selectUser,
  selectIsAuthenticated,
  selectIsLoadingAuth,
  selectAuthError,
} from "../shared/store/authStore";
import { SignInPanel } from "../features/kakaologin/ui/SignInPanel";
import { SignOutButton } from "../features/kakaologin/ui/SignOutButton";
import { UserDetailsButton } from "../widgets/UserDetailsButton";
import './HomePage.css';

const HomePage: React.FC = () => {
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoadingAuth = useAuthStore(selectIsLoadingAuth);
  const authError = useAuthStore(selectAuthError);

  if (isLoadingAuth) {
    return (
      <div className="homepage-container homepage-loading">
        <h2>인증 상태를 확인 중입니다...</h2>
        <p>잠시만 기다려주세요.</p>
      </div>
    );
  }

  return (
    <div className="homepage-container">
      <header className="homepage-header">
        <h1>Hono Supabase Auth Example!</h1>
        {user && <p>환영합니다, <strong>{user.email || '사용자'}</strong>님!</p>}
      </header>

      <hr className="homepage-divider" />

      <section className="homepage-section">
        <h2 className="section-title">Sign in / Sign out</h2>
        {!isAuthenticated ? <SignInPanel /> : <SignOutButton />}
        {authError && !isLoadingAuth && (
            <p className="auth-error-message">
                인증 오류: {authError}
            </p>
        )}
      </section>

      <hr className="homepage-divider" />

      {isAuthenticated && user && (
        <>
          <section className="homepage-section">
            <h2 className="section-title">Example of API fetch() (Hono Client)</h2>
            <UserDetailsButton />
          </section>
        </>
      )}

      {!isAuthenticated && (
        <p className="login-prompt">
          더 많은 예제를 보거나 데이터를 가져오려면 로그인해주세요.
        </p>
      )}
    </div>
  );
};

export default HomePage;
----- ./react/pages/JsonRendererPage.tsx -----

import React, { useCallback, useEffect } from 'react';
import JsonProblemImporterWidget from '../widgets/json-problem-importer/JsonProblemImporterWidget';
import './JsonRendererPage.css';
import { useLayoutStore } from '../shared/store/layoutStore';
import { useUIStore } from '../shared/store/uiStore';

const JsonRendererPage: React.FC = () => {
    const { registerPageActions, setRightSidebarConfig } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore();

    const handleOpenPromptSidebar = useCallback(() => {
        setRightSidebarConfig({ 
            contentConfig: { type: 'prompt' },
            isExtraWide: false
        });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    const handleOpenSettingsSidebar = useCallback(() => {
        setRightSidebarConfig({ 
            contentConfig: { type: 'settings' },
            isExtraWide: false
        });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    const handleCloseSidebar = useCallback(() => {
        setRightSidebarExpanded(false);
        setTimeout(() => setRightSidebarConfig({ contentConfig: { type: null } }), 300);
    }, [setRightSidebarExpanded, setRightSidebarConfig]);

    useEffect(() => {
        registerPageActions({
            openPromptSidebar: handleOpenPromptSidebar,
            openSettingsSidebar: handleOpenSettingsSidebar,
            onClose: handleCloseSidebar,
        });

        return () => {
            registerPageActions({
                openPromptSidebar: undefined,
                openSettingsSidebar: undefined,
                onClose: undefined,
            });
            handleCloseSidebar();
        };
    }, [registerPageActions, handleOpenPromptSidebar, handleOpenSettingsSidebar, handleCloseSidebar]);

    return (
        <div className="json-renderer-page">
            <JsonProblemImporterWidget />
        </div>
    );
};

export default JsonRendererPage;
----- ./react/pages/LoginPage.tsx -----
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  useAuthStore,
  selectIsAuthenticated,
  selectIsLoadingAuth,
  selectAuthError,
} from '../shared/store/authStore';
import BackgroundBlobs from '../widgets/rootlayout/BackgroundBlobs';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoadingAuthGlobal = useAuthStore(selectIsLoadingAuth);
  const authStoreError = useAuthStore(selectAuthError);
  const { signInWithKakao, clearAuthError } = useAuthStore.getState();

  const [isKakaoLoginLoading, setIsKakaoLoginLoading] = useState(false);
  const [urlErrorMessage, setUrlErrorMessage] = useState('');

  useEffect(() => {
    if (!isLoadingAuthGlobal && isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoadingAuthGlobal, navigate, location.state]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const errorParam = queryParams.get('error');
    const errorDescriptionParam = queryParams.get('error_description');

    if (errorParam) {
      let message = decodeURIComponent(errorParam);
      if (errorDescriptionParam) {
        message += `: ${decodeURIComponent(errorDescriptionParam)}`;
      }
      setUrlErrorMessage(message);
    }
  }, [location.search]);

  const handleKakaoLogin = async () => {
    if (isKakaoLoginLoading || isLoadingAuthGlobal) return;

    setIsKakaoLoginLoading(true);
    if (authStoreError) clearAuthError();
    setUrlErrorMessage('');

    try {
      await signInWithKakao();
    } catch (e: any) {
      console.error("Kakao login initiation error in component:", e);
    }
  };

  const displayError = authStoreError || urlErrorMessage;
  const isButtonDisabled = isLoadingAuthGlobal || isKakaoLoginLoading;

  if (isLoadingAuthGlobal && !displayError && !isKakaoLoginLoading) {
    return (
      <div className="login-page-wrapper">
        <div className="login-page-container loading-state">
          <p>인증 정보를 확인 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page-wrapper">
      <div className="login-background-blobs-wrapper">
        <BackgroundBlobs />
      </div>
      <div className="login-page-container">
        <div className="login-form-card">
          <h1 className="login-title">로그인</h1>
          <p className="login-subtitle">소셜 계정으로 간편하게 로그인하고<br />모든 기능을 이용해보세요.</p>
          <div className="social-login-buttons-container">
            <button
              type="button"
              className="social-login-button kakao-login-button"
              onClick={handleKakaoLogin}
              disabled={isButtonDisabled}
              aria-label="카카오 계정으로 로그인"
            >
              <svg className="social-login-icon kakao-icon" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                <path d="M9 0C4.029 0 0 3.138 0 7C0 9.039 1.206 10.845 3.108 12.015L2.582 14.956C2.529 15.262 2.811 15.513 3.099 15.37L6.091 13.898C6.683 13.961 7.293 14 7.922 14C12.971 14 17 10.862 17 7C17 3.138 12.971 0 7.922 0C7.922 0 9 0 9 0Z" fill="#000000" />
              </svg>
              <span className="social-login-text">
                {isKakaoLoginLoading || (isLoadingAuthGlobal && !isKakaoLoginLoading) ? '처리 중...' : '카카오 계정으로 로그인'}
              </span>
            </button>
          </div>
          {displayError && (
            <p className="login-error-message">{displayError}</p>
          )}
          <p className="login-terms">
            로그인 시 <a href="/terms" target="_blank" rel="noopener noreferrer">이용약관</a> 및 <a href="/privacy" target="_blank" rel="noopener noreferrer">개인정보처리방침</a>에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
----- ./react/pages/LoginPageWithErrorDisplay.tsx -----
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuthStore, selectAuthError, selectIsAuthenticated, selectIsLoadingAuth } from '../shared/store/authStore';
import './LoginPageWithErrorDisplay.css';

const LoginPageWithErrorDisplay: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlErrorDescription, setUrlErrorDescription] = useState<string | null>(null);

  const authStoreError = useAuthStore(selectAuthError);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoadingAuth = useAuthStore(selectIsLoadingAuth);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    const errorDescriptionParam = params.get('error_description');

    if (errorParam) setUrlError(decodeURIComponent(errorParam));
    if (errorDescriptionParam) setUrlErrorDescription(decodeURIComponent(errorDescriptionParam));
  }, [location.search]);

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      navigate('/');
    }
  }, [isLoadingAuth, isAuthenticated, navigate]);

  const handleRetryLogin = () => {
    navigate('/login');
  };

  const displayError = urlError || authStoreError;
  const displayErrorDescription = urlErrorDescription;

  if (isLoadingAuth) {
    return (
      <div className="login-error-page loading">
        <p>인증 상태를 확인 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="login-error-page">
      <div className="error-card">
        <h1>로그인</h1>
        {displayError && (
          <div className="error-details">
            <h2>로그인 오류</h2>
            <p><strong>오류 코드:</strong> {displayError}</p>
            {displayErrorDescription && <p><strong>상세 정보:</strong> {displayErrorDescription}</p>}
            <p>로그인 과정에서 문제가 발생했습니다.</p>
          </div>
        )}

        {!displayError && !isAuthenticated && (
          <p className="login-needed-message">
            로그인이 필요한 서비스입니다.
          </p>
        )}

        <div className="action-buttons">
          <button onClick={handleRetryLogin} className="action-button retry-button">
            로그인 페이지로 돌아가기
          </button>
          <Link to="/" className="action-button-link">
            <button className="action-button home-button">
              홈으로 이동
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPageWithErrorDisplay;
----- ./react/pages/ProblemPublishingPage.tsx -----
import React from 'react';
import { useProblemPublishingPage } from '../features/problem-publishing';
import ProblemSelectionContainer from '../widgets/ProblemSelectionContainer';
import PublishingToolbarWidget from '../widgets/PublishingToolbarWidget';
import ExamPreviewWidget from '../widgets/ExamPreviewWidget';
import Modal from '../shared/ui/modal/Modal';
import './ProblemPublishingPage.css';
import './PdfOptionsModal.css';

const ProblemPublishingPage: React.FC = () => {
    const {
        allProblems, isLoadingProblems, selectedIds, toggleRow, toggleItems, clearSelection,
        selectedProblems, distributedPages, placementMap, distributedSolutionPages, solutionPlacementMap,
        headerInfo, useSequentialNumbering, baseFontSize, contentFontSizeEm, measuredHeights,
        onHeightUpdate, onProblemClick, onHeaderUpdate, handleDeselectProblem,
        onToggleSequentialNumbering, onBaseFontSizeChange, onContentFontSizeEmChange,
        isGeneratingPdf, onDownloadPdf, pdfProgress,
        previewAreaRef, problemBoxMinHeight, setProblemBoxMinHeight,
        isPdfModalOpen,
        onClosePdfModal,
        pdfOptions,
        onPdfOptionChange,
        onConfirmPdfDownload,
    } = useProblemPublishingPage();

    const pageClassName = `problem-publishing-page ${isGeneratingPdf ? 'pdf-processing' : ''}`;

    return (
        <div className={pageClassName}>
            {isGeneratingPdf && <div className="processing-overlay" />}
            <div className="sticky-top-container">
                <div className="selection-widget-container">
                    <ProblemSelectionContainer
                        allProblems={allProblems}
                        selectedProblems={selectedProblems} // [추가] 선택된 문제 목록을 전달합니다.
                        isLoading={isLoadingProblems}
                        selectedIds={selectedIds}
                        toggleRow={toggleRow}
                        toggleItems={toggleItems}
                        clearSelection={clearSelection}
                    />
                </div>
                <PublishingToolbarWidget 
                    useSequentialNumbering={useSequentialNumbering}
                    onToggleSequentialNumbering={onToggleSequentialNumbering}
                    baseFontSize={baseFontSize}
                    onBaseFontSizeChange={onBaseFontSizeChange}
                    contentFontSizeEm={contentFontSizeEm}
                    onContentFontSizeEmChange={onContentFontSizeEmChange} 
                    problemBoxMinHeight={problemBoxMinHeight}
                    setProblemBoxMinHeight={setProblemBoxMinHeight}
                    onDownloadPdf={onDownloadPdf}
                    isGeneratingPdf={isGeneratingPdf}
                    pdfProgress={pdfProgress}
                />
            </div>
            <div 
                ref={previewAreaRef}
                className="scrollable-content-area"
                style={{ '--problem-box-min-height-em': `${problemBoxMinHeight}em` } as React.CSSProperties}
            >
                <ExamPreviewWidget 
                    distributedPages={distributedPages} 
                    distributedSolutionPages={distributedSolutionPages}
                    allProblems={allProblems}
                    selectedProblems={selectedProblems}
                    placementMap={placementMap} 
                    solutionPlacementMap={solutionPlacementMap}
                    headerInfo={headerInfo} 
                    useSequentialNumbering={useSequentialNumbering} 
                    baseFontSize={baseFontSize} 
                    contentFontSizeEm={contentFontSizeEm} 
                    contentFontFamily={headerInfo.titleFontFamily} 
                    onHeightUpdate={onHeightUpdate}
                    onProblemClick={onProblemClick} 
                    onHeaderUpdate={onHeaderUpdate} 
                    onDeselectProblem={handleDeselectProblem}
                    measuredHeights={measuredHeights}
                />
            </div>

            <Modal
                isOpen={isPdfModalOpen}
                onClose={onClosePdfModal}
                onConfirm={onConfirmPdfDownload}
                title="PDF 출력 옵션"
                confirmText="생성하기"
                size="small"
            >
                <div className="pdf-options-container">
                    <p className="options-description">PDF에 포함할 항목을 선택하세요.</p>
                    <div className="options-list">
                        <label className="option-item">
                            <input
                                type="checkbox"
                                checked={pdfOptions.includeProblems}
                                onChange={() => onPdfOptionChange('includeProblems')}
                            />
                            <span className="checkbox-label">문제</span>
                        </label>
                        <label className="option-item">
                            <input
                                type="checkbox"
                                checked={pdfOptions.includeAnswers}
                                onChange={() => onPdfOptionChange('includeAnswers')}
                            />
                            <span className="checkbox-label">빠른 정답</span>
                        </label>
                        <label className="option-item">
                            <input
                                type="checkbox"
                                checked={pdfOptions.includeSolutions}
                                onChange={() => onPdfOptionChange('includeSolutions')}
                            />
                            <span className="checkbox-label">정답 및 해설</span>
                        </label>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProblemPublishingPage;
----- ./react/pages/ProblemWorkbenchPage.tsx -----
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useImageUploadManager } from '../features/image-upload/model/useImageUploadManager';
import ImageManager from '../features/image-upload/ui/ImageManager';
import './ProblemWorkbenchPage.css';
import { useLayoutStore } from '../shared/store/layoutStore';
import { useUIStore } from '../shared/store/uiStore';
import { LuCopy, LuCopyCheck, LuFilePlus } from 'react-icons/lu';
import Tippy from '@tippyjs/react';
import CodeEditorPanel from '../shared/components/workbench/CodeEditorPanel';
import PreviewPanel from '../shared/components/workbench/PreviewPanel';

const LOCAL_STORAGE_KEY_PROBLEM_WORKBENCH = 'problem-workbench-draft';

const ProblemWorkbenchPage: React.FC = () => {
    const { registerPageActions, setRightSidebarConfig } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore.getState();

    const initialContent = useMemo(() => `# Mathpix Markdown 에디터에 오신 것을 환영합니다! 👋

이곳에서 Markdown 문법과 함께 LaTeX 수식을 실시간으로 편집하고 미리 볼 수 있습니다.

## 이미지 관리 예시

에디터에 \`***이미지1***\` 처럼 입력하면 오른쪽 패널에 이미지 관리 항목이 나타납니다.
각 항목에 이미지를 업로드하고, 최종적으로 '에디터에 적용' 버튼을 눌러보세요.

***이미지1***
***이미지2***
`, []);

    const [markdownContent, setMarkdownContent] = useState(() => {
        const savedContent = localStorage.getItem(LOCAL_STORAGE_KEY_PROBLEM_WORKBENCH);
        return savedContent !== null ? savedContent : initialContent;
    });

    const [previousMarkdownContent, setPreviousMarkdownContent] = useState<string | null>(null);
    
    const imageManager = useImageUploadManager(markdownContent);
    const [isCopied, setIsCopied] = useState(false);

    const handleContentChange = useCallback((content: string) => {
        setMarkdownContent(content);
        if (previousMarkdownContent !== null) {
            setPreviousMarkdownContent(null);
        }
    }, [previousMarkdownContent]);

    useEffect(() => {
        const handler = setTimeout(() => {
            try {
                if (markdownContent !== initialContent) {
                    localStorage.setItem(LOCAL_STORAGE_KEY_PROBLEM_WORKBENCH, markdownContent);
                } else {
                    localStorage.removeItem(LOCAL_STORAGE_KEY_PROBLEM_WORKBENCH);
                }
            } catch (error) {
                console.error(`[ProblemWorkbench] ❌ 로컬 저장소에 내용 저장 실패:`, error);
            }
        }, 5000);

        return () => clearTimeout(handler);
    }, [markdownContent, initialContent]);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (markdownContent && markdownContent !== initialContent) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [markdownContent, initialContent]);

    const handleOpenSettingsSidebar = useCallback(() => {
        setRightSidebarConfig({
            contentConfig: { type: 'settings' },
            isExtraWide: false
        });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    const handleOpenPromptSidebar = useCallback(() => {
        setRightSidebarConfig({ 
            contentConfig: { 
                type: 'prompt',
                props: { workbenchContent: markdownContent } 
            },
            isExtraWide: false
        });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded, markdownContent]);

    const handleOpenLatexHelpSidebar = useCallback(() => {
        setRightSidebarConfig({
            contentConfig: { type: 'latexHelp' },
            isExtraWide: false
        });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    const handleCloseSidebar = useCallback(() => {
        setRightSidebarExpanded(false);
        setTimeout(() => setRightSidebarConfig({ contentConfig: { type: null } }), 300);
    }, [setRightSidebarExpanded, setRightSidebarConfig]);

    useEffect(() => {
        registerPageActions({
            openSettingsSidebar: handleOpenSettingsSidebar,
            openPromptSidebar: handleOpenPromptSidebar,
            openLatexHelpSidebar: handleOpenLatexHelpSidebar,
            onClose: handleCloseSidebar,
        });
        return () => {
            registerPageActions({
                openSettingsSidebar: undefined,
                openPromptSidebar: undefined,
                openLatexHelpSidebar: undefined, // [수정] 클린업
                onClose: undefined,
            });
            handleCloseSidebar();
        };
    }, [registerPageActions, handleOpenSettingsSidebar, handleOpenPromptSidebar, handleOpenLatexHelpSidebar, handleCloseSidebar]);

    const handleApplyUrls = useCallback(() => {
        const { extractedImages, uploadedUrls, canApply } = imageManager;
        if (!canApply) return;

        setPreviousMarkdownContent(markdownContent);

        let newMarkdown = markdownContent;
        let changesMade = false;
        extractedImages.forEach(tag => {
            const url = uploadedUrls[tag];
            if (url) {
                const tagRegex = new RegExp(tag.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
                newMarkdown = newMarkdown.replace(tagRegex, `![](${url})`);
                changesMade = true;
            }
        });

        if (changesMade) {
            setMarkdownContent(newMarkdown);
        }
    }, [markdownContent, imageManager]);
    
    const handleRevertUrls = useCallback(() => {
        if (previousMarkdownContent !== null) {
            setMarkdownContent(previousMarkdownContent);
            setPreviousMarkdownContent(null);
        }
    }, [previousMarkdownContent]);

    const handleCopyContent = useCallback(() => {
        navigator.clipboard.writeText(markdownContent).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('클립보드 복사에 실패했습니다.');
        });
    }, [markdownContent]);

    const handleNewDocument = useCallback(() => {
        if (window.confirm('현재 작업 내용을 지우고 새로 시작하시겠습니까? 저장된 임시 내용도 사라집니다.')) {
            setMarkdownContent(initialContent);
            localStorage.removeItem(LOCAL_STORAGE_KEY_PROBLEM_WORKBENCH);
        }
    }, [initialContent]);

    const editorHeaderActions = (
        <>
            <Tippy content="새 작업 (초기화)" placement="top" theme="custom-glass">
                <button onClick={handleNewDocument} className="panel-header-button" aria-label="새 작업 시작">
                    <LuFilePlus size={18} />
                </button>
            </Tippy>
            <Tippy content={isCopied ? "복사 완료!" : "전체 내용 복사"} placement="top" theme="custom-glass">
                <button onClick={handleCopyContent} className="panel-header-button" aria-label="에디터 내용 복사">
                    {isCopied ? <LuCopyCheck size={18} color="var(--accent-color)" /> : <LuCopy size={18} />}
                </button>
            </Tippy>
        </>
    );

    return (
        <div className="problem-workbench-page">
            <input
                type="file"
                ref={imageManager.fileInputRef}
                onChange={imageManager.handleFileSelected}
                accept="image/*"
                style={{ display: 'none' }}
            />
            <div className="problem-workbench-layout">
                <CodeEditorPanel
                    title="Markdown & LaTeX 입력"
                    content={markdownContent}
                    onContentChange={handleContentChange}
                    headerActions={editorHeaderActions}
                />

                <PreviewPanel
                    title="실시간 미리보기 (Mathpix)"
                    content={markdownContent}
                />
                
                <div className="workbench-panel image-manager-wrapper-panel">
                    <ImageManager
                        extractedImages={imageManager.extractedImages}
                        uploadStatuses={imageManager.uploadStatuses}
                        uploadedUrls={imageManager.uploadedUrls}
                        uploadErrors={imageManager.uploadErrors}
                        pendingUploadCount={imageManager.pendingUploadCount}
                        canApply={imageManager.canApply}
                        draggingTag={imageManager.draggingTag}
                        dragOverTag={imageManager.dragOverTag}
                        onUploadSingle={imageManager.onUploadSingle}
                        onUploadAll={imageManager.onUploadAll} 
                        onApplyUrls={handleApplyUrls}
                        onRevertUrls={handleRevertUrls}
                        isApplied={previousMarkdownContent !== null}
                        onDragStart={imageManager.onDragStart}
                        onDrop={imageManager.onDrop}
                        onDragOver={imageManager.onDragOver}
                        onDragLeave={imageManager.onDragLeave}
                        onDragEnd={imageManager.onDragEnd}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProblemWorkbenchPage;
----- ./react/pages/ProfileSetupPage.tsx -----

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod'; // 프론트엔드 유효성 검사를 위해 import
import { useAuthStore, selectUser, selectIsLoadingAuth } from '../shared/store/authStore';
import BackgroundBlobs from '../widgets/rootlayout/BackgroundBlobs';
import './ProfileSetupPage.css';

const POSITIONS = ['학생', '원장', '강사', '학부모'] as const;
type PositionType = typeof POSITIONS[number];

const profileFormSchema = z.object({
  name: z.string().min(1, "이름은 필수 항목입니다.").max(100),
  position: z.enum(POSITIONS, { 
    errorMap: () => ({ message: "직급을 선택해주세요." }) 
  }),
  academyName: z.string().min(1, "학원 이름은 필수 항목입니다.").max(150),
  region: z.string().min(1, "지역은 필수 항목입니다.").max(100),
});
type ProfileFormSchema = z.infer<typeof profileFormSchema>;

const ProfileSetupPage: React.FC = () => {
    const navigate = useNavigate();

    const isLoadingAuth = useAuthStore(selectIsLoadingAuth);
    const user = useAuthStore(selectUser);

    const [isCheckingProfile, setIsCheckingProfile] = useState(true); // 프로필 확인 API 로딩 상태
    const [isSubmitting, setIsSubmitting] = useState(false); // 폼 제출 API 로딩 상태
    
    const [name, setName] = useState('');
    const [selectedPosition, setSelectedPosition] = useState<PositionType | ''>('');
    const [academyName, setAcademyName] = useState('');
    const [region, setRegion] = useState('');

    const [formErrors, setFormErrors] = useState<z.ZodFormattedError<ProfileFormSchema> | null>(null);
    const [apiErrorMessage, setApiErrorMessage] = useState('');

    useEffect(() => {
        if (!isLoadingAuth && user) {
            const checkProfile = async () => {
                try {
                    const response = await fetch('/api/profiles/exists');
                    if (!response.ok) throw new Error(`API Error: ${response.status}`);
                    
                    const data = await response.json();

                    if (data.exists) {
                        navigate('/', { replace: true });
                    } else {
                        setName(user.user_metadata?.name || ''); // 이름 기본값 설정
                        setIsCheckingProfile(false);
                    }
                } catch (error) {
                    console.error('Failed to check profile:', error);
                    setApiErrorMessage('프로필 확인 중 오류가 발생했습니다. 새로고침 해주세요.');
                    setIsCheckingProfile(false);
                }
            };
            checkProfile();
        } else if (!isLoadingAuth && !user) {
            navigate('/login', { replace: true });
        }
    }, [isLoadingAuth, user, navigate]);

    const handleSaveProfile = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user || isSubmitting) return;
        
        const validationResult = profileFormSchema.safeParse({ name, position: selectedPosition, academyName, region });
        if (!validationResult.success) {
            setFormErrors(validationResult.error.format());
            return;
        }
        
        setFormErrors(null);
        setIsSubmitting(true);
        setApiErrorMessage('');

        try {
            const response = await fetch('/api/profiles/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validationResult.data),
            });
            
            if (response.ok) {
                navigate('/', { replace: true });
            } else {
                const data = await response.json();
                setApiErrorMessage(data.error || '프로필 저장에 실패했습니다.');
            }
        } catch (error) {
            setApiErrorMessage('네트워크 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isPageLoading = isLoadingAuth || isCheckingProfile;
    if (isPageLoading) {
        return (
            <div className="profile-setup-page-wrapper">
                <div className="profile-setup-container" style={{ textAlign: 'center' }}>
                    <h1>사용자 정보를 확인하는 중입니다...</h1>
                </div>
            </div>
        );
    }
    
    return (
        <div className="profile-setup-page-wrapper">
            <div className="login-background-blobs-wrapper">
                <BackgroundBlobs />
            </div>
            <div className="profile-setup-container">
                <h1 className="profile-setup-title">프로필 설정</h1>
                <p className="profile-setup-subtitle">서비스 이용을 위해 추가 정보를 입력해 주세요.</p>
                <form onSubmit={handleSaveProfile} className="profile-setup-form" noValidate>
                    <div className="form-group">
                        <label className="form-label">직급</label>
                        <div className="position-buttons-group">
                            {POSITIONS.map((pos) => (
                                <button type="button" key={pos}
                                    className={`position-button ${selectedPosition === pos ? 'active' : ''}`}
                                    onClick={() => setSelectedPosition(pos)}>
                                    {pos}
                                </button>
                            ))}
                        </div>
                        {formErrors?.position && <p className="error-message">{formErrors.position._errors[0]}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="name" className="form-label">이름</label>
                        <input type="text" id="name" value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="이름을 입력하세요" className="form-input" />
                        {formErrors?.name && <p className="error-message">{formErrors.name._errors[0]}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="academyName" className="form-label">학원 이름</label>
                        <input type="text" id="academyName" value={academyName}
                            onChange={(e) => setAcademyName(e.target.value)}
                            placeholder="학원 이름을 입력하세요" className="form-input" />
                        {formErrors?.academyName && <p className="error-message">{formErrors.academyName._errors[0]}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="region" className="form-label">지역</label>
                        <input type="text" id="region" value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            placeholder="예: 서울특별시 강남구" className="form-input" />
                        {formErrors?.region && <p className="error-message">{formErrors.region._errors[0]}</p>}
                    </div>

                    {apiErrorMessage && <p className="error-message api-error">{apiErrorMessage}</p>}
                    
                    <button type="submit" disabled={isSubmitting} className="submit-button">
                        {isSubmitting ? '저장 중...' : '저장하고 시작하기'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetupPage;
----- ./react/pages/StudentDetailPage.tsx -----
import React from 'react';
import { useParams } from 'react-router';
import './StudentDetailPage.css';

const StudentDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    return (
        <div className="student-detail-page">
            <h1>학생 상세 정보</h1>
            <p>선택된 학생의 ID는 <strong>{id}</strong> 입니다.</p>
            <br />
            <p>이곳에 해당 학생의 모든 정보를 표시하고, 수정/관리하는 UI를 구성할 수 있습니다.</p>
        </div>
    );
};

export default StudentDetailPage;
----- ./react/shared/api/api.utils.ts -----
export async function handleApiResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        let errorBody: { message?: string; error?: string; details?: any } = { message: `API Error: ${res.status}` };
        try {
            errorBody = await res.json();
        } catch (e) {
            console.warn("API error response was not valid JSON.", { status: res.status });
        }
        throw new Error(errorBody.message || errorBody.error || `API Error: ${res.status}`);
    }

    if (res.status === 204) {
        return undefined as T; 
    }

    return res.json();
}
----- ./react/shared/components/GlassPopover.tsx -----
import React, { useEffect, useRef, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import './GlassPopover.css'; // Popover 스타일을 위한 CSS 파일

interface GlassPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    anchorEl: HTMLElement | null; // Popover가 기준으로 할 HTML 요소
    children: ReactNode; // Popover 내부에 표시될 콘텐츠
    placement?: 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start'; // 위치 (간단하게 몇 가지만)
    offsetY?: number; // 세로 간격
    offsetX?: number; // 가로 간격
    className?: string; // [추가] 커스텀 클래스를 위한 prop
}

const GlassPopover: React.FC<GlassPopoverProps> = ({
    isOpen,
    onClose,
    anchorEl,
    children,
    placement = 'bottom-end',
    offsetY = 8,
    offsetX = 0,
    className = '', // [추가]
}) => {
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node) &&
                anchorEl && // 앵커 요소가 있고
                !anchorEl.contains(event.target as Node) // 앵커 요소 클릭이 아닌 경우
            ) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, anchorEl]);

    const getPopoverStyle = (): React.CSSProperties => {
        if (!anchorEl || !popoverRef.current) {
            return { visibility: 'hidden', opacity: 0 };
        }

        const anchorRect = anchorEl.getBoundingClientRect();
        const popoverRect = popoverRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;

        switch (placement) {
            case 'bottom-end':
                top = anchorRect.bottom + offsetY;
                left = anchorRect.right - popoverRect.width + offsetX;
                break;
            case 'bottom-start':
                top = anchorRect.bottom + offsetY;
                left = anchorRect.left + offsetX;
                break;
            case 'top-end':
                top = anchorRect.top - popoverRect.height - offsetY;
                left = anchorRect.right - popoverRect.width + offsetX;
                break;
            case 'top-start':
                top = anchorRect.top - popoverRect.height - offsetY;
                left = anchorRect.left + offsetX;
                break;
            default: // bottom-end as default
                top = anchorRect.bottom + offsetY;
                left = anchorRect.right - popoverRect.width + offsetX;
        }

        if (left + popoverRect.width > window.innerWidth - 10) { // 오른쪽 경계
            left = window.innerWidth - popoverRect.width - 10;
        }
        if (left < 10) { // 왼쪽 경계
            left = 10;
        }
        if (top + popoverRect.height > window.innerHeight - 10) { // 아래쪽 경계
            top = anchorRect.top - popoverRect.height - offsetY; // 위로 변경
        }
        if (top < 10) { // 위쪽 경계
            top = 10;
        }


        return {
            position: 'fixed', // fixed 포지션 사용
            top: `${top}px`,
            left: `${left}px`,
            visibility: isOpen ? 'visible' : 'hidden',
            opacity: isOpen ? 1 : 0,
        };
    };

    if (typeof document === 'undefined') {
        return null; // SSR 환경에서는 렌더링하지 않음
    }
    
    const popoverClassName = `glass-popover ${isOpen ? 'open' : ''} ${className}`.trim();

    return ReactDOM.createPortal(
        <div
            ref={popoverRef}
            className={popoverClassName} // 수정된 클래스명 사용
            style={getPopoverStyle()}
            role="dialog" // 접근성을 위해 역할 명시
            aria-modal="false" // 모달이 아님을 명시
            aria-hidden={!isOpen}
        >
            {children}
        </div>,
        document.body
    );
};

export default GlassPopover;
----- ./react/shared/components/workbench/CodeEditorPanel.tsx -----
import React from 'react';
import Editor from '../../ui/codemirror-editor/Editor';
import './CodeEditorPanel.css';

interface CodeEditorPanelProps {
  title: string;
  content: string;
  onContentChange: (content: string) => void;
  headerActions?: React.ReactNode;
  className?: string;
}

const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({
  title,
  content,
  onContentChange,
  headerActions,
  className = '',
}) => {
  return (
    <div className={`workbench-panel editor-panel ${className}`}>
      <div className="panel-title-container">
        <h2 className="panel-title">{title}</h2>
        {headerActions && <div className="panel-header-actions">{headerActions}</div>}
      </div>
      <div className="panel-content editor-content-wrapper">
        <Editor
          initialContent={content}
          onContentChange={onContentChange}
        />
      </div>
    </div>
  );
};

export default React.memo(CodeEditorPanel);
----- ./react/shared/components/workbench/PreviewPanel.tsx -----
import React from 'react';
import MathpixRenderer from '../../ui/MathpixRenderer';
import './PreviewPanel.css';

interface PreviewPanelProps {
  title: string;
  content: string;
  className?: string;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  title,
  content,
  className = '',
}) => {
  return (
    <div className={`workbench-panel preview-panel ${className}`}>
      <div className="panel-title-container">
        <h2 className="panel-title">{title}</h2>
      </div>
      <div className="panel-content preview-content-wrapper prose">
        <MathpixRenderer text={content} />
      </div>
    </div>
  );
};

export default React.memo(PreviewPanel);
----- ./react/shared/hooks/useColumnPermissions.ts -----
import { useMemo } from 'react';
import { useLocation } from 'react-router';

export const PROBLEM_PUBLISHING_COLUMN_CONFIG = [
  { key: 'problem_category', label: '유형', defaultHidden: false },
  { key: 'difficulty', label: '난이도', defaultHidden: false },
  { key: 'major_chapter_id', label: '대단원', defaultHidden: false },
  { key: 'middle_chapter_id', label: '중단원', defaultHidden: false },
  { key: 'core_concept_id', label: '핵심개념', defaultHidden: false },
  { key: 'source', label: '출처', defaultHidden: true },
  { key: 'grade', label: '학년', defaultHidden: true },
  { key: 'semester', label: '학기', defaultHidden: true },
  { key: 'score', label: '배점', defaultHidden: false },
  { key: 'page', label: '페이지', defaultHidden: false },
  { key: 'problem_type', label: '객/주', defaultHidden: false },
  { key: 'answer', label: '정답', defaultHidden: false },
  { key: 'question_text', label: '문제', defaultHidden: true },
  { key: 'solution_text', label: '해설', defaultHidden: true },
] as const;

export const STUDENT_DASHBOARD_COLUMN_CONFIG = [
  { key: 'grade', label: '학년', defaultHidden: false },
  { key: 'subject', label: '과목', defaultHidden: false },
  { key: 'status', label: '상태', defaultHidden: false },
  { key: 'teacher', label: '담당 강사', defaultHidden: false },
  { key: 'student_phone', label: '학생 연락처', defaultHidden: false },
  { key: 'guardian_phone', label: '학부모 연락처', defaultHidden: false },
  { key: 'school_name', label: '학교명', defaultHidden: false },
  { key: 'tuition', label: '수강료', defaultHidden: false },
  { key: 'admission_date', label: '입원일', defaultHidden: false },
  { key: 'discharge_date', label: '퇴원일', defaultHidden: false },
] as const;

const ROLE_PERMISSIONS = {
  '원장': [...STUDENT_DASHBOARD_COLUMN_CONFIG.map(c => c.key), ...PROBLEM_PUBLISHING_COLUMN_CONFIG.map(c => c.key)],
  '강사': [
    'grade', 'subject', 'status', 'teacher', 'student_phone',
    'school_name', 'admission_date', 'discharge_date',
    ...PROBLEM_PUBLISHING_COLUMN_CONFIG.filter(c => !c.key.includes('text')).map(c => c.key),
  ],
} as const;

type Role = keyof typeof ROLE_PERMISSIONS;

export function useColumnPermissions() {
  const currentUserRole: Role = '원장';
  const location = useLocation();
  const currentPath = location.pathname;

  const { permittedColumnsConfig, allColumnConfig } = useMemo(() => {
    const roleAllowedKeys = ROLE_PERMISSIONS[currentUserRole] || [];
    
    let baseConfig;
    if (currentPath.startsWith('/problem-publishing')) {
      baseConfig = PROBLEM_PUBLISHING_COLUMN_CONFIG;
    } else { 
      baseConfig = STUDENT_DASHBOARD_COLUMN_CONFIG;
    }
    
    const permittedConfig = baseConfig.filter(col => roleAllowedKeys.includes(col.key));

    return { 
      permittedColumnsConfig: permittedConfig,
      allColumnConfig: baseConfig
    };
  }, [currentUserRole, currentPath]);

  const permittedColumnKeys = useMemo(() => 
      new Set(permittedColumnsConfig.map(c => c.key)),
      [permittedColumnsConfig]
  );

  return { 
    permittedColumnsConfig,
    allColumnConfig,
    permittedColumnKeys,
  };
}
----- ./react/shared/hooks/useContinuousChange.ts -----
import { useRef, useCallback } from 'react';

type Direction = 'increase' | 'decrease';

const INITIAL_INTERVAL = 150; // ms
const MIN_INTERVAL = 20;      // ms
const ACCELERATION = 0.95;    // 95%씩 간격 감소 (조금 더 부드러운 가속)

/**
 * 버튼을 누르고 있을 때 숫자를 연속적으로, 가속도 붙여 변경하는 훅.
 * @param onChange - (updater: (prev: number) => number) 형식의 콜백. 이전 값을 받아 새 값을 반환해야 합니다.
 * @param step - 한 번에 변경될 값의 크기
 */
export function useContinuousChange(onChange: (updater: (prev: number) => number) => void, step: number) {
    const intervalRef = useRef<number | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentIntervalRef = useRef(INITIAL_INTERVAL);

    const stopChanging = useCallback(() => {
        if (intervalRef.current) {
            cancelAnimationFrame(intervalRef.current);
            intervalRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const startChanging = useCallback((direction: Direction) => {
        stopChanging();
        currentIntervalRef.current = INITIAL_INTERVAL;

        const change = () => {
            const dynamicStep = direction === 'increase' ? step : -step;
            onChange(prev => parseFloat((prev + dynamicStep * (INITIAL_INTERVAL / currentIntervalRef.current)).toFixed(2)));
            
            intervalRef.current = requestAnimationFrame(change);
        };
        
        const accelerate = () => {
            currentIntervalRef.current = Math.max(MIN_INTERVAL, currentIntervalRef.current * ACCELERATION);
            timeoutRef.current = setTimeout(accelerate, 50); // 50ms 마다 가속
        };
        
        onChange(prev => parseFloat((prev + (direction === 'increase' ? step : -step)).toFixed(2)));
        
        timeoutRef.current = setTimeout(() => {
            intervalRef.current = requestAnimationFrame(change);
            accelerate();
        }, 400);

    }, [onChange, step, stopChanging]);

    const getHandlers = (direction: Direction) => ({
        onMouseDown: (e: React.MouseEvent) => {
            e.preventDefault();
            startChanging(direction);
        },
        onMouseUp: stopChanging,
        onMouseLeave: stopChanging,
        onTouchStart: (e: React.TouchEvent) => {
            e.preventDefault();
            startChanging(direction);
        },
        onTouchEnd: stopChanging,
    });

    return { getHandlers };
}
----- ./react/shared/hooks/useDragToScroll.ts -----
import { useRef, useState, useCallback, useEffect } from 'react';

export function useDragToScroll<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [isDragging, setIsDragging] = useState(false);
    const isDraggingRef = useRef(false);

    const dragStartInfo = useRef({
        startX: 0,
        scrollLeft: 0,
    });

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!(e.target instanceof HTMLElement)) return;

        if (e.target.closest('button, a, input, [role="button"], [role="checkbox"]')) {
            return;
        }

        if (!ref.current || e.button !== 0) return;
        
        e.preventDefault(); 

        isDraggingRef.current = true;
        setIsDragging(true);

        dragStartInfo.current = {
            startX: e.pageX - ref.current.offsetLeft,
            scrollLeft: ref.current.scrollLeft,
        };
    }, []);

    const handleMouseUp = useCallback(() => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        setIsDragging(false);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDraggingRef.current || !ref.current) return;
        e.preventDefault();

        const x = e.pageX - ref.current.offsetLeft;
        const walk = (x - dragStartInfo.current.startX);
        ref.current.scrollLeft = dragStartInfo.current.scrollLeft - walk;
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mouseleave', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mouseleave', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    return { ref, onMouseDown: handleMouseDown, isDragging };
}
----- ./react/shared/hooks/useVisibleColumns.ts -----
import { useMemo } from 'react';
import { useUIStore } from '../store/uiStore';
import { useColumnPermissions } from './useColumnPermissions';

/**
 * 권한과 사용자 설정을 조합하여
 * 각 컬럼의 최종 표시 여부를 결정하는 훅
 */
export function useVisibleColumns() {
  const { permittedColumnKeys, allColumnConfig } = useColumnPermissions();
  const { columnVisibility: userPreferences } = useUIStore();

  const finalVisibility = useMemo(() => {
    const visibilityMap: Record<string, boolean> = {};

    allColumnConfig.forEach(col => {
      const { key } = col;
      const hasPermission = permittedColumnKeys.has(key);
      const userPrefersVisible = userPreferences[key] ?? !col.defaultHidden; // [수정] UI 상태가 없으면 defaultHidden을 기준으로 판단
      visibilityMap[key] = hasPermission && userPrefersVisible;
    });

    visibilityMap['header_action_button'] = true;
    visibilityMap['student_name'] = true;
    visibilityMap['actions'] = true;
    visibilityMap['checkbox'] = true;
    visibilityMap['question_number'] = true;

    return visibilityMap;

  }, [permittedColumnKeys, allColumnConfig, userPreferences]);

  return finalVisibility;
}
----- ./react/shared/lib/AuthInitializer.tsx -----

import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

const AuthInitializer: React.FC = () => {
  const initializeAuth = useAuthStore.getState().initializeAuthListener;

  useEffect(() => {
    initializeAuth();

    
  }, [initializeAuth]); // 의존성 배열은 안정성을 위해 유지합니다.

  return null; 
};

export default AuthInitializer;
----- ./react/shared/lib/ProtectedRoute.tsx -----
import { Navigate, Outlet } from 'react-router';
import { useAuthStore, selectIsAuthenticated } from '../store/authStore'; // authStore 경로 확인

const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
----- ./react/shared/lib/supabase.ts -----
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);
----- ./react/shared/store/authStore.ts -----
import { create } from 'zustand';
import { supabase } from '../lib/supabase'; // 실제 Supabase 클라이언트 인스턴스 경로로 수정해주세요.
import type { User as SupabaseUser, Session, AuthChangeEvent, Subscription } from '@supabase/supabase-js';

export type User = SupabaseUser;

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoadingAuth: boolean; // 초기 인증 상태 확인 및 실시간 변경 시 로딩 상태
  authSubscription: Subscription | null; // onAuthStateChange 구독 객체 (클린업용)
  authError: string | null; // 인증 관련 에러 메시지 (선택적)
}

interface AuthActions {
  initializeAuthListener: () => Promise<void>; // 앱 시작 시 인증 리스너 초기화
  clearAuthSubscription: () => void; // 구독 해제
  signInWithKakao: () => Promise<void>; // 카카오 OAuth 로그인
  signOut: () => Promise<void>; // 로그아웃
  clearAuthError: () => void; // 인증 에러 메시지 초기화 (선택적)
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  session: null,
  isLoadingAuth: true, // 앱 시작 시 인증 상태를 확인해야 하므로 true로 시작
  authSubscription: null,
  authError: null,

  initializeAuthListener: async () => {
    if (get().authSubscription || !get().isLoadingAuth) {
      if (get().authSubscription) return;
    }
    set({ isLoadingAuth: true, authError: null }); // 리스너 초기화 시작 시 로딩 및 에러 초기화

    try {
      const { data: { session: initialSession }, error: initialError } = await supabase.auth.getSession();

      if (initialError) {
        console.error('Error getting initial session for authStore:', initialError.message);
        set({ user: null, session: null, isLoadingAuth: false, authError: initialError.message });
      } else {
        set({
          user: initialSession?.user ?? null,
          session: initialSession,
          isLoadingAuth: false,
          authError: null,
        });
      }
    } catch (e: any) {
      console.error('Exception during initial session fetch for authStore:', e);
      set({ user: null, session: null, isLoadingAuth: false, authError: e.message || 'Unknown error during initial session fetch.' });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        set({
          user: session?.user ?? null,
          session,
          isLoadingAuth: false, // 실시간 변경이므로 로딩 완료 상태
          authError: null,      // 이벤트 발생 시 이전 에러는 클리어
        });

      }
    );

    set({ authSubscription: subscription, isLoadingAuth: false }); // 리스너 설정 완료 시 로딩 종료
  },

  clearAuthSubscription: () => {
    const subscription = get().authSubscription;
    if (subscription) {
      subscription.unsubscribe();
      set({ authSubscription: null });
    }
  },

  signInWithKakao: async () => {
    set({ isLoadingAuth: true, authError: null }); // OAuth 시작 시 로딩 및 에러 초기화
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/profilesetup`,
        },
      });
      if (error) {
        console.error('Kakao OAuth error in authStore:', error.message);
        set({ isLoadingAuth: false, authError: error.message });
      }
    } catch (e: any) {
      console.error('Exception during Kakao sign in:', e);
      set({ isLoadingAuth: false, authError: e.message || 'Unknown error during Kakao sign in.' });
    }
  },

  signOut: async () => {
    set({ isLoadingAuth: true, authError: null }); // 로그아웃 시작 시 로딩 및 에러 초기화
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out in authStore:', error.message);
        set({ isLoadingAuth: false, authError: error.message });
      } else {
        set({ user: null, session: null, isLoadingAuth: false, authError: null });
      }
    } catch (e: any) {
      console.error('Exception during sign out:', e);
      set({ user: null, session: null, isLoadingAuth: false, authError: e.message || 'Unknown error during sign out.' });
    }
  },

  clearAuthError: () => {
    set({ authError: null });
  },
}));

/**
 * 사용자가 인증되었고, 인증 상태 로딩이 완료되었는지 여부를 반환합니다.
 */
export const selectIsAuthenticated = (state: AuthState): boolean => !state.isLoadingAuth && !!state.user;

/**
 * 단순히 사용자 객체의 존재 여부로 인증 상태를 판단합니다. (로딩 상태 미고려)
 */
export const selectUserExists = (state: AuthState): boolean => !!state.user;

/**
 * 현재 인증 관련 작업(초기 세션 확인, 상태 변경)이 로딩 중인지 여부를 반환합니다.
 */
export const selectIsLoadingAuth = (state: AuthState): boolean => state.isLoadingAuth;

/**
 * 현재 사용자 객체를 반환합니다. 인증되지 않았거나 로딩 중이면 null일 수 있습니다.
 */
export const selectUser = (state: AuthState): User | null => state.user;

/**
 * 현재 세션 객체를 반환합니다. 인증되지 않았거나 로딩 중이면 null일 수 있습니다.
 */
export const selectSession = (state: AuthState): Session | null => state.session;

/**
 * 현재 인증 관련 에러 메시지를 반환합니다. 에러가 없으면 null입니다.
 */
export const selectAuthError = (state: AuthState): string | null => state.authError;
----- ./react/shared/store/layout.config.ts -----
/**
 * 각 페이지별로 우측 사이드바에 표시될 버튼의 종류를 정의합니다.
 */
export type SidebarButtonType = 'register' | 'settings' | 'prompt' | 'latexHelp' | 'search' | 'jsonView'; // [추가] 'jsonView'

/**
 * 각 페이지의 레이아웃 설정을 정의하는 인터페이스입니다.
 */
export interface PageLayoutConfig {
  sidebarButtons?: {
    [key in SidebarButtonType]?: {
      tooltip: string; // 버튼에 표시될 툴팁 텍스트
    };
  };
}

/**
 * 경로(path)를 키로, 해당 경로의 레이아웃 설정을 값으로 갖는 맵(map)입니다.
 * 이 파일이 "어떤 페이지에 어떤 사이드바 버튼이 필요한가"에 대한 유일한 정보 소스(Single Source of Truth)가 됩니다.
 */
export const layoutConfigMap: Record<string, PageLayoutConfig> = {
  '/dashboard': {
    sidebarButtons: {
      register: { tooltip: '신입생 등록' },
      settings: { tooltip: '테이블 설정' },
    },
  },
  '/problem-workbench': {
    sidebarButtons: {
      prompt: { tooltip: '프롬프트 모음' },
      latexHelp: { tooltip: 'LaTeX 문법 도움말' },
      settings: { tooltip: '문제 작업 설정' },
    },
  },
  '/json-renderer': {
    sidebarButtons: {
      prompt: { tooltip: '프롬프트 모음' },
      settings: { tooltip: 'JSON 렌더러 설정' },
    },
  },
  '/problem-publishing': {
    sidebarButtons: {
      search: { tooltip: '문제 검색 및 필터' },
      jsonView: { tooltip: 'JSON으로 변환' },
      prompt: { tooltip: '프롬프트 모음' }, // [추가] 프롬프트 버튼 설정
      settings: { tooltip: '테이블 컬럼 설정' },
      latexHelp: { tooltip: 'LaTeX 문법 도움말' }
    }
  }
};
----- ./react/shared/store/layoutStore.ts -----
import { create } from 'zustand';
import { useMemo } from 'react';
import { layoutConfigMap, type PageLayoutConfig } from './layout.config';
import type { Student } from '../../entities/student/model/useStudentDataWithRQ';
import type { ProcessedProblem } from '../../features/problem-publishing';

export interface StoredSearchProps {
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    activeFilters: Record<string, Set<string>>;
    onFilterChange: (key: string, value: string) => void;
    onResetFilters: () => void;
    suggestionGroups: string;
    onToggleFiltered?: () => void;
    onCreateProblemSet?: () => void;
    showActionControls?: boolean;
    onHide?: () => void;
    selectedCount?: number;
    isSelectionComplete?: boolean;
}

interface RegisteredPageActions {
  openRegisterSidebar: () => void;
  openSettingsSidebar: () => void;
  openPromptSidebar: () => void;
  openLatexHelpSidebar: () => void;
  openSearchSidebar: () => void; 
  openJsonViewSidebar: () => void;
  openEditSidebar: (student: Student) => void;
  onClose: () => void;
}

interface SidebarContentConfig {
    type: 'register' | 'settings' | 'prompt' | 'problemEditor' | 'edit' | 'latexHelp' | 'jsonViewer' | null;
    props?: Record<string, any>;
}

interface RightSidebarState {
    contentConfig: SidebarContentConfig;
    isExtraWide: boolean;
}

interface LayoutState {
  rightSidebar: RightSidebarState; 
  currentPageConfig: PageLayoutConfig;
  pageActions: Partial<RegisteredPageActions>;
  searchBoxProps: StoredSearchProps | null;
}

interface LayoutActions {
  setRightSidebarConfig: (config: { contentConfig: SidebarContentConfig, isExtraWide?: boolean }) => void;
  updateLayoutForPath: (path: string) => void;
  registerPageActions: (actions: Partial<RegisteredPageActions>) => void;
  setSearchBoxProps: (props: StoredSearchProps | null) => void;
}

const initialPageActions: Partial<RegisteredPageActions> = {
    openRegisterSidebar: () => console.warn('openRegisterSidebar action not registered.'),
    openSettingsSidebar: () => console.warn('openSettingsSidebar action not registered.'),
    openPromptSidebar: () => console.warn('openPromptSidebar action not registered.'),
    openLatexHelpSidebar: () => console.warn('openLatexHelpSidebar action not registered.'),
    openSearchSidebar: () => console.warn('openSearchSidebar action not registered.'),
    openJsonViewSidebar: () => console.warn('openJsonViewSidebar action not registered.'),
    openEditSidebar: (student: Student) => console.warn('openEditSidebar action not registered for student:', student.id),
    onClose: () => console.warn('onClose action not registered.'),
};

export const useLayoutStore = create<LayoutState & LayoutActions>((set, get) => ({
  rightSidebar: {
    contentConfig: { type: null },
    isExtraWide: false,
  },
  currentPageConfig: {},
  pageActions: initialPageActions,
  searchBoxProps: null,

  setRightSidebarConfig: (config) => {
    if (!config.contentConfig || !config.contentConfig.type) {
      set({ rightSidebar: { contentConfig: { type: null }, isExtraWide: false } });
      return;
    }
    
    set({
      rightSidebar: {
        contentConfig: config.contentConfig,
        isExtraWide: config.isExtraWide ?? false,
      }
    });
  },

  updateLayoutForPath: (path) => {
    const newConfig = Object.entries(layoutConfigMap)
        .find(([key]) => path.startsWith(key))?.[1] || {};
    
    set({ currentPageConfig: newConfig });
  },

  registerPageActions: (actions) => {
    set(state => ({
        pageActions: { ...state.pageActions, ...actions }
    }));
  },
  
  setSearchBoxProps: (props) => set({ searchBoxProps: props }),
}));


export const selectRightSidebarConfig = (state: LayoutState) => state.rightSidebar;
export const selectSearchBoxProps = (state: LayoutState) => state.searchBoxProps;

interface SidebarTrigger {
    onClick: () => void;
    tooltip: string;
}

interface SidebarTriggers {
    onClose: (() => void) | undefined;
    registerTrigger?: SidebarTrigger;
    searchTrigger?: SidebarTrigger;
    settingsTrigger?: SidebarTrigger;
    promptTrigger?: SidebarTrigger;
    latexHelpTrigger?: SidebarTrigger;
    jsonViewTrigger?: SidebarTrigger;
}

export const useSidebarTriggers = (): SidebarTriggers => {
    const currentPageConfig = useLayoutStore(state => state.currentPageConfig);
    const pageActions = useLayoutStore(state => state.pageActions);

    const triggers = useMemo(() => {
        const result: SidebarTriggers = { onClose: pageActions.onClose };

        if (currentPageConfig.sidebarButtons?.register && pageActions.openRegisterSidebar) {
            result.registerTrigger = {
                onClick: pageActions.openRegisterSidebar,
                tooltip: currentPageConfig.sidebarButtons.register.tooltip,
            };
        }
        if (currentPageConfig.sidebarButtons?.search && pageActions.openSearchSidebar) {
            result.searchTrigger = {
                onClick: pageActions.openSearchSidebar,
                tooltip: currentPageConfig.sidebarButtons.search.tooltip,
            };
        }
        if (currentPageConfig.sidebarButtons?.settings && pageActions.openSettingsSidebar) {
            result.settingsTrigger = {
                onClick: pageActions.openSettingsSidebar,
                tooltip: currentPageConfig.sidebarButtons.settings.tooltip,
            };
        }
        if (currentPageConfig.sidebarButtons?.prompt && pageActions.openPromptSidebar) {
            result.promptTrigger = {
                onClick: pageActions.openPromptSidebar,
                tooltip: currentPageConfig.sidebarButtons.prompt.tooltip,
            };
        }
        if (currentPageConfig.sidebarButtons?.latexHelp && pageActions.openLatexHelpSidebar) {
            result.latexHelpTrigger = {
                onClick: pageActions.openLatexHelpSidebar,
                tooltip: currentPageConfig.sidebarButtons.latexHelp.tooltip,
            };
        }
        if (currentPageConfig.sidebarButtons?.jsonView && pageActions.openJsonViewSidebar) {
            result.jsonViewTrigger = {
                onClick: pageActions.openJsonViewSidebar,
                tooltip: currentPageConfig.sidebarButtons.jsonView.tooltip,
            };
        }
        return result;
    }, [currentPageConfig, pageActions]);

    return triggers;
};
----- ./react/shared/store/uiStore.ts -----
import { create } from 'zustand';
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { PROBLEM_PUBLISHING_COLUMN_CONFIG } from '../hooks/useColumnPermissions';

const breakpoints = {
    mobile: 768,
    tablet: 1024,
};

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export type ProblemPublishingColumnKey = typeof PROBLEM_PUBLISHING_COLUMN_CONFIG[number]['key'];

const getCurrentBreakpoint = (): Breakpoint => {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width <= breakpoints.mobile) return 'mobile';
    if (width <= breakpoints.tablet) return 'tablet';
    return 'desktop';
};

export interface UIState {
    isRightSidebarExpanded: boolean;
    toggleRightSidebar: () => void;
    setRightSidebarExpanded: (expanded: boolean) => void;
    isRightSidebarExtraWide: boolean;
    setRightSidebarExtraWide: (isWide: boolean) => void;
    isLeftSidebarExpanded: boolean;
    toggleLeftSidebar: () => void;
    setLeftSidebarExpanded: (expanded: boolean) => void;
    mobileSidebarType: 'left' | 'right' | null;
    openMobileSidebar: (type: 'left' | 'right') => void;
    closeMobileSidebar: () => void;
    currentBreakpoint: Breakpoint;
    updateBreakpoint: () => void;
    columnVisibility: Record<string, boolean>;
    toggleColumnVisibility: (key: string) => void;
    setColumnVisibility: (visibility: Record<string, boolean>) => void;
    problemPublishingColumnOrder: ProblemPublishingColumnKey[];
    setProblemPublishingColumnOrder: (newOrder: ProblemPublishingColumnKey[]) => void;
}

type PersistedUIState = {
    columnVisibility: Record<string, boolean>;
    problemPublishingColumnOrder: ProblemPublishingColumnKey[];
}

const log = (action: string, payload?: any) => {
    console.log(`[UIStore] Action: ${action}`, payload !== undefined ? { payload } : '');
};


export const useUIStore = create(
    subscribeWithSelector(
        persist<UIState, [], [], PersistedUIState>(
            (set, get) => ({
                isRightSidebarExpanded: false,
                toggleRightSidebar: () => {
                    log('toggleRightSidebar');
                    const currentBp = get().currentBreakpoint;
                    if (currentBp === 'mobile') {
                        if (get().mobileSidebarType === 'right') {
                            get().closeMobileSidebar();
                        } else {
                            get().openMobileSidebar('right');
                        }
                    } else {
                        set((state) => ({ isRightSidebarExpanded: !state.isRightSidebarExpanded }));
                    }
                },
                setRightSidebarExpanded: (expanded: boolean) => {
                    log('setRightSidebarExpanded', expanded);
                    const { currentBreakpoint, openMobileSidebar, closeMobileSidebar } = get();
                    if (currentBreakpoint === 'mobile') {
                        if (expanded) {
                            openMobileSidebar('right');
                        } else {
                            closeMobileSidebar();
                        }
                    } else {
                        set({ isRightSidebarExpanded: expanded });
                    }
                },
        
                isRightSidebarExtraWide: false,
                setRightSidebarExtraWide: (isWide) => {
                    log('setRightSidebarExtraWide', isWide);
                    set({ isRightSidebarExtraWide: isWide });
                },
        
                isLeftSidebarExpanded: true,
                toggleLeftSidebar: () => {
                    log('toggleLeftSidebar');
                    const currentBp = get().currentBreakpoint;
                    if (currentBp === 'mobile') {
                        if (get().mobileSidebarType === 'left') {
                            get().closeMobileSidebar();
                        } else {
                            get().openMobileSidebar('left');
                        }
                    } else {
                        set((state) => ({ isLeftSidebarExpanded: !state.isLeftSidebarExpanded }));
                    }
                },
                setLeftSidebarExpanded: (expanded) => {
                    log('setLeftSidebarExpanded', expanded);
                    set({ isLeftSidebarExpanded: expanded });
                },
        
                mobileSidebarType: null,
                openMobileSidebar: (type) => {
                    log('openMobileSidebar', type);
                    set({ mobileSidebarType: type });
                },
                closeMobileSidebar: () => {
                    if (get().mobileSidebarType !== null) {
                        log('closeMobileSidebar');
                        set({ mobileSidebarType: null });
                    }
                },
                
                currentBreakpoint: getCurrentBreakpoint(),
                updateBreakpoint: () => {
                    const newBreakpoint = getCurrentBreakpoint();
                    const oldBreakpoint = get().currentBreakpoint;
                    if (newBreakpoint !== oldBreakpoint) {
                        log('updateBreakpoint', { from: oldBreakpoint, to: newBreakpoint });
                        set({ currentBreakpoint: newBreakpoint });
                        get().closeMobileSidebar();
        
                        if (newBreakpoint === 'desktop') {
                            get().setLeftSidebarExpanded(true);
                        } else if (newBreakpoint === 'tablet') {
                            get().setLeftSidebarExpanded(false);
                        }
                    }
                },
        
                columnVisibility: {},
                toggleColumnVisibility: (key: string) => {
                    log('toggleColumnVisibility', key);
                    set((state) => {
                        const config = PROBLEM_PUBLISHING_COLUMN_CONFIG.find(c => c.key === key);
                        const isCurrentlyVisible = state.columnVisibility[key] ?? !(config?.defaultHidden ?? false);
                        return {
                            columnVisibility: {
                                ...state.columnVisibility,
                                [key]: !isCurrentlyVisible,
                            }
                        };
                    });
                },
                setColumnVisibility: (visibility) => {
                    log('setColumnVisibility', visibility);
                    set({ columnVisibility: visibility });
                },
        
                problemPublishingColumnOrder: PROBLEM_PUBLISHING_COLUMN_CONFIG.map(col => col.key),
                setProblemPublishingColumnOrder: (newOrder: ProblemPublishingColumnKey[]) => {
                    log('setProblemPublishingColumnOrder', newOrder);
                    set({ problemPublishingColumnOrder: newOrder });
                },
            }),
            {
                name: 'ui-settings-storage',
                storage: createJSONStorage(() => localStorage), 
                
                partialize: (state): PersistedUIState => ({
                    columnVisibility: state.columnVisibility,
                    problemPublishingColumnOrder: state.problemPublishingColumnOrder,
                }),

                merge: (persistedState, currentState) => {
                    const typedPersistedState = persistedState as Partial<UIState>;
                    
                    const persistedOrder = typedPersistedState.problemPublishingColumnOrder || [];
                    const persistedOrderSet = new Set(persistedOrder);
                    const newColumnsInCurrentState = currentState.problemPublishingColumnOrder.filter(
                        key => !persistedOrderSet.has(key)
                    );

                    return {
                        ...currentState,
                        ...typedPersistedState,
                        problemPublishingColumnOrder: [...persistedOrder, ...newColumnsInCurrentState],
                    };
                },

                onRehydrateStorage: () => (state) => {
                    if (state) {
                        console.log('[UIStore] Hydration finished from localStorage.');
                    }
                }
            }
        )
    )
);

if (typeof window !== 'undefined') {
    const { updateBreakpoint, setLeftSidebarExpanded, currentBreakpoint } = useUIStore.getState();

    window.addEventListener('resize', updateBreakpoint);

    const initialBp = currentBreakpoint;
    if (initialBp === 'desktop') {
        setLeftSidebarExpanded(true);
    } else {
        setLeftSidebarExpanded(false);
    }
    useUIStore.getState().updateBreakpoint();
}
----- ./react/shared/ui/actionbutton/ActionButton.tsx -----
import React, { forwardRef } from 'react'; // React.forwardRef import
import './ActionButton.css';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    'aria-label'?: string;
}

const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(({ 
    children, 
    className, 
    ...props 
}, ref) => { // 두 번째 인자로 ref를 받습니다.
    const combinedClassName = `action-button ${className || ''}`.trim();

    return (
        <button ref={ref} className={combinedClassName} {...props}>
            {children}
        </button>
    );
});

ActionButton.displayName = 'ActionButton';

export default ActionButton;
----- ./react/shared/ui/Badge/Badge.tsx -----
import React from 'react';
import './Badge.css'; // Badge의 기본 구조/레이아웃 CSS

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ children, className = '', ...props }) => {
    return (
        <span className={`badge ${className}`} {...props}>
            {children}
        </span>
    );
};

export default Badge;
----- ./react/shared/ui/glasstable/GlassTable.tsx -----
import React, { forwardRef } from 'react';
import './GlassTable.css';
import { LuArrowDown, LuArrowUp } from 'react-icons/lu';

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: React.ReactNode;
  render?: (item: T) => React.ReactNode;
  width?: string;
  isSortable?: boolean;
  className?: string;
  dataLabel?: string;
}

interface GlassTableProps<T extends { id: string | number }> {
  columns: TableColumn<T>[];
  data: T[];
  caption?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  sortConfig?: SortConfig | null;
  onSort?: (key: string) => void;
  scrollContainerProps?: React.HTMLAttributes<HTMLDivElement>;
}

function GlassTableInner<T extends { id: string | number }>(
  {
    columns,
    data,
    caption,
    isLoading = false,
    emptyMessage = "표시할 데이터가 없습니다.",
    sortConfig,
    onSort,
    scrollContainerProps,
  }: GlassTableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {

  const renderSortArrow = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' 
      ? <LuArrowUp className="sort-arrow" /> 
      : <LuArrowDown className="sort-arrow" />;
  };

  return (
    <div className="glass-table-wrapper">
      <div
        ref={ref}
        {...scrollContainerProps}
        className={`glass-table-scroll-container ${scrollContainerProps?.className || ''}`.trim()}
      >
        <table className="glass-table">
          {caption && <caption className="glass-table-caption">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width }}
                  className={`${col.isSortable ? 'sortable' : ''} ${col.className || ''}`.trim()}
                >
                  {/* [핵심 수정] 모든 th 내용을 .cell-content로 감쌈 */}
                  <div className="cell-content">
                    {col.isSortable && onSort ? (
                      <button type="button" onClick={() => onSort(String(col.key))} className="sort-header-button">
                        {col.header}
                        {renderSortArrow(String(col.key))}
                      </button>
                    ) : (
                      col.header
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={columns.length} className="loading-cell"><div className="spinner"></div><span>데이터를 불러오는 중...</span></td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length} className="empty-cell">{emptyMessage}</td></tr>
            ) : (
              data.map((item) => (
                <tr key={item.id}>
                  {columns.map((col, colIndex) => (
                    <td 
                      key={`${item.id}-${String(col.key)}-${colIndex}`} 
                      className={col.className || ''}
                      data-label={col.dataLabel} 
                    >
                      {/* [핵심 수정] 모든 td 내용을 .cell-content로 감쌈 */}
                      <div className="cell-content">
                        {col.render ? col.render(item) : String(item[col.key as keyof T] ?? '')}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const GlassTable = forwardRef(GlassTableInner) as <T extends { id: string | number }>(
  props: GlassTableProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement;

export default GlassTable;
----- ./react/shared/ui/loadingbutton/LoadingButton.tsx -----
import React, { forwardRef } from 'react';
import '../actionbutton/ActionButton.css'; // ActionButton의 CSS를 재활용
import './LoadingButton.css'; // LoadingButton 전용 CSS

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading: boolean;
    loadingText?: string;
    children: React.ReactNode;
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(({
    isLoading,
    loadingText = '처리 중...',
    children,
    className,
    ...props
}, ref) => {
    const combinedClassName = `action-button ${className || ''} ${isLoading ? 'loading' : ''}`.trim();

    return (
        <button
            ref={ref}
            className={combinedClassName}
            disabled={props.disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <span className="spinner" />
                    <span className="loading-text">{loadingText}</span>
                </>
            ) : (
                children
            )}
        </button>
    );
});
LoadingButton.displayName = 'LoadingButton';

export default LoadingButton;
----- ./react/shared/ui/MathpixRenderer.tsx -----
import React, { useState, useEffect, useMemo } from 'react';

declare global {
  interface Window {
    markdownToHTML: (text: string, options?: object) => string;
    mathpixReady: Promise<boolean>;
    loadMathJax: () => boolean;
  }
}

interface MathpixRendererProps {
  text: string;
  options?: object;
}

const MathpixRenderer: React.FC<MathpixRendererProps> = ({ text, options = {} }) => {
  const [html, setHtml] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const memoizedOptions = useMemo(() => ({
    htmlTags: true,
    width: 800,
    ...options,
  }), [options]);

  useEffect(() => {
    let isCancelled = false;
    
    const initialize = async () => {
      try {
        await window.mathpixReady;
        if (isCancelled) return;
        
        if (typeof window.markdownToHTML === 'function') {
          setStatus('ready');
        } else {
          setStatus('error');
          console.error('[MathpixRenderer] Error: window.markdownToHTML function not found.');
        }
      } catch (err) {
        if (!isCancelled) {
          setStatus('error');
          console.error('[MathpixRenderer] Error: The mathpixReady Promise was rejected.', err);
        }
      }
    };
    
    initialize();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status === 'ready') {
      try {
        const renderedHtml = window.markdownToHTML(text, memoizedOptions);
        setHtml(renderedHtml);
      } catch (err) {
        console.error("Markdown rendering error:", err);
        setHtml('<p style="color: red;">콘텐츠를 렌더링하는 중 오류가 발생했습니다.</p>');
      }
    }
  }, [status, text, memoizedOptions]);

  
  if (status === 'error') {
    return <p style={{ color: 'red' }}>미리보기 라이브러리를 로드할 수 없습니다.</p>;
  }

  if (status === 'loading') {
    return <p>미리보기 라이브러리 로딩 중...</p>;
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export default MathpixRenderer;
----- ./react/shared/ui/modal/Modal.tsx -----
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { LuX } from 'react-icons/lu';
import ActionButton from '../actionbutton/ActionButton';
import LoadingButton from '../loadingbutton/LoadingButton';
import './Modal.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    children: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isConfirming?: boolean;
    hideFooter?: boolean;
    size?: 'small' | 'medium' | 'large';
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    children,
    confirmText = '확인',
    cancelText = '취소',
    isConfirming = false,
    hideFooter = false,
    size = 'medium'
}) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    const modalContent = (
        <div className="modal-backdrop" onClick={onClose}>
            <div className={`modal-content-wrapper ${size}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close-button" onClick={onClose} aria-label="닫기">
                        <LuX size={22} />
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {!hideFooter && (
                    <div className="modal-footer">
                        <ActionButton onClick={onClose} disabled={isConfirming}>
                            {cancelText}
                        </ActionButton>
                        {onConfirm && (
                            <LoadingButton
                                onClick={onConfirm}
                                isLoading={isConfirming}
                                className="primary destructive"
                                loadingText="삭제중..."
                            >
                                {confirmText}
                            </LoadingButton>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default Modal;
----- ./react/shared/ui/TableCellCheckbox/TableCellCheckbox.tsx -----
import React from 'react';
import { LuCircle, LuCircleCheckBig } from 'react-icons/lu';


interface CheckboxProps {
    isChecked: boolean;
    onToggle: () => void;
    iconSize?: number;
    checkedColor?: string;
    uncheckedColor?: string;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    ariaLabel?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
    isChecked,
    onToggle,
    iconSize = 20,
    checkedColor = '#3498db',
    uncheckedColor = '#ccc',
    disabled = false,
    className = '',
    style = {},
    ariaLabel = 'Checkbox',
}) => {
    const handleClick = () => {
        if (!disabled) {
            onToggle();
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (!disabled && (event.key === ' ' || event.key === 'Enter')) {
            event.preventDefault();
            onToggle();
        }
    };

    const currentIconColor = isChecked ? checkedColor : uncheckedColor;

    const buttonClassName = `
    checkbox-component ${''}
    ${disabled ? 'checkbox-disabled' : 'checkbox-enabled'} ${''}
    ${className} ${''}
  `.trim().replace(/\s+/g, ' ');

    const buttonStyle: React.CSSProperties = {
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
        ...style,
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={buttonClassName}
            style={buttonStyle}
            role="checkbox"
            aria-checked={isChecked}
            aria-label={ariaLabel}
        >
            {isChecked ? (
                <LuCircleCheckBig size={iconSize} color={currentIconColor} aria-hidden="true" />
            ) : (
                <LuCircle size={iconSize} color={currentIconColor} aria-hidden="true" />
            )}
        </button>
    );
};

export default Checkbox;
----- ./react/widgets/ExamPreviewWidget.tsx -----
import React, { useMemo } from 'react';
import ExamPage from '../entities/exam/ui/ExamPage';
import QuickAnswerPage from '../entities/exam/ui/QuickAnswerPage';
import SolutionPage from '../entities/exam/ui/SolutionPage';
import type { LayoutItem, ProcessedProblem } from '../features/problem-publishing/model/useProblemPublishing';
import './ExamPreviewWidget.css';

const ANSWERS_PER_PAGE = 80;

interface ExamPreviewWidgetProps {
    distributedPages: LayoutItem[][];
    distributedSolutionPages: LayoutItem[][];
    allProblems: ProcessedProblem[];
    selectedProblems: ProcessedProblem[];
    placementMap: Map<string, { page: number; column: number }>;
    solutionPlacementMap: Map<string, { page: number; column: number }>;
    headerInfo: any;
    
    useSequentialNumbering: boolean;
    baseFontSize: string;
    contentFontSizeEm: number;
    contentFontFamily: string;
    
    onHeightUpdate: (uniqueId: string, height: number) => void;
    onProblemClick: (problem: ProcessedProblem) => void;
    onHeaderUpdate: (targetId: string, field: string, value: any) => void;
    onDeselectProblem: (uniqueId:string) => void;
    measuredHeights: Map<string, number>;
}

const ExamPreviewWidget: React.FC<ExamPreviewWidgetProps> = (props) => {
    const { 
        distributedPages = [],
        distributedSolutionPages = [],
        allProblems,
        selectedProblems = [],
        placementMap, 
        solutionPlacementMap,
        onHeightUpdate,
    } = props;
    
    const latestProblemsMap = useMemo(() => 
        new Map(allProblems.map(p => [p.uniqueId, p])),
        [allProblems]
    );

    const distributedAnswerPages = React.useMemo(() => {
        if (selectedProblems.length === 0) return [];
        const pages: ProcessedProblem[][] = [];
        for (let i = 0; i < selectedProblems.length; i += ANSWERS_PER_PAGE) {
            pages.push(selectedProblems.slice(i, i + ANSWERS_PER_PAGE));
        }
        return pages;
    }, [selectedProblems]);

    const totalProblemPages = distributedPages.length;
    const totalAnswerPages = distributedAnswerPages.length;
    const totalSolutionPages = distributedSolutionPages.length;
    const totalPages = totalProblemPages + totalAnswerPages + totalSolutionPages;

    if (selectedProblems.length === 0) {
         return (
            <div className="status-message">
                상단 테이블에서 문제를 선택해주세요.
            </div>
        );
    }
    
    if (distributedPages.length === 0 && selectedProblems.length > 0) {
        return <div className="status-message">시험지 구성 중...</div>;
    }

    return (
        <div className="exam-preview-widget">
            <>
                {/* 1. 문제 페이지 렌더링 */}
                {distributedPages.map((pageItems, pageIndex) => {
                    const pageProblems = pageItems
                        .filter((item): item is Extract<LayoutItem, { type: 'problem' }> => item.type === 'problem')
                        .map(item => latestProblemsMap.get(item.data.uniqueId))
                        .filter((p): p is ProcessedProblem => !!p);

                    return (
                        <div key={`page-container-${pageIndex}`} id={`page-${pageIndex + 1}`} className="page-container">
                            <ExamPage {...props} allProblems={allProblems} pageNumber={pageIndex + 1} totalPages={totalPages} problems={pageProblems} placementMap={placementMap} />
                        </div>
                    );
                })}
                
                {/* 2. 빠른 정답 페이지 렌더링 */}
                {distributedAnswerPages.map((pageProblems, pageIndex) => {
                    const pageNumber = totalProblemPages + pageIndex + 1;
                    return (
                        <div key={`quick-answer-page-${pageIndex}`} id={`page-${pageNumber}`} className="page-container">
                            <QuickAnswerPage {...props} allProblems={allProblems} pageNumber={pageNumber} totalPages={totalPages} problems={pageProblems} />
                        </div>
                    );
                })}
                
                {/* 3. 해설 페이지 렌더링 */}
                {distributedSolutionPages.map((pageItems, pageIndex) => {
                    const pageNumber = totalProblemPages + totalAnswerPages + pageIndex + 1;

                    const updatedPageItems = pageItems.map(item => {
                        if (item.type === 'solutionChunk') {
                            const latestParentProblem = latestProblemsMap.get(item.data.parentProblem.uniqueId);
                            if (latestParentProblem) {
                                return {
                                    ...item,
                                    data: {
                                        ...item.data,
                                        parentProblem: latestParentProblem
                                    }
                                };
                            }
                        }
                        return item;
                    }).filter((item): item is LayoutItem => !!item);

                    return (
                        <div key={`solution-page-container-${pageIndex}`} id={`page-${pageNumber}`} className="page-container">
                            <SolutionPage 
                                {...props} 
                                allProblems={allProblems}
                                pageNumber={pageNumber} 
                                totalPages={totalPages} 
                                items={updatedPageItems}
                                placementMap={solutionPlacementMap}
                                onHeightUpdate={onHeightUpdate} 
                            />
                        </div>
                    );
                })}
            </>
        </div>
    );
};

export default React.memo(ExamPreviewWidget);
----- ./react/widgets/FilteredProblemHeader/FilteredProblemHeader.tsx -----
import React, { useMemo, ReactNode, useState, useCallback } from 'react';
import type { ProcessedProblem } from '../../features/problem-publishing/model/problemPublishingStore';
import Badge from '../../shared/ui/Badge/Badge';
import GlassPopover from '../../shared/components/GlassPopover';
import { PopoverCombobox } from '../../features/json-problem-importer/ui/EditPopoverContent';
import type { ComboboxOption } from '../../entities/problem/model/types';
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
    { value: '객관식', label: '객관식' },
    { value: '서답형', label: '서답형' },
    { value: '논술형', label: '논술형' },
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

    const handleTriggerClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
        setIsPopoverOpen(true);
    };

    const handleClosePopover = useCallback(() => {
        setIsPopoverOpen(false);
        setAnchorEl(null);
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
                sources: [],
                grades: [],
                semesters: [],
                minQuestionNumber: null,
                maxQuestionNumber: null,
            };
        }
        const sources = [...new Set(problems.map(p => p.source).filter(Boolean))];
        const grades = [...new Set(problems.map(p => p.grade).filter(Boolean))];
        const semesters = [...new Set(problems.map(p => p.semester).filter(Boolean))];
        const questionNumbers = problems.map(p => p.question_number).filter(n => typeof n === 'number');
        const minQuestionNumber = questionNumbers.length > 0 ? Math.min(...questionNumbers) : null;
        const maxQuestionNumber = questionNumbers.length > 0 ? Math.max(...questionNumbers) : null;
        return { sources, grades, semesters, minQuestionNumber, maxQuestionNumber };
    }, [problems]);

    const renderSourceBadges = (sources: string[]) => {
        if (sources.length === 0) return null;
        if (sources.length <= 3) {
            return sources.map(source => <Badge key={source} className="summary-badge">{source}</Badge>);
        }
        return <Badge className="summary-badge">{`${sources.length}개 출처`}</Badge>;
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
                    {renderSourceBadges(summary.sources)}
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
                        {/* [핵심] 공통 클래스 추가 */}
                        <button type="button" className="filter-trigger-button filter-control-item" onClick={handleTriggerClick}>
                            <span className={`trigger-text ${problemTypeFilter === 'all' ? 'placeholder' : ''}`}>
                                {currentFilterLabel}
                            </span>
                            <LuChevronsUpDown className="trigger-icon" />
                        </button>
                    </div>
                    <div className="filter-group number-range-filter">
                        {/* [핵심] 공통 클래스 추가 */}
                        <input type="number" value={startNumber} onChange={onStartNumberChange} placeholder="시작" className="filter-input filter-control-item" aria-label="문제 시작 번호" />
                        <span className="range-separator">~</span>
                        {/* [핵심] 공통 클래스 추가 */}
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
----- ./react/widgets/json-problem-importer/JsonProblemImporterWidget.tsx -----
import React from 'react';
import { LuUpload, LuCheck, LuChevronsUpDown, LuInfo, LuLightbulb } from 'react-icons/lu';
import { useJsonProblemImporter } from '../../features/json-problem-importer/model/useJsonProblemImporter';
import ActionButton from '../../shared/ui/actionbutton/ActionButton';
import GlassPopover from '../../shared/components/GlassPopover';
import type { Problem, Column } from '../../entities/problem/model/types'; // [수정] Problem 및 Column 타입 임포트
import { PopoverCombobox, PopoverInput, PopoverTextarea } from '../../features/json-problem-importer/ui/EditPopoverContent';
import LoadingButton from '../../shared/ui/loadingbutton/LoadingButton';

const COMBOBOX_FIELDS: (keyof Problem)[] = ['problem_type', 'difficulty', 'grade', 'semester'];
const ANSWER_COMBOBOX_FIELDS: (keyof Problem)[] = ['answer'];

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
        problemTypeOptions, difficultyOptions, answerOptions, gradeOptions, semesterOptions
    } = useJsonProblemImporter();

    const isEditing = !!editingCell;

    return (
        <div className="json-importer-widget">
            <div className="left-panel">
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

            <div className="panel right-panel">
                <div className="panel-header">
                    <h2>표 미리보기 (클릭하여 수정)</h2>
                    <LoadingButton
                        onClick={uploadProblems}
                        disabled={problems.length === 0 || parseError !== null}
                        isLoading={isUploading}
                        loadingText="저장 중..."
                        className="primary"
                    >
                        <LuUpload style={{ marginRight: '8px' }} />
                        DB에 업로드
                    </LoadingButton>
                </div>
                <div className="table-wrapper">
                    <table className="problem-table">
                        <thead>
                            <tr>
                                {columns.map(col => (
                                    <th key={col.key}>
                                        {col.label}
                                        {col.readonly && <span style={{fontSize: '0.7rem', marginLeft: '4px'}}>(읽기전용)</span>}
                                    </th>
                                ))}
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
                                        {jsonInput.trim() === '' 
                                            ? "왼쪽 텍스트 영역에 JSON 데이터를 붙여넣으세요." 
                                            : parseError 
                                                ? "JSON 데이터에 오류가 있습니다. 왼쪽 영역의 오류 메시지를 확인하세요." 
                                                : "유효한 'problems' 배열이 없거나 데이터가 비어있습니다."
                                        }
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

export default JsonProblemImporterWidget
----- ./react/widgets/ProblemSelectionContainer.tsx -----
import React, { useMemo, useCallback, useEffect } from 'react';
import { useProblemPublishing } from '../features/problem-publishing';
import ProblemSelectionWidget from './ProblemSelectionWidget';
import type { SuggestionGroup } from '../features/table-search/ui/TableSearch';
import { useLayoutStore } from '../shared/store/layoutStore';
import { useUIStore } from '../shared/store/uiStore';
import { useTableSearch } from '../features/table-search/model/useTableSearch';
import type { ProcessedProblem } from '../features/problem-publishing/model/problemPublishingStore';


interface ProblemSelectionContainerProps {
    allProblems: ProcessedProblem[];
    selectedProblems: ProcessedProblem[]; // [추가] 선택된 문제 목록을 props로 받습니다.
    isLoading: boolean;
    selectedIds: Set<string>;
    toggleRow: (id: string) => void;
    toggleItems: (ids: string[]) => void;
    clearSelection: () => void;
}

const ProblemSelectionContainer: React.FC<ProblemSelectionContainerProps> = ({
    allProblems,
    selectedProblems, // [추가]
    isLoading,
    selectedIds,
    toggleRow,
    toggleItems,
    clearSelection,
}) => {
    const { deleteProblems, isDeletingProblems } = useProblemPublishing();

    const [searchTerm, setSearchTerm] = React.useState('');
    const [activeFilters, setActiveFilters] = React.useState<Record<string, Set<string>>>({});
    const [startNumber, setStartNumber] = React.useState('');
    const [endNumber, setEndNumber] = React.useState('');
    const [problemTypeFilter, setProblemTypeFilter] = React.useState('all');

    const problemsFilteredByCustomControls = useMemo(() => {
        let items = [...allProblems];
        if (problemTypeFilter !== 'all') {
            items = items.filter(item => item.problem_type === problemTypeFilter);
        }
        const numStart = parseInt(startNumber, 10);
        const numEnd = parseInt(endNumber, 10);
        if (!isNaN(numStart) || !isNaN(numEnd)) {
            items = items.filter(item => {
                const qNum = item.question_number;
                if (!isNaN(numStart) && !isNaN(numEnd)) return qNum >= numStart && qNum <= numEnd;
                if (!isNaN(numStart)) return qNum >= numStart;
                if (!isNaN(numEnd)) return qNum <= numEnd;
                return true;
            });
        }
        return items;
    }, [allProblems, startNumber, endNumber, problemTypeFilter]);

    const filteredProblems = useTableSearch({
        data: problemsFilteredByCustomControls,
        searchTerm,
        searchableKeys: ['display_question_number', 'source', 'grade', 'semester', 'major_chapter_id', 'middle_chapter_id', 'core_concept_id', 'problem_category'],
        activeFilters,
    }) as ProcessedProblem[];

    const filteredProblemIds = useMemo(() => filteredProblems.map(p => p.uniqueId), [filteredProblems]);
    
    const isAllSelectedInFilter = useMemo(() => {
        if (filteredProblemIds.length === 0) return false;
        return filteredProblemIds.every(id => selectedIds.has(id));
    }, [filteredProblemIds, selectedIds]);

    const handleToggleAllInFilter = useCallback(() => {
        toggleItems(filteredProblemIds);
    }, [filteredProblemIds, toggleItems]);

    const handleResetHeaderFilters = useCallback(() => {
        setStartNumber('');
        setEndNumber('');
        setProblemTypeFilter('all');
    }, []);

    const handleResetFilters = useCallback(() => {
      setActiveFilters({});
      setSearchTerm('');
      clearSelection();
      handleResetHeaderFilters();
    }, [clearSelection, handleResetHeaderFilters]);

    const { setSearchBoxProps, registerPageActions, setRightSidebarConfig } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore.getState();
    const [isSearchBoxVisible, setIsSearchBoxVisible] = React.useState(true);
    const toggleSearchBox = React.useCallback(() => setIsSearchBoxVisible(prev => !prev), []);

    const handleOpenJsonView = useCallback(() => {
        if (selectedProblems.length === 0) {
            alert('JSON으로 변환할 문제가 선택되지 않았습니다.');
            return;
        }
        setRightSidebarConfig({
            contentConfig: { type: 'jsonViewer', props: { problems: selectedProblems } },
            isExtraWide: true
        });
        setRightSidebarExpanded(true);
    }, [selectedProblems, setRightSidebarConfig, setRightSidebarExpanded]);

    useEffect(() => {
        registerPageActions({ openJsonViewSidebar: handleOpenJsonView });
    }, [registerPageActions, handleOpenJsonView]);

    const suggestionGroups = useMemo((): SuggestionGroup[] => {
        const getUniqueSortedValues = (items: ProcessedProblem[], key: keyof ProcessedProblem): string[] => {
            if (!items || items.length === 0) return [];
            const values = items.map(item => item[key]).filter((value): value is string => value != null && String(value).trim() !== '');
            return Array.from(new Set(values)).sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
        };
        return [
            { key: 'source', suggestions: getUniqueSortedValues(allProblems, 'source') },
            { key: 'grade', suggestions: getUniqueSortedValues(allProblems, 'grade') },
            { key: 'major_chapter_id', suggestions: getUniqueSortedValues(allProblems, 'major_chapter_id') },
        ];
    }, [allProblems]);

    const suggestionGroupsJSON = useMemo(() => JSON.stringify(suggestionGroups), [suggestionGroups]);
    
    useEffect(() => {
        if (isSearchBoxVisible) {
            setSearchBoxProps({
                searchTerm, onSearchTermChange: setSearchTerm, activeFilters, onFilterChange: (key, val) => setActiveFilters(prev => {
                    const newSet = new Set(prev[key] || []);
                    newSet.has(val) ? newSet.delete(val) : newSet.add(val);
                    const newFilters = {...prev};
                    if (newSet.size === 0) delete newFilters[key]; else newFilters[key] = newSet;
                    return newFilters;
                }),
                onResetFilters: handleResetFilters, suggestionGroups: suggestionGroupsJSON, onToggleFiltered: handleToggleAllInFilter,
                selectedCount: selectedIds.size, isSelectionComplete: isAllSelectedInFilter, showActionControls: true, onHide: toggleSearchBox,
            });
        } else {
            setSearchBoxProps(null);
        }
    }, [isSearchBoxVisible, searchTerm, activeFilters, handleResetFilters, suggestionGroupsJSON, handleToggleAllInFilter, selectedIds.size, isAllSelectedInFilter, toggleSearchBox, setSearchBoxProps]);

    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = React.useState(false);
    const handleDeleteSelected = () => {
        if (selectedIds.size > 0) setIsBulkDeleteModalOpen(true);
    };
    const handleConfirmBulkDelete = () => {
        deleteProblems(Array.from(selectedIds), {
            onSuccess: () => { clearSelection(); setIsBulkDeleteModalOpen(false); },
            onError: () => setIsBulkDeleteModalOpen(true)
        });
    };

    return (
        <ProblemSelectionWidget
            problems={filteredProblems}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleAll={handleToggleAllInFilter}
            isAllSelected={isAllSelectedInFilter}
            onDeleteSelected={handleDeleteSelected}
            isBulkDeleteModalOpen={isBulkDeleteModalOpen}
            onCloseBulkDeleteModal={() => setIsBulkDeleteModalOpen(false)}
            onConfirmBulkDelete={handleConfirmBulkDelete}
            isDeletingProblems={isDeletingProblems}
            startNumber={startNumber}
            onStartNumberChange={(e) => setStartNumber(e.target.value)}
            endNumber={endNumber}
            onEndNumberChange={(e) => setEndNumber(e.target.value)}
            problemTypeFilter={problemTypeFilter}
            onProblemTypeFilterChange={setProblemTypeFilter}
            onResetHeaderFilters={handleResetHeaderFilters}
        />
    );
};

export default ProblemSelectionContainer;
----- ./react/widgets/ProblemSelectionWidget.tsx -----
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
----- ./react/widgets/PublishingToolbarWidget.tsx -----
import React, { useRef, useCallback, useEffect, useState } from 'react';
import LoadingButton from '../shared/ui/loadingbutton/LoadingButton';
import ActionButton from '../shared/ui/actionbutton/ActionButton';
import { LuFileDown } from 'react-icons/lu';
import { useExamLayoutStore } from '../features/problem-publishing/model/examLayoutStore';
import './PublishingToolbarWidget.css';

interface PublishingToolbarWidgetProps {
    useSequentialNumbering: boolean;
    onToggleSequentialNumbering: () => void;
    baseFontSize: string;
    onBaseFontSizeChange: (value: string) => void;
    contentFontSizeEm: number;
    onContentFontSizeEmChange: (value: number) => void;
    problemBoxMinHeight: number;
    setProblemBoxMinHeight: (height: number) => void;
    onDownloadPdf: () => void;
    isGeneratingPdf: boolean;
    pdfProgress: { current: number; total: number; message: string };
}

const PublishingToolbarWidget: React.FC<PublishingToolbarWidgetProps> = (props) => {
    const {
        useSequentialNumbering, onToggleSequentialNumbering,
        baseFontSize, onBaseFontSizeChange,
        contentFontSizeEm, onContentFontSizeEmChange,
        problemBoxMinHeight, setProblemBoxMinHeight,
        onDownloadPdf, isGeneratingPdf, pdfProgress
    } = props;

    const { setDraggingControl, forceRecalculateLayout } = useExamLayoutStore();
    const dragStartRef = useRef<{ startY: number; startHeight: number } | null>(null);
    
    const [displayHeight, setDisplayHeight] = useState(problemBoxMinHeight);
    
    const displayHeightRef = useRef(displayHeight);
    useEffect(() => {
        displayHeightRef.current = displayHeight;
    }, [displayHeight]);

    const [isEditingMinHeight, setIsEditingMinHeight] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setDisplayHeight(problemBoxMinHeight);
    }, [problemBoxMinHeight]);

    useEffect(() => {
        if (isEditingMinHeight && inputRef.current) {
            inputRef.current.select();
        }
    }, [isEditingMinHeight]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragStartRef.current) return;
        const deltaY = e.clientY - dragStartRef.current.startY;
        const sensitivity = -0.1;
        const newHeight = dragStartRef.current.startHeight + deltaY * sensitivity;
        const clampedHeight = Math.max(5, Math.min(newHeight, 150));
        
        setDisplayHeight(clampedHeight);
    }, []);

    const handleMouseUp = useCallback(() => {
        if (!dragStartRef.current) return;
        document.body.style.cursor = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        
        setDraggingControl(false);
        setProblemBoxMinHeight(displayHeightRef.current);
        forceRecalculateLayout(displayHeightRef.current);
        dragStartRef.current = null;
    }, [handleMouseMove, setDraggingControl, forceRecalculateLayout, setProblemBoxMinHeight]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDraggingControl(true);
        dragStartRef.current = {
            startY: e.clientY,
            startHeight: problemBoxMinHeight,
        };
        document.body.style.cursor = 'ns-resize';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [problemBoxMinHeight, handleMouseMove, handleMouseUp, setDraggingControl]);

    const handleMinHeightDoubleClick = () => setIsEditingMinHeight(true);
    const handleMinHeightInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setDisplayHeight(parseFloat(e.target.value) || 0);
    const handleMinHeightInputBlur = () => {
        const clampedHeight = Math.max(5, Math.min(displayHeight, 150));
        setDisplayHeight(clampedHeight);
        setProblemBoxMinHeight(clampedHeight);
        forceRecalculateLayout(clampedHeight);
        setIsEditingMinHeight(false);
    };
    const handleMinHeightInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleMinHeightInputBlur();
        else if (e.key === 'Escape') {
            setDisplayHeight(problemBoxMinHeight);
            setIsEditingMinHeight(false);
        }
    };

    useEffect(() => {
        return () => {
            if (dragStartRef.current) {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            }
        };
    }, [handleMouseMove, handleMouseUp]);
    
    return (
        <div className="publishing-controls-panel">
            <div className="control-group">
                <LoadingButton 
                    className="primary" 
                    onClick={onDownloadPdf}
                    isLoading={isGeneratingPdf}
                    loadingText={pdfProgress.message || "변환 중..."}
                >
                    <LuFileDown size={14} className="toolbar-icon"/>
                    PDF로 다운로드
                </LoadingButton>
                <ActionButton onClick={onToggleSequentialNumbering}>
                    번호: {useSequentialNumbering ? '순차' : '원본'}
                </ActionButton>
            </div>
            <div className="control-group">
                <label htmlFor="base-font-size">기준 크기:</label>
                <input id="base-font-size" type="text" value={baseFontSize} onChange={e => onBaseFontSizeChange(e.target.value)} />
            </div>
            <div className="control-group">
                <label htmlFor="content-font-size">본문 크기(em):</label>
                <input id="content-font-size" type="number" step="0.1" value={contentFontSizeEm} onChange={e => onContentFontSizeEmChange(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="control-group">
                <label htmlFor="min-box-height-drag">문제 최소높이(em):</label>
                {isEditingMinHeight ? (
                    <input ref={inputRef} type="number" value={displayHeight} onChange={handleMinHeightInputChange} onBlur={handleMinHeightInputBlur} onKeyDown={handleMinHeightInputKeyDown} className="draggable-number-input" />
                ) : (
                    <div id="min-box-height-drag" className="draggable-number" onMouseDown={handleMouseDown} onDoubleClick={handleMinHeightDoubleClick} role="slider" aria-valuenow={displayHeight} aria-valuemin={5} aria-valuemax={150} aria-label="문제 최소 높이 조절. 마우스를 누른 채 위아래로 드래그하거나 더블클릭하여 직접 입력하세요." title="드래그 또는 더블클릭하여 수정">
                        {displayHeight.toFixed(1)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublishingToolbarWidget;
----- ./react/widgets/rootlayout/BackgroundBlobs.tsx -----
import './BackgroundBlobs.css'; // 오타 수정: BackgroundBolbs.css -> BackgroundBlobs.css

const BackgroundBlobs = () => {
    return (
        <div className="blobs-container">
            <div className="blob-item blob-1"></div>
            <div className="blob-item blob-2"></div>
            <div className="blob-item blob-3"></div>
            <div className="blob-item blob-4"></div>
        </div>
    );
};

export default BackgroundBlobs;
----- ./react/widgets/rootlayout/GlassNavbar.tsx -----
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import './GlassNavbar.css';
import { useUIStore } from '../../shared/store/uiStore';
import { useSidebarTriggers } from '../../shared/store/layoutStore';
import { 
    LuLayoutDashboard, LuMenu, LuCircleUserRound, LuCirclePlus, 
    LuSettings2, LuSearch, LuClipboardList, LuBookMarked
} from 'react-icons/lu';
import Tippy from '@tippyjs/react';

import GlassPopover from '../../shared/components/GlassPopover';
import ProfileMenuContent from '../../features/popovermenu/ProfileMenuContent';

const LogoIcon = () => <LuLayoutDashboard size={26} className="navbar-logo-icon" />;
const HamburgerIcon = () => <LuMenu size={22} />;
const ProfileIcon = () => <LuCircleUserRound size={22} />;

const RegisterIcon = () => <LuCirclePlus size={22} />;
const SettingsIcon = () => <LuSettings2 size={22} />;
const SearchIcon = () => <LuSearch size={22} />;
const PromptIcon = () => <LuClipboardList size={22} />;
const LatexHelpIcon = () => <LuBookMarked size={22} />;


const GlassNavbar: React.FC = () => {
    const {
        currentBreakpoint,
        toggleLeftSidebar,
        mobileSidebarType,
        closeMobileSidebar,
    } = useUIStore();
    
    const { 
        registerTrigger, 
        settingsTrigger, 
        searchTrigger, 
        promptTrigger, 
        latexHelpTrigger 
    } = useSidebarTriggers();

    const [isProfilePopoverOpen, setIsProfilePopoverOpen] = useState(false);
    const profileButtonRef = useRef<HTMLButtonElement>(null);

    const handleProfileButtonClick = () => {
        if (currentBreakpoint === 'mobile' && mobileSidebarType && !isProfilePopoverOpen) {
            closeMobileSidebar();
        }
        setIsProfilePopoverOpen(prev => !prev);
    };

    const handleCloseProfilePopover = () => {
        setIsProfilePopoverOpen(false);
    };

    useEffect(() => {
        if (isProfilePopoverOpen && currentBreakpoint !== 'desktop') {
            handleCloseProfilePopover();
        }
    }, [currentBreakpoint, isProfilePopoverOpen]);

    return (
        <nav className="glass-navbar">
            <div className="navbar-left">
                {currentBreakpoint === 'mobile' && (
                    <Tippy content="메뉴" placement="bottom-start" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                        <button
                            className={`navbar-icon-button hamburger-button ${isProfilePopoverOpen && currentBreakpoint === 'mobile' ? '' : (mobileSidebarType === 'left' ? 'active' : '')}`}
                            onClick={toggleLeftSidebar}
                            aria-label="메인 메뉴"
                            aria-expanded={mobileSidebarType === 'left'}
                        >
                            <HamburgerIcon />
                        </button>
                    </Tippy>
                )}
                <Link to="/dashboard" className="navbar-logo-link" aria-label="대시보드로 이동">
                    <LogoIcon />
                </Link>
            </div>

            <div className="navbar-right">
                {currentBreakpoint === 'mobile' && (
                    <div className="mobile-right-actions">
                        {registerTrigger?.onClick && (
                            <Tippy content={registerTrigger.tooltip} placement="bottom" theme="custom-glass" delay={[300, 0]}>
                                <button onClick={registerTrigger.onClick} className="navbar-icon-button" aria-label={registerTrigger.tooltip}>
                                    <RegisterIcon />
                                </button>
                            </Tippy>
                        )}
                        {searchTrigger?.onClick && (
                             <Tippy content={searchTrigger.tooltip} placement="bottom" theme="custom-glass" delay={[300, 0]}>
                                <button onClick={searchTrigger.onClick} className="navbar-icon-button" aria-label={searchTrigger.tooltip}>
                                    <SearchIcon />
                                </button>
                            </Tippy>
                        )}
                        {promptTrigger?.onClick && (
                             <Tippy content={promptTrigger.tooltip} placement="bottom" theme="custom-glass" delay={[300, 0]}>
                                <button onClick={promptTrigger.onClick} className="navbar-icon-button" aria-label={promptTrigger.tooltip}>
                                    <PromptIcon />
                                </button>
                            </Tippy>
                        )}
                        {latexHelpTrigger?.onClick && (
                             <Tippy content={latexHelpTrigger.tooltip} placement="bottom" theme="custom-glass" delay={[300, 0]}>
                                <button onClick={latexHelpTrigger.onClick} className="navbar-icon-button" aria-label={latexHelpTrigger.tooltip}>
                                    <LatexHelpIcon />
                                </button>
                            </Tippy>
                        )}
                        {settingsTrigger?.onClick && (
                             <Tippy content={settingsTrigger.tooltip} placement="bottom" theme="custom-glass" delay={[300, 0]}>
                                <button onClick={settingsTrigger.onClick} className="navbar-icon-button" aria-label={settingsTrigger.tooltip}>
                                    <SettingsIcon />
                                </button>
                            </Tippy>
                        )}
                    </div>
                )}

                <button
                    ref={profileButtonRef}
                    className={`profile-button navbar-icon-button ${isProfilePopoverOpen ? 'active' : ''}`}
                    aria-label="프로필 메뉴 열기/닫기"
                    onClick={handleProfileButtonClick}
                    aria-expanded={isProfilePopoverOpen}
                >
                    <ProfileIcon />
                </button>

                <GlassPopover
                    isOpen={isProfilePopoverOpen}
                    onClose={handleCloseProfilePopover}
                    anchorEl={profileButtonRef.current}
                    placement="bottom-end"
                    offsetY={10}
                >
                    <ProfileMenuContent onClose={handleCloseProfilePopover} />
                </GlassPopover>
            </div>
        </nav>
    );
};

export default GlassNavbar;
----- ./react/widgets/rootlayout/GlassSidebar.tsx -----
import React from 'react';
import { NavLink } from 'react-router'; 
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css'; // Tippy 기본 스타일 (필요시)
import 'tippy.js/themes/light.css'; // Tippy 테마 (필요시, custom-glass 테마 CSS가 있다면 불필요할 수 있음)
import 'tippy.js/animations/perspective.css'; // Tippy 애니메이션 (필요시)

import './GlassSidebar.css';
import { useUIStore } from '../../shared/store/uiStore'; // UI 상태 관리 스토어 import 경로 확인
import {
    LuLayoutDashboard, LuCheck, LuLibrary, LuHeart, LuActivity,
    LuChartBar, LuFileText, LuChevronLeft, LuChevronRight,
    LuMove, LuFile, LuPrinter // 추가 아이콘
} from 'react-icons/lu';

interface MenuItemData {
    path: string;
    name: string;
    icon: React.ReactNode;
    isSubItem?: boolean;
    badge?: number;
}

const DashboardIcon = () => <LuLayoutDashboard size={18} />;
const ProblemIcon = () => <LuFile size={18} />;
const ProblemPublishingIcon = () => <LuPrinter size={18} />;
const MoveIcon = () => <LuMove size={18} />; 
const ActivityIcon = () => <LuActivity size={18} />;
const StatisticIcon = () => <LuChartBar size={18} />;
const PerformanceIcon = () => <LuFileText size={18} />;
const TasksIcon = () => <LuCheck size={18} />;
const LibrariesIcon = () => <LuLibrary size={18} />;
const SavedIcon = () => <LuHeart size={18} />;
const CloseLeftSidebarIcon = () => <LuChevronLeft size={22} />;
const TabletToggleChevronLeftIcon = () => <LuChevronLeft size={20} />;
const TabletToggleChevronRightIcon = () => <LuChevronRight size={20} />;
const JsonIcon = () => <LuFile size={18} />; 

export const allMenuItems: MenuItemData[] = [
     { 
        path: '/dashboard', // 현재 App.tsx 구조상 대시보드 경로는 /dashboard 입니다.
        name: '대시보드', 
        icon: <DashboardIcon /> 
    },
    {
        path: '/problem-workbench', // 새 페이지의 URL 경로
        name: '문제 작업',
        icon: <ProblemIcon />
    },
    {
        path: '/problem-publishing',
        name: '문제 출제',
        icon: <ProblemPublishingIcon />
    },
    {
        path: '/json-renderer',
        name: 'JSON 렌더러',
        icon: <JsonIcon />
    },
];


const GlassSidebar: React.FC = () => {
    const { isLeftSidebarExpanded, mobileSidebarType, currentBreakpoint, toggleLeftSidebar, closeMobileSidebar } = useUIStore();

    let sidebarShouldBeCollapsed = false;
    let isVisibleOnScreen = true;

    if (currentBreakpoint === 'mobile') {
        isVisibleOnScreen = mobileSidebarType === 'left';
        sidebarShouldBeCollapsed = false; // 모바일에서는 항상 확장된 형태
    } else if (currentBreakpoint === 'tablet') {
        sidebarShouldBeCollapsed = !isLeftSidebarExpanded;
    } else { // desktop
        sidebarShouldBeCollapsed = !isLeftSidebarExpanded;
    }

    const handleLinkClick = () => {
        if (currentBreakpoint === 'mobile') {
            closeMobileSidebar();
        }
    };
    

    return (
        <aside className={`glass-sidebar
            ${sidebarShouldBeCollapsed ? 'collapsed' : ''}
            ${currentBreakpoint === 'mobile' ? 'mobile-sidebar left-mobile-sidebar' : ''}
            ${currentBreakpoint === 'mobile' && isVisibleOnScreen ? 'open' : ''}
        `}>
         
            <div className="sidebar-header lgs-header">
                {currentBreakpoint === 'mobile' && (
                    <>
                        <span className="sidebar-header-text">메뉴</span>
                        <Tippy content="닫기" placement="bottom" theme="custom-glass" animation="perspective" delay={[200, 0]}>
                            <button onClick={closeMobileSidebar} className="sidebar-close-button mobile-only lgs-close-btn" aria-label="메뉴 닫기">
                                <CloseLeftSidebarIcon />
                            </button>
                        </Tippy>
                    </>
                )}
                 {/* 데스크탑/태블릿 헤더 */}
                {currentBreakpoint !== 'mobile' && (
                    <>
                        {/* 접힌 상태가 아닐 때만 텍스트 표시 */}
                        {(!sidebarShouldBeCollapsed) && <span className="sidebar-header-text">MAIN</span>}
                    </>
                )}
            </div>

            {/* 태블릿 전용 토글 버튼 */}
            {currentBreakpoint === 'tablet' && (
                <div className="tablet-toggle-button-wrapper">
                    <Tippy content={isLeftSidebarExpanded ? "메뉴 축소" : "메뉴 확장"} placement="right" theme="custom-glass" animation="perspective" delay={[200, 0]}>
                        <button
                            onClick={toggleLeftSidebar}
                            className="sidebar-toggle-button left-sidebar-toggle tablet-control"
                            aria-label={isLeftSidebarExpanded ? "메뉴 축소" : "메뉴 확장"}
                        >
                            {isLeftSidebarExpanded ? <TabletToggleChevronLeftIcon /> : <TabletToggleChevronRightIcon />}
                        </button>
                    </Tippy>
                </div>
            )}

            <nav className="sidebar-nav lgs-nav">
                <ul>
                    {/* 수정된 allMenuItems 배열을 순회 */}
                    {allMenuItems.map((item) => {
                        const isMobileView = currentBreakpoint === 'mobile';
                        const showFullText = (!sidebarShouldBeCollapsed || isMobileView);
                        const itemAriaLabel = `${item.name}${item.badge ? `, 알림 ${item.badge}개` : ''}`;

                        return (
                            <li key={item.path} className={`${item.isSubItem ? 'sub-menu-item-li' : ''} ${(sidebarShouldBeCollapsed && !isMobileView) ? 'li-collapsed' : ''}`}>
                                {/* 텍스트가 보일 때는 툴팁 비활성화 */}
                                <Tippy
                                    content={item.name}
                                    placement="right"
                                    theme="custom-glass" // CSS에 .tippy-box[data-theme~='custom-glass'] 정의 필요
                                    animation="perspective"
                                    delay={[350, 0]}
                                    disabled={showFullText} 
                                >
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) => 
                                            `menu-item-link 
                                            ${isActive ? 'active' : ''} 
                                            ${item.isSubItem ? 'sub-menu-item-link' : ''} 
                                            ${(sidebarShouldBeCollapsed && !isMobileView) ? 'link-collapsed' : ''}`
                                        }
                                        onClick={handleLinkClick}
                                        aria-label={itemAriaLabel}
                                    >
                                        <span className="menu-icon-wrapper">{item.icon}</span>
                                        {/* 텍스트와 뱃지는 showFullText 조건일 때만 표시 */}
                                        {showFullText && <span className="menu-item-name">{item.name}</span>}
                                        {showFullText && item.badge && (
                                            <span className="notification-badge" aria-label={`알림 ${item.badge}개`}>{item.badge}</span>
                                        )}
                                    </NavLink>
                                </Tippy>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
};
export default GlassSidebar;
----- ./react/widgets/rootlayout/GlassSidebarRight.tsx -----
import React from 'react';
import Tippy from '@tippyjs/react';
import './GlassSidebarRight.css';
import { useUIStore } from '../../shared/store/uiStore';
import { useLayoutStore, selectRightSidebarConfig, useSidebarTriggers } from '../../shared/store/layoutStore';
import { LuSettings2, LuChevronRight, LuCircleX, LuCirclePlus, LuClipboardList, LuBookMarked, LuSearch, LuFileJson2 } from 'react-icons/lu';
import ProblemTextEditor from '../../features/problem-text-editing/ui/ProblemTextEditor';
import StudentRegistrationForm from '../../features/student-registration/ui/StudentRegistrationForm';
import TableColumnToggler from '../../features/table-column-toggler/ui/TableColumnToggler';
import PromptCollection from '../../features/prompt-collection/ui/PromptCollection';
import StudentEditForm from '../../features/student-editing/ui/StudentEditForm';
import { useProblemPublishingStore, type ProcessedProblem } from '../../features/problem-publishing/model/problemPublishingStore';
import LatexHelpPanel from '../../features/latex-help/ui/LatexHelpPanel';
import JsonViewerPanel from '../../features/json-viewer/ui/JsonViewerPanel';

const SettingsIcon = () => <LuSettings2 size={20} />;
const CloseRightSidebarIcon = () => <LuChevronRight size={22} />;
const CloseIcon = () => <LuCircleX size={22} />;
const PlusIcon = () => <LuCirclePlus size={22} />;
const PromptIcon = () => <LuClipboardList size={20} />;
const LatexHelpIcon = () => <LuBookMarked size={20} />;
const SearchIcon = () => <LuSearch size={20} />;
const JsonViewIcon = () => <LuFileJson2 size={20} />;

interface ProblemEditorWrapperProps {
    isSaving?: boolean;
    onSave: (problem: ProcessedProblem) => void;
    onRevert: (problemId: string) => void;
    onClose: () => void;
    onProblemChange: (problem: ProcessedProblem) => void;
}

const ProblemEditorWrapper: React.FC<ProblemEditorWrapperProps> = (props) => {
    const { draftProblems, editingProblemId } = useProblemPublishingStore();
    const problemToEdit = draftProblems?.find(p => p.uniqueId === editingProblemId);

    if (!problemToEdit) {
        return <div>수정할 문제를 선택해주세요.</div>;
    }

    return <ProblemTextEditor problem={problemToEdit} {...props} />;
};

const SidebarContentRenderer: React.FC = () => {
    const { contentConfig } = useLayoutStore(selectRightSidebarConfig);
    const { pageActions } = useLayoutStore.getState();

    if (!contentConfig?.type) {
        return null;
    }

    switch(contentConfig.type) {
        case 'problemEditor': {
            const { onSave, onRevert, onClose, onProblemChange, isSaving } = contentConfig.props || {};
            const { editingProblemId } = useProblemPublishingStore.getState();
            if (!editingProblemId) return <div>선택된 문제가 없습니다.</div>;
            
            return (
                <ProblemEditorWrapper
                    isSaving={isSaving}
                    onSave={onSave}
                    onRevert={onRevert}
                    onClose={onClose}
                    onProblemChange={onProblemChange}
                />
            );
        }
        case 'register':
            return <StudentRegistrationForm onSuccess={pageActions.onClose || (() => {})} />;
        
        case 'edit': {
            const { student } = contentConfig.props || {};
            if (!student) return <div>학생 정보를 불러오는 중...</div>;
            return <StudentEditForm student={student} onSuccess={pageActions.onClose || (() => {})} />;
        }

        case 'settings': {
             const currentPath = window.location.pathname;
             if (currentPath.startsWith('/problem-publishing')) {
                 return <TableColumnToggler />;
             }
             if (currentPath.startsWith('/dashboard')) {
                 return <TableColumnToggler />;
             }
             return (
                 <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>
                     <h4>설정</h4>
                     <p>현재 페이지의 설정 옵션이 여기에 표시됩니다.</p>
                 </div>
             );
        }

        case 'prompt':
            return <PromptCollection {...(contentConfig.props as any)} />;
        
        case 'latexHelp':
            return <LatexHelpPanel />;
            
        case 'jsonViewer': {
            const { problems } = contentConfig.props || {};
            if (!problems) return <div>JSON으로 변환할 데이터가 없습니다.</div>;
            return <JsonViewerPanel problems={problems} />;
        }

        default:
            return (
                 <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>
                    <h4>콘텐츠 없음</h4>
                    <p>표시할 사이드바 콘텐츠가 설정되지 않았습니다.</p>
                </div>
            );
    }
}


const GlassSidebarRight: React.FC = () => {
    const { contentConfig, isExtraWide } = useLayoutStore(selectRightSidebarConfig);
    const { registerTrigger, settingsTrigger, promptTrigger, latexHelpTrigger, searchTrigger, jsonViewTrigger, onClose } = useSidebarTriggers();
    const { mobileSidebarType, currentBreakpoint } = useUIStore();
    
    const isRightSidebarExpanded = contentConfig.type !== null;

    const isOpen = currentBreakpoint === 'mobile' ? mobileSidebarType === 'right' : isRightSidebarExpanded;

    const sidebarClassName = `
        glass-sidebar-right
        ${isOpen ? 'expanded' : ''}
        ${currentBreakpoint === 'mobile' ? 'mobile-sidebar right-mobile-sidebar' : ''}
        ${isOpen && currentBreakpoint === 'mobile' ? 'open' : ''}
        ${isExtraWide ? 'right-sidebar-extra-wide' : ''}
    `.trim().replace(/\s+/g, ' ');

    return (
        <aside className={sidebarClassName}>
            {currentBreakpoint !== 'mobile' && (
                <div className="rgs-header-desktop">
                    {isOpen ? (
                        <Tippy content="닫기" placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                            <button onClick={onClose} className="settings-toggle-button active" aria-label="사이드바 닫기">
                                <CloseIcon />
                            </button>
                        </Tippy>
                    ) : (
                        <>
                            {registerTrigger && (
                                <Tippy content={registerTrigger.tooltip} placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                                    <button onClick={registerTrigger.onClick} className="settings-toggle-button" aria-label={registerTrigger.tooltip}>
                                        <PlusIcon />
                                    </button>
                                </Tippy>
                            )}
                            
                            {searchTrigger && (
                                <Tippy content={searchTrigger.tooltip} placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                                    <button
                                        onClick={searchTrigger.onClick}
                                        className="settings-toggle-button"
                                        aria-label={searchTrigger.tooltip}
                                    >
                                        <SearchIcon />
                                    </button>
                                </Tippy>
                            )}

                            {jsonViewTrigger && (
                                <Tippy content={jsonViewTrigger.tooltip} placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                                    <button
                                        onClick={jsonViewTrigger.onClick}
                                        className="settings-toggle-button"
                                        aria-label={jsonViewTrigger.tooltip}
                                    >
                                        <JsonViewIcon />
                                    </button>
                                </Tippy>
                            )}

                            {promptTrigger && (
                                <Tippy content={promptTrigger.tooltip} placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                                    <button
                                        onClick={promptTrigger.onClick}
                                        className="settings-toggle-button"
                                        aria-label={promptTrigger.tooltip}
                                    >
                                        <PromptIcon />
                                    </button>
                                </Tippy>
                            )}

                            {latexHelpTrigger && (
                                <Tippy content={latexHelpTrigger.tooltip} placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                                    <button
                                        onClick={latexHelpTrigger.onClick}
                                        className="settings-toggle-button"
                                        aria-label={latexHelpTrigger.tooltip}
                                    >
                                        <LatexHelpIcon />
                                    </button>
                                </Tippy>
                            )}

                            {settingsTrigger && (
                                <Tippy content={settingsTrigger.tooltip} placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                                    <button
                                        onClick={settingsTrigger.onClick}
                                        className="settings-toggle-button"
                                        aria-label={settingsTrigger.tooltip}
                                    >
                                        <SettingsIcon />
                                    </button>
                                </Tippy>
                            )}
                        </>
                    )}
                </div>
            )}
            
            {isOpen && (
                <div className="expanded-content-area rgs-content">
                     {currentBreakpoint === 'mobile' && (
                        <div className="sidebar-header rgs-mobile-header">
                            <Tippy content="닫기" placement="bottom" theme="custom-glass" animation="perspective" delay={[200, 0]}>
                                <button onClick={onClose} className="sidebar-close-button mobile-only rgs-close-btn" aria-label="닫기">
                                    <CloseRightSidebarIcon />
                                </button>
                            </Tippy>
                        </div>
                     )}
                    
                    <SidebarContentRenderer />
                </div>
            )}
        </aside>
    );
};

export default GlassSidebarRight;
----- ./react/widgets/rootlayout/RootLayout.tsx -----

import { useMemo, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useUIStore } from '../../shared/store/uiStore';
import { useLayoutStore } from '../../shared/store/layoutStore';
import BackgroundBlobs from './BackgroundBlobs';
import GlassNavbar from './GlassNavbar';
import GlassSidebar from './GlassSidebar';
import GlassSidebarRight from './GlassSidebarRight';
import TableSearch from '../../features/table-search/ui/TableSearch';
import './RootLayout.css';

const RootLayout = () => {
    const location = useLocation();
    const { 
      updateLayoutForPath, 
      searchBoxProps,
      rightSidebar: { contentConfig, isExtraWide: isRightSidebarExtraWide }
    } = useLayoutStore();
    
    useEffect(() => {
        updateLayoutForPath(location.pathname);
    }, [location.pathname, updateLayoutForPath]);

    const { 
        currentBreakpoint, 
        mobileSidebarType, 
        closeMobileSidebar, 
        isLeftSidebarExpanded, 
    } = useUIStore();
    
    const [isSearchBoxVisible, setIsSearchBoxVisible] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (searchBoxProps) {
            timer = setTimeout(() => {
                setIsSearchBoxVisible(true);
            }, 20);
        } else {
            setIsSearchBoxVisible(false);
        }
        
        return () => clearTimeout(timer);
    }, [searchBoxProps]);
    
    const isRightSidebarExpanded = contentConfig.type !== null;

    const parsedSuggestionGroups = useMemo(() => {
        if (searchBoxProps?.suggestionGroups) {
            try {
                return JSON.parse(searchBoxProps.suggestionGroups);
            } catch (e) {
                console.error("Failed to parse suggestionGroups JSON", e);
                return [];
            }
        }
        return [];
    }, [searchBoxProps?.suggestionGroups]);
    
    const showOverlay = currentBreakpoint === 'mobile' && mobileSidebarType !== null;
    
    const sidebarStateClass = `
        ${isLeftSidebarExpanded ? 'left-sidebar-expanded' : 'left-sidebar-collapsed'}
        ${isRightSidebarExpanded ? 'right-sidebar-expanded' : 'right-sidebar-collapsed'}
        ${isRightSidebarExtraWide ? 'right-sidebar-extra-wide' : ''}
    `.trim().replace(/\s+/g, ' ');

    const isWorkbenchPage = location.pathname === '/problem-workbench';
    const mainContentClasses = `main-content ${isWorkbenchPage ? 'main-content--compact-padding' : ''}`;

    const bottomContentAreaClasses = `
        bottom-content-area 
        ${isSearchBoxVisible ? 'visible' : ''}
    `.trim();

    return (
        <div className={`app-container ${sidebarStateClass} ${showOverlay ? 'mobile-sidebar-active' : ''}`}>
            <div className="background-blobs-wrapper"><BackgroundBlobs /></div>
            
            {currentBreakpoint === 'mobile' && <GlassSidebar />}
            {currentBreakpoint === 'mobile' && <GlassSidebarRight />}
            
            <div className={`layout-main-wrapper ${currentBreakpoint}-layout`}>
                {showOverlay && (<div className={`clickable-overlay active`} onClick={closeMobileSidebar} aria-hidden="true" />)}
                <GlassNavbar />
                <div className="content-body-wrapper">
                    {currentBreakpoint !== 'mobile' && <GlassSidebar />}
                    
                    <main className={mainContentClasses}>
                        <Outlet />
                    </main>

                    {currentBreakpoint !== 'mobile' && <GlassSidebarRight />}
                </div>

                <div className={bottomContentAreaClasses}>
                    {searchBoxProps && (
                        <TableSearch
                            {...searchBoxProps}
                            suggestionGroups={parsedSuggestionGroups}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default RootLayout;
----- ./react/widgets/student-table/StudentTableWidget.tsx -----
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import StudentDisplay from '../../entities/student/ui/StudentDisplay';
import { useStudentDataWithRQ, type Student, GRADE_LEVELS } from '../../entities/student/model/useStudentDataWithRQ';
import type { SortConfig } from '../../shared/ui/glasstable/GlassTable';
import { useDragToScroll } from '../../shared/hooks/useDragToScroll';

type StatusValue = Student['status'];

const statusOrder: { [key in StatusValue]: number } = {
    '재원': 1, '휴원': 2, '퇴원': 3,
};

interface StudentTableWidgetProps {
    students: Student[];
    isLoading: boolean;
    onRequestEdit: (student: Student) => void;
    selectedIds: Set<string>;
    toggleRow: (id: string) => void;
    isAllSelected: boolean;
    toggleSelectAll: () => void;
}

const StudentTableWidget: React.FC<StudentTableWidgetProps> = ({ 
    students = [], 
    isLoading, 
    onRequestEdit,
    selectedIds,
    toggleRow,
    isAllSelected,
    toggleSelectAll
}) => {
    const { ref: scrollContainerRef, onMouseDown, isDragging } = useDragToScroll<HTMLDivElement>();
    const navigate = useNavigate();
    const { updateStudent, deleteStudent } = useStudentDataWithRQ();

    const [editingStatusRowId, setEditingStatusRowId] = useState<string | null>(null);
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'student_name', direction: 'asc' });

    const sortedStudents = useMemo(() => {
        return [...students].sort((a, b) => {
            const statusComparison = statusOrder[a.status] - statusOrder[b.status];
            if (statusComparison !== 0) {
                return statusComparison;
            }

            if (!sortConfig) return 0;
            
            if (sortConfig.key === 'grade') {
                const aRank = GRADE_LEVELS.indexOf(a.grade);
                const bRank = GRADE_LEVELS.indexOf(b.grade);
                const aFinalRank = aRank === -1 ? Infinity : aRank;
                const bFinalRank = bRank === -1 ? Infinity : bRank;
                const comparison = aFinalRank - bFinalRank;
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            }

            const key = sortConfig.key as keyof Student;
            const aValue = a[key];
            const bValue = b[key];
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            const comparison = typeof aValue === 'number' && typeof bValue === 'number'
                ? aValue - bValue
                : String(aValue).localeCompare(String(bValue));

            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }, [students, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: (current && current.key === key && current.direction === 'asc') ? 'desc' : 'asc'
        }));
    };
    
    const handleNavigate = (studentId: string) => {
        setEditingStatusRowId(null);
        navigate(`/student/${studentId}`);
    };

    const handleToggleStatusEditor = (studentId: string) => {
        setEditingStatusRowId(prevId => (prevId === studentId ? null : studentId));
    };

    const handleStatusUpdate = async (studentId: string, newStatus: StatusValue | 'delete') => {
        try {
            if (newStatus === 'delete') {
                if (window.confirm("정말로 이 학생 정보를 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
                    await deleteStudent(studentId);
                }
            } else {
                await updateStudent({ id: studentId, status: newStatus });
            }
        } catch (error) {
            console.error("상태 업데이트 또는 삭제 중 오류 발생:", error);
        } finally {
            setEditingStatusRowId(null);
            setActiveCardId(null);
        }
    };

    const handleCancelStatusEdit = () => {
        setEditingStatusRowId(null);
    };

    const handleCardClick = (studentId: string) => {
        if (editingStatusRowId !== null) return;
        
        setActiveCardId(prevId => (prevId === studentId ? null : studentId));
    };
    
    const closeActiveCard = () => {
        setActiveCardId(null);
    };

    return (
        <StudentDisplay
            ref={scrollContainerRef}
            scrollContainerProps={{
                onMouseDown: onMouseDown,
                className: `draggable ${isDragging ? 'dragging' : ''}`.trim(),
            }}
            students={sortedStudents}
            isLoading={isLoading}
            sortConfig={sortConfig}
            onSort={handleSort}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            isHeaderChecked={isAllSelected}
            onToggleHeader={toggleSelectAll}
            isHeaderDisabled={students.length === 0}
            editingStatusRowId={editingStatusRowId}
            onEdit={onRequestEdit} 
            onNavigate={handleNavigate}
            onToggleStatusEditor={handleToggleStatusEditor}
            onStatusUpdate={handleStatusUpdate}
            onCancel={handleCancelStatusEdit}
            activeCardId={activeCardId}
            onCardClick={handleCardClick}
            closeActiveCard={closeActiveCard}
        />
    );
};

export default StudentTableWidget;
----- ./react/widgets/UserDetailsButton.tsx -----
import React, { useState } from "react";
import {
  useAuthStore,
  selectUser,
  selectIsAuthenticated,
  selectIsLoadingAuth,
  selectAuthError, // API 호출이 없으므로 이 에러는 직접 관련 없을 수 있지만, 참고용으로 추가
} from "../shared/store/authStore";

export const UserDetailsButton: React.FC = () => {
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoadingAuth = useAuthStore(selectIsLoadingAuth);

  const [userDetailsString, setUserDetailsString] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null); // 이 컴포넌트 내 작업 관련 에러

  const handleShowDetails = () => {
    setLocalError(null); // 이전 에러 클리어
    setUserDetailsString(null); // 이전 상세정보 클리어

    if (isLoadingAuth) {
      setLocalError("아직 인증 정보를 확인 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (!isAuthenticated || !user) {
      setLocalError("사용자 정보를 표시하려면 먼저 로그인해야 합니다.");
      return;
    }

    try {
      const displayUserInfo = {
        id: user.id,
        email: user.email,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
        created_at: user.created_at,
      };
      setUserDetailsString(JSON.stringify(displayUserInfo, null, 2));
    } catch (e: any) {
      console.error("Error processing user details:", e);
      setLocalError("사용자 정보를 처리하는 중 오류가 발생했습니다.");
    }
  };

  /*
  const { honoClient } = await import("../shared/api/honoClient"); // 동적 import 예시

  const handleFetchDetailsFromApi = async () => {
    setLocalError(null);
    setUserDetailsString(null);

    if (isLoadingAuth) {
      setLocalError("아직 인증 정보를 확인 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (!isAuthenticated) {
      setLocalError("API를 호출하려면 먼저 로그인해야 합니다.");
      return;
    }

    try {
      const res = await honoClient.user.$get(); // honoClient import 필요

      if (!res.ok) {
        let errorMsg = `Error: ${res.status} ${res.statusText}`;
        try {
          const errData = await res.json();
          if (typeof errData === "object" && errData !== null) {
            if ("error" in errData && typeof errData.error === "string") errorMsg = errData.error;
            else if ("message" in errData && typeof errData.message === "string") errorMsg = errData.message;
          }
        } catch (e) {  } // json parsing 실패 무시
        throw new Error(errorMsg);
      }
      const data = await res.json();
      setUserDetailsString(JSON.stringify(data, null, 2));
    } catch (err: any) {
      console.error("Error fetching user details from API:", err);
      setLocalError(err.message || "API에서 사용자 정보를 가져오는 데 실패했습니다.");
    } finally {
    }
  };
  */

  return (
    <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '4px' }}>
      <h3 style={{ marginTop: '0' }}>내 사용자 정보 확인</h3>
      <button
        type="button"
        onClick={handleShowDetails} // API 호출이 필요하면 handleFetchDetailsFromApi로 변경
        disabled={isLoadingAuth} // API 호출 시에는 isFetchingApi도 고려
        style={{ padding: '8px 12px', marginBottom: '10px' }}
      >
        {isLoadingAuth ? '인증 확인 중...' : '내 정보 보기 (Store)'}
        {/* API 호출 시: {isFetchingApi ? '정보 가져오는 중...' : '내 정보 보기 (API)'} */}
      </button>

      {localError && <p style={{ color: "red" }}>{localError}</p>}
      {/* authStoreError도 필요하다면 여기에 표시할 수 있습니다. */}
      {/* authStoreError && <p style={{ color: "orange" }}>인증 시스템 에러: {authStoreError}</p> */}

      {userDetailsString && (
        <pre style={{ background: '#f7f7f7', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {userDetailsString}
        </pre>
      )}
      {!userDetailsString && !localError && !isLoadingAuth && isAuthenticated && (
        <p>버튼을 클릭하여 사용자 정보를 확인하세요.</p>
      )}
      {!isAuthenticated && !isLoadingAuth && (
        <p>로그인 후 사용자 정보를 확인할 수 있습니다.</p>
      )}
    </div>
  );
};

