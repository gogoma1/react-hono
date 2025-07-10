import type { ProcessedProblem } from '../../problem-publishing';
import type { MobileExamAnswerState } from '../model/mobileExamAnswerStore';
import type { MobileExamTimeState } from '../model/mobileExamTimeStore';

interface ProblemResultPayload {
    problem_id: string;
    is_correct?: boolean;
    time_taken_seconds: number;
    submitted_answer: any;
    meta_cognition_status?: 'A' | 'B' | 'C' | 'D';
    answer_change_count: number;
}

interface ExamSummaryPayload {
    exam_start_time: string;
    exam_end_time: string;
    total_pure_time_seconds: number;
    correct_rate: number;
    answer_change_total_count: number;
}

/**
 * 모든 상태값을 받아 백엔드로 보낼 최종 페이로드를 생성하는 함수.
 * 이 함수는 시험 제출 시점과, 나중에 리포트 페이지에서 결과를 다시 분석할 때 모두 사용될 수 있습니다.
 * @param problems - 정답 정보가 포함된 문제 배열
 * @param answerState - mobileExamAnswerStore의 전체 상태
 * @param timeState - mobileExamTimeStore의 전체 상태
 * @returns { exam_summary, problem_results }
 */
export function analyzeExamResults(
    problems: ProcessedProblem[],
    answerState: MobileExamAnswerState,
    timeState: MobileExamTimeState
) {
    const { answers, subjectiveAnswers, statuses, modifiedProblemIds } = answerState;
    const { examStartTime, examEndTime, problemTimes } = timeState;

    let correctCount = 0;
    const scorableProblems: ProcessedProblem[] = [];

    const problem_results: ProblemResultPayload[] = problems.map(problem => {
        let isCorrect: boolean | undefined = undefined;
        
        if (problem.problem_type === '객관식' || problem.problem_type === 'OX') {
            scorableProblems.push(problem);
            const userAnswers = answers.get(problem.uniqueId);

            const correctAnswers = new Set(problem.answer.split(',').map(a => a.trim()));

            if (userAnswers && userAnswers.size === correctAnswers.size) {
                isCorrect = [...userAnswers].every(ans => correctAnswers.has(String(ans)));
            } else {
                isCorrect = false;
            }

            if (isCorrect) correctCount++;
        } 
        // --- [핵심 수정] 서답형 문제 자동 채점 로직 추가 ---
        else if (problem.problem_type === '서답형') {
            // 학생이 입력한 답과 문제의 정답을 가져옴 (앞뒤 공백 제거)
            const userAnswerString = (subjectiveAnswers.get(problem.uniqueId) || '').trim();
            const correctAnswerString = (problem.answer || '').trim();

            // 두 값 모두 비어있지 않은 경우에만 채점 시도
            if (userAnswerString && correctAnswerString) {
                const userAnswerNumber = parseInt(userAnswerString, 10);
                const correctAnswerNumber = parseInt(correctAnswerString, 10);
                
                // 두 값 모두 유효한 숫자인 경우에만 비교
                if (!isNaN(userAnswerNumber) && !isNaN(correctAnswerNumber)) {
                    isCorrect = userAnswerNumber === correctAnswerNumber;
                } else {
                    isCorrect = false; // 하나라도 숫자로 변환 실패 시 오답 처리
                }
            } else {
                isCorrect = false; // 답을 입력하지 않았거나, 정답이 없는 경우 오답 처리
            }

            scorableProblems.push(problem); // 채점 가능 문제에 포함
            if (isCorrect) correctCount++;
        }

        let submittedAnswer: string | (string | number)[] | null = null;
        if (problem.problem_type === '서답형' || problem.problem_type === '논술형') {
            submittedAnswer = subjectiveAnswers.get(problem.uniqueId) || null;
        } else {
            const answerSet = answers.get(problem.uniqueId);
            submittedAnswer = answerSet ? Array.from(answerSet) : null;
        }

        return {
            problem_id: problem.problem_id,
            is_correct: isCorrect, // 계산된 채점 결과가 반영됨
            time_taken_seconds: Math.round(problemTimes.get(problem.uniqueId) || 0),
            submitted_answer: submittedAnswer,
            meta_cognition_status: statuses.get(problem.uniqueId),
            answer_change_count: modifiedProblemIds.has(problem.uniqueId) ? 1 : 0,
        };
    });

    const total_pure_time_seconds = Array.from(problemTimes.values())
                                      .reduce((sum, time) => sum + time, 0);

    const exam_summary: ExamSummaryPayload = {
        exam_start_time: examStartTime!.toISOString(),
        exam_end_time: examEndTime!.toISOString(),
        total_pure_time_seconds: Math.round(total_pure_time_seconds),
        correct_rate: scorableProblems.length > 0 ? (correctCount / scorableProblems.length) * 100 : 0,
        answer_change_total_count: modifiedProblemIds.size,
    };

    return { exam_summary, problem_results };
}