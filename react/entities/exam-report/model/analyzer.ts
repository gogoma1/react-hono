import type { ProcessedProblem } from '../../../features/problem-publishing';
import type { MobileExamAnswerState } from '../../../features/mobile-exam-session/model/mobileExamAnswerStore';
import type { MobileExamTimeState } from '../../../features/mobile-exam-session/model/mobileExamTimeStore';
import type { FullExamReport, ReportAnalytics, ReportProblemResult, ReportSummary } from './types';
import type { ExamAssignmentWithSet } from '../../exam-assignment/api/examAssignmentApi';
import type { MyProfile } from '../../profile/model/types';

interface ReportSourceData {
    problems: ProcessedProblem[];
    answerState: MobileExamAnswerState;
    timeState: MobileExamTimeState;
    assignmentInfo: ExamAssignmentWithSet;
    studentProfile: MyProfile | { name: string | null } | null;
}

/**
 * 시험 결과를 분석하여 FullExamReport 객체를 생성하는 핵심 함수
 */
export function analyzeAndBuildReport({
    problems,
    answerState,
    timeState,
    assignmentInfo,
    studentProfile,
}: ReportSourceData): FullExamReport {
    const { answers, subjectiveAnswers, statuses, modifiedProblemIds } = answerState;
    const { examStartTime, examEndTime, problemTimes, totalElapsedTime } = timeState;

    // ... (problem_results 계산 로직은 이전과 동일) ...
    let correctCount = 0;
    const scorableProblems: ProcessedProblem[] = [];
    const performanceByDifficulty: Record<string, { total: number, correct: number }> = {};
    const timePerProblem: ReportAnalytics['time_per_problem'] = [];

    const problem_results: ReportProblemResult[] = problems.map(problem => {
        let isCorrect: boolean | null = null;
        const difficulty = problem.difficulty || '미지정';
        
        if (!performanceByDifficulty[difficulty]) {
            performanceByDifficulty[difficulty] = { total: 0, correct: 0 };
        }
        
        if (problem.problem_type === '객관식' || problem.problem_type === 'OX' || problem.problem_type === '서답형') {
            scorableProblems.push(problem);
            performanceByDifficulty[difficulty].total++;
            if (problem.problem_type === '객관식' || problem.problem_type === 'OX') {
                const userAnswers = answers.get(problem.uniqueId);
                const correctAnswers = new Set(problem.answer?.split(',').map(a => a.trim()) || []);
                isCorrect = !!userAnswers && userAnswers.size === correctAnswers.size && [...userAnswers].every(ans => correctAnswers.has(ans));
            } else {
                const userAnswer = (subjectiveAnswers.get(problem.uniqueId) || '').trim();
                const correctAnswer = (problem.answer || '').trim();
                isCorrect = userAnswer !== '' && userAnswer === correctAnswer;
            }
        }

        if (isCorrect) {
            correctCount++;
            performanceByDifficulty[difficulty].correct++;
        }
        
        const timeTaken = Math.round(problemTimes.get(problem.uniqueId) || 0);
        timePerProblem.push({
            problem_number: problem.display_question_number,
            time_taken: timeTaken,
            is_correct: isCorrect,
        });

        let formattedSubmittedAnswer: string | string[] | null = null;
        if (problem.problem_type === '서답형' || problem.problem_type === '논술형') {
            formattedSubmittedAnswer = subjectiveAnswers.get(problem.uniqueId) || null;
        } else {
            const answerSet = answers.get(problem.uniqueId);
            formattedSubmittedAnswer = answerSet && answerSet.size > 0 ? Array.from(answerSet).sort() : null;
        }

        return {
            problem_id: problem.problem_id,
            is_correct: isCorrect,
            time_taken_seconds: timeTaken,
            submitted_answer: formattedSubmittedAnswer,
            meta_cognition_status: statuses.get(problem.uniqueId) || null,
            answer_change_count: modifiedProblemIds.has(problem.uniqueId) ? 1 : 0,
            problem: {
                question_number: problem.question_number,
                display_question_number: problem.display_question_number,
                question_text: problem.question_text,
                answer: problem.answer,
                solution_text: problem.solution_text,
                problem_type: problem.problem_type,
                major_chapter_name: problem.major_chapter_id,
                middle_chapter_name: problem.middle_chapter_id,
                difficulty: problem.difficulty,
                score: problem.score,
            },
        };
    });

    const total_pure_time_seconds = Array.from(problemTimes.values()).reduce((sum, time) => sum + time, 0);
    const summary: ReportSummary = {
        assignment_id: assignmentInfo.id,
        student_name: studentProfile?.name || '학생',
        exam_title: assignmentInfo.examSet.title,
        correct_rate: scorableProblems.length > 0 ? (correctCount / scorableProblems.length) * 100 : 0,
        total_duration_seconds: Math.round(totalElapsedTime),
        total_pure_time_seconds: Math.round(total_pure_time_seconds),
        completed_at: examEndTime!.toISOString(),
        total_problems: problems.length,
        attempted_problems: Array.from(statuses.keys()).filter(key => statuses.get(key) === 'A' || statuses.get(key) === 'B').length,
        // [수정] answer_change_total_count를 여기서 계산하여 summary에 포함
        answer_change_total_count: modifiedProblemIds.size,
    };
    
    // ... (이하 analytics 계산 로직은 동일) ...
    const metacognitionDistribution: ReportAnalytics['metacognition_summary']['distribution'] = [];
    let metaScoreSum = 0;
    const metaScoreMap = { A: 1, B: 2, D: 3, C: 4 };
    let metaAnsweredCount = 0;
    
    ['A', 'B', 'C', 'D'].forEach(status => {
        const count = Array.from(statuses.values()).filter(s => s === status).length;
        metacognitionDistribution.push({ status: status as 'A'|'B'|'C'|'D', count });
        metaScoreSum += count * (metaScoreMap[status as keyof typeof metaScoreMap]);
        metaAnsweredCount += count;
    });

    const difficultyOrder = ['최하', '하', '중', '상', '최상'];
    const performance_by_difficulty = difficultyOrder
        .map(diff => {
            const data = performanceByDifficulty[diff];
            return {
                difficulty: diff,
                correct_rate: data && data.total > 0 ? (data.correct / data.total) * 100 : 0,
            };
        })
        .filter(d => performanceByDifficulty[d.difficulty] && performanceByDifficulty[d.difficulty].total > 0);

    const analytics: ReportAnalytics = {
        time_per_problem: timePerProblem,
        average_time_per_problem: problems.length > 0 ? total_pure_time_seconds / problems.length : 0,
        metacognition_summary: {
            overall_score: metaAnsweredCount > 0 ? metaScoreSum / metaAnsweredCount : null,
            distribution: metacognitionDistribution,
        },
        performance_by_difficulty: performance_by_difficulty,
    };
    
    return { summary, analytics, problem_results };
}