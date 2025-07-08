import React, { useCallback, useEffect, useRef, useState } from 'react';
import MobileExamProblem from '../../entities/exam/ui/MobileExamProblem';
import { useExamLayoutStore } from '../../features/problem-publishing/model/examLayoutStore';

// 중앙 상태 관리 스토어들을 모두 import 합니다.
import { useMobileExamSessionStore } from '../../features/mobile-exam-session/model/mobileExamSessionStore';
import { useMobileExamAnswerStore } from '../../features/mobile-exam-session/model/mobileExamAnswerStore';
import { useMobileExamTimeStore } from '../../features/mobile-exam-session/model/mobileExamTimeStore';

// 변경된 파일명을 import 경로에 반영합니다.
import { ProblemNavBar as MobileProblemNavBar } from '../../features/mobile-exam-session/ui/MboileProblemNavBar'; 

import type { MarkingStatus } from '../../features/omr-marking';
import type { ProcessedProblem } from '../../features/problem-publishing';
import { useMobileExamSync } from './useMobileExamSync'; // 스크롤 동기화 훅
import './MobileExamView.css';

// 실제 시험 데이터는 이 컴포넌트의 props로 받아야 합니다.
interface MobileExamViewProps {
    problems: ProcessedProblem[];
}

const MobileExamView: React.FC<MobileExamViewProps> = ({ problems }) => {
    // 1. 중앙 스토어에서 모든 상태와 액션을 가져옵니다.
    const { orderedProblems, activeProblemId, skippedProblemIds, setActiveProblemId, skipProblem, initializeSession, completeExam } = useMobileExamSessionStore();
    const { answers, subjectiveAnswers, statuses, markAnswer, markSubjectiveAnswer, markStatus } = useMobileExamAnswerStore();
    const { baseFontSize, contentFontSizeEm, useSequentialNumbering } = useExamLayoutStore();
    const { finalizeProblemTime } = useMobileExamTimeStore();

    // 2. 뷰와 관련된 로직
    const problemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const { startNavigating } = useMobileExamSync({ orderedProblems, problemRefs });
    const [initialAnswersOnFocus, setInitialAnswersOnFocus] = useState<Map<string, Set<number> | string>>(new Map());

    // 3. 컴포넌트 마운트 시 시험 세션을 초기화합니다.
    useEffect(() => {
        if (problems && problems.length > 0) {
            initializeSession(problems);
        }
    }, [problems, initializeSession]);

    // 4. 이벤트 핸들러 정의
    useEffect(() => {
        if (activeProblemId) {
            const problem = orderedProblems.find(p => p.uniqueId === activeProblemId);
            if (!problem) return;

            const newInitialAnswers = new Map(initialAnswersOnFocus);
            if (problem.problem_type === '서답형') {
                newInitialAnswers.set(activeProblemId, subjectiveAnswers.get(activeProblemId) || '');
            } else {
                newInitialAnswers.set(activeProblemId, new Set(answers.get(activeProblemId)));
            }
            setInitialAnswersOnFocus(newInitialAnswers);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeProblemId]);

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
        if (problem.problem_type === '서답형') {
            answerChanged = initialAnswer !== (subjectiveAnswers.get(problemId) || '');
        } else {
            const currentAnswerSet = answers.get(problemId) || new Set();
            const initialAnswerSet = (initialAnswer as Set<number>) || new Set();
            answerChanged = currentAnswerSet.size !== initialAnswerSet.size || ![...currentAnswerSet].every(val => initialAnswerSet.has(val));
        }

        if (status) {
            // 'A', 'B', 'C', 'D' 버튼을 누른 경우: 원본 로직 유지
            markStatus(problemId, status);
            finalizeProblemTime(problemId);
        } else {
            // '넘기기' 버튼을 누른 경우
            
            // [핵심 수정 1] finalStatus(A,B,C,D)가 없을 때만 스킵 처리
            if (!finalStatus) { 
                skipProblem(problemId);
            }
            
            // [핵심 수정 2] 원본의 시간 기록 로직을 그대로 보존
            // A,B 상태가 아니거나, 답안이 변경되었을 때만 시간 기록
            if (!isCompleted || answerChanged) {
                finalizeProblemTime(problemId);
            }
        }
        
        moveToNextProblem(problemId);
    }, [orderedProblems, statuses, initialAnswersOnFocus, subjectiveAnswers, answers, markStatus, skipProblem, finalizeProblemTime, moveToNextProblem]);

    // 5. UI 렌더링
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
                        isSubjective={problem.problem_type === '서답형'}
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