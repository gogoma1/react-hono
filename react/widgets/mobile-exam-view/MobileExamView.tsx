import React, { useCallback, useRef } from 'react';
import MobileExamProblem from '../../entities/exam/ui/MobileExamProblem';
import { useExamLayoutStore } from '../../features/problem-publishing/model/examLayoutStore';
import { useMobileExamSessionStore } from '../../features/mobile-exam-session/model/mobileExamSessionStore';
import { useMobileExamAnswerStore } from '../../features/mobile-exam-session/model/mobileExamAnswerStore';
import { useMobileExamTimeStore } from '../../features/mobile-exam-session/model/mobileExamTimeStore';
import { ProblemNavBar as MobileProblemNavBar } from '../../features/mobile-exam-session/ui/MboileProblemNavBar'; 
import type { MarkingStatus } from '../../features/omr-marking';
import type { ProcessedProblem } from '../../features/problem-publishing';
import { useMobileExamSync } from './useMobileExamSync';
import './MobileExamView.css';

interface MobileExamViewProps {
    problems: ProcessedProblem[];
}

const MobileExamView: React.FC<MobileExamViewProps> = ({ problems }) => {
    const { orderedProblems, activeProblemId, skippedProblemIds, setActiveProblemId, skipProblem, completeExam, initializeSession } = useMobileExamSessionStore();
    const { answers, subjectiveAnswers, statuses, markAnswer, markSubjectiveAnswer, markStatus } = useMobileExamAnswerStore();
    const { baseFontSize, contentFontSizeEm, useSequentialNumbering } = useExamLayoutStore();
    const { finalizeProblemTime } = useMobileExamTimeStore();

    const problemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const { startNavigating } = useMobileExamSync({ orderedProblems, problemRefs });
    
    const isSessionInitialized = useRef(false);
    if (problems && problems.length > 0 && !isSessionInitialized.current) {
        initializeSession(problems);
        isSessionInitialized.current = true;
    }

    const handleNavClick = useCallback((problemId: string) => {
        startNavigating();
        setActiveProblemId(problemId);
    }, [startNavigating, setActiveProblemId]);
    
    const moveToNextProblem = useCallback((currentProblemId: string) => {
        const currentIndex = orderedProblems.findIndex(p => p.uniqueId === currentProblemId);
        const nextIndex = currentIndex + 1;
        if (nextIndex < orderedProblems.length) {
            handleNavClick(orderedProblems[nextIndex].uniqueId);
        } else {
            console.log("마지막 문제입니다.");
        }
    }, [orderedProblems, handleNavClick]);

    const handleCommitAndProceed = useCallback((problemId: string, status?: MarkingStatus) => {
        const problem = orderedProblems.find(p => p.uniqueId === problemId);
        if (!problem) return;

        if (status) {
            markStatus(problemId, status);
            // [핵심 수정] finalizeProblemTime 호출 시 activeProblemId를 전달
            finalizeProblemTime(problemId, activeProblemId);
        } else {
            if (!statuses.has(problemId)) { 
                skipProblem(problemId);
            }
        }
        
        moveToNextProblem(problemId);
    }, [orderedProblems, statuses, markStatus, finalizeProblemTime, skipProblem, moveToNextProblem, activeProblemId]); // activeProblemId 의존성 추가

    if (orderedProblems.length === 0) {
        return <div className="mobile-exam-status"><h2>모바일 시험지</h2><p>시험 문제를 불러오는 중이거나, 출제된 문제가 없습니다.</p></div>;
    }
    
    return (
        <div className="mobile-exam-view" style={{ '--base-font-size': baseFontSize } as React.CSSProperties}>
            <header className="mobile-exam-title-header"><h1>모바일 시험지</h1></header>
            <MobileProblemNavBar
                orderedProblems={orderedProblems}
                activeProblemId={activeProblemId}
                statuses={statuses}
                answers={answers}
                subjectiveAnswers={subjectiveAnswers}
                skippedProblemIds={skippedProblemIds}
                useSequentialNumbering={useSequentialNumbering}
                onNavClick={handleNavClick}
            />
            <div className="mobile-exam-problem-list">
                {orderedProblems.map((problem) => (
                    <MobileExamProblem
                        ref={el => { if (el) problemRefs.current.set(problem.uniqueId, el); else problemRefs.current.delete(problem.uniqueId); }}
                        key={problem.uniqueId}
                        problem={problem}
                        allProblems={orderedProblems}
                        useSequentialNumbering={useSequentialNumbering}
                        contentFontSizeEm={contentFontSizeEm}
                        contentFontFamily="'NanumGothic', 'Malgun Gothic', sans-serif"
                        currentAnswers={answers.get(problem.uniqueId) || null}
                        currentStatus={statuses.get(problem.uniqueId) || null}
                        onMarkAnswer={markAnswer}
                        onCommitAndProceed={handleCommitAndProceed}
                        problemType={problem.problem_type}
                        currentSubjectiveAnswer={subjectiveAnswers.get(problem.uniqueId) || ''}
                        onMarkSubjectiveAnswer={markSubjectiveAnswer}
                    />
                ))}
                <button type="button" className="omr-button submit-exam-button" onClick={completeExam}>시험지 제출하기</button>
            </div>
        </div>
    );
};

export default MobileExamView;