// ----- ./react/widgets/mobile-exam-view/MobileExamView.tsx -----

import React, { useCallback, useEffect, useRef, useState } from 'react';
import MobileExamProblem from '../../entities/exam/ui/MobileExamProblem';
import { useExamLayoutStore } from '../../features/problem-publishing/model/examLayoutStore';

import { useMobileExamSessionStore } from '../../features/mobile-exam-session/model/mobileExamSessionStore';
import { useMobileExamAnswerStore } from '../../features/mobile-exam-session/model/mobileExamAnswerStore';
import { useMobileExamTimeStore } from '../../features/mobile-exam-session/model/mobileExamTimeStore';

import { ProblemNavBar as MobileProblemNavBar } from '../../features/mobile-exam-session/ui/MboileProblemNavBar'; 

import type { AnswerNumber, MarkingStatus } from '../../features/omr-marking'; // [수정] AnswerNumber 포함
import type { ProcessedProblem } from '../../features/problem-publishing';
import { useMobileExamSync } from './useMobileExamSync';
import './MobileExamView.css';

interface MobileExamViewProps {
    problems: ProcessedProblem[];
}

const MobileExamView: React.FC<MobileExamViewProps> = ({ problems }) => {
    const { orderedProblems, activeProblemId, skippedProblemIds, setActiveProblemId, skipProblem, initializeSession, completeExam } = useMobileExamSessionStore();
    const { answers, subjectiveAnswers, statuses, markAnswer, markSubjectiveAnswer, markStatus } = useMobileExamAnswerStore();
    const { baseFontSize, contentFontSizeEm, useSequentialNumbering } = useExamLayoutStore();
    const { finalizeProblemTime } = useMobileExamTimeStore();

    const problemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const { startNavigating } = useMobileExamSync({ orderedProblems, problemRefs });
    const [initialAnswersOnFocus, setInitialAnswersOnFocus] = useState<Map<string, Set<AnswerNumber> | string>>(new Map()); // [수정] 타입 변경

    useEffect(() => {
        if (problems && problems.length > 0) {
            initializeSession(problems);
        }
    }, [problems, initializeSession]);

    useEffect(() => {
        if (activeProblemId) {
            const problem = orderedProblems.find(p => p.uniqueId === activeProblemId);
            if (!problem) return;

            const newInitialAnswers = new Map(initialAnswersOnFocus);
            // [수정] isSubjective 대신 problem_type으로 분기
            if (problem.problem_type === '서답형' || problem.problem_type === '논술형') {
                newInitialAnswers.set(activeProblemId, subjectiveAnswers.get(activeProblemId) || '');
            } else {
                newInitialAnswers.set(activeProblemId, new Set(answers.get(activeProblemId)));
            }
            setInitialAnswersOnFocus(newInitialAnswers);
        }
    }, [activeProblemId, orderedProblems, answers, subjectiveAnswers]);

    const handleNavClick = useCallback((problemId: string) => {
        startNavigating();
        setActiveProblemId(problemId);
    }, [startNavigating, setActiveProblemId]);
    
    const moveToNextProblem = useCallback((currentProblemId: string) => {
        const currentIndex = orderedProblems.findIndex(p => p.uniqueId === currentProblemId);
        if (currentIndex < orderedProblems.length - 1) {
            handleNavClick(orderedProblems[currentIndex + 1].uniqueId);
        }
    }, [orderedProblems, handleNavClick]);

    const handleCommitAndProceed = useCallback((problemId: string, status?: MarkingStatus) => {
        const problem = orderedProblems.find(p => p.uniqueId === problemId);
        if (!problem) return;

        const finalStatus = statuses.get(problemId);
        const isCompleted = finalStatus === 'A' || finalStatus === 'B';

        let answerChanged = false;
        const initialAnswer = initialAnswersOnFocus.get(problemId);
        // [수정] isSubjective 대신 problem_type으로 분기
        if (problem.problem_type === '서답형' || problem.problem_type === '논술형') {
            answerChanged = initialAnswer !== (subjectiveAnswers.get(problemId) || '');
        } else {
            const currentAnswerSet = answers.get(problemId) || new Set();
            const initialAnswerSet = (initialAnswer as Set<AnswerNumber>) || new Set(); // [수정] 타입 캐스팅
            answerChanged = currentAnswerSet.size !== initialAnswerSet.size || ![...currentAnswerSet].every(val => initialAnswerSet.has(val));
        }

        if (status) {
            markStatus(problemId, status);
            finalizeProblemTime(problemId);
        } else {
            if (!finalStatus) { 
                skipProblem(problemId);
            }
            if (!isCompleted || answerChanged) {
                finalizeProblemTime(problemId);
            }
        }
        
        moveToNextProblem(problemId);
    }, [orderedProblems, statuses, initialAnswersOnFocus, subjectiveAnswers, answers, markStatus, skipProblem, finalizeProblemTime, moveToNextProblem]);

    if (orderedProblems.length === 0) {
        return (
            <div className="mobile-exam-status">
                <h2>모바일 시험지</h2>
                <p>시험 문제를 불러오는 중이거나, 출제된 문제가 없습니다.</p>
            </div>
        );
    }
    
    return (
        <div className="mobile-exam-view" style={{ '--base-font-size': baseFontSize } as React.CSSProperties}>
            <header className="mobile-exam-title-header">
                <h1>모바일 시험지</h1>
            </header>
            
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
                        ref={el => {
                            if (el) {
                                problemRefs.current.set(problem.uniqueId, el);
                            } else {
                                problemRefs.current.delete(problem.uniqueId);
                            }
                        }}
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
                        // [핵심 수정] isSubjective prop을 제거하고 problemType을 전달합니다.
                        problemType={problem.problem_type}
                        currentSubjectiveAnswer={subjectiveAnswers.get(problem.uniqueId) || ''}
                        onMarkSubjectiveAnswer={markSubjectiveAnswer}
                    />
                ))}
                <button type="button" className="omr-button submit-exam-button" onClick={completeExam}>
                    시험지 제출하기
                </button>
            </div>
        </div>
    );
};

export default MobileExamView;