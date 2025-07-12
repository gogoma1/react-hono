import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { handleApiResponse } from '../../../shared/api/api.utils';
import { useMobileExamSessionStore } from './mobileExamSessionStore';
import { useMobileExamAnswerStore } from './mobileExamAnswerStore';
import { useMobileExamTimeStore } from './mobileExamTimeStore';
import { useToast } from '../../../shared/store/toastStore';
import { analyzeAndBuildReport } from '../../../entities/exam-report/model/analyzer';
import type { ProcessedProblem } from '../../problem-publishing';
import type { ExamAssignmentWithSet } from '../../../entities/exam-assignment/api/examAssignmentApi';
import type { MyProfile } from '../../../entities/profile/model/types';

interface SubmitPayload {
    exam_summary: {
        exam_start_time: string;
        exam_end_time: string;
        total_pure_time_seconds: number;
        correct_rate: number;
        answer_change_total_count: number;
    };
    problem_results: {
        problem_id: string;
        is_correct?: boolean;
        time_taken_seconds: number;
        submitted_answer?: string | null;
        meta_cognition_status?: 'A' | 'B' | 'C' | 'D';
        answer_change_count: number;
    }[];
}

interface SubmitVariables {
    assignmentId: string;
    payload: SubmitPayload;
}
interface SubmitResponse {
    message: string;
    assignment_id: string;
}

const API_BASE_URL = '/api/exams';

export function useExamSubmit(
    assignmentInfo: ExamAssignmentWithSet | null,
    problems: ProcessedProblem[],
    studentProfile: MyProfile | null
) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const toast = useToast();
    
    const { mutate, isPending, isError, error } = useMutation<SubmitResponse, Error, SubmitVariables>({
        mutationFn: async (variables) => {
            const { assignmentId, payload } = variables;
            const res = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/submit`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload)
            });
            return handleApiResponse(res);
        },
        onSuccess: (data) => {
            toast.success(data.message || '시험이 성공적으로 제출되었습니다.');
            queryClient.invalidateQueries({ queryKey: ['myAssignments'] });
        },
        onError: (err) => { toast.error(`시험 제출 실패: ${err.message}`); }
    });

    const handleSubmitExam = useCallback(() => {
        if (!assignmentInfo) {
            toast.error("제출할 시험 정보가 없습니다.");
            return;
        }
        
        useMobileExamSessionStore.getState().completeExam(); 

        const answerState = useMobileExamAnswerStore.getState();
        const timeState = useMobileExamTimeStore.getState();
        
        const fullReport = analyzeAndBuildReport({
            problems,
            answerState,
            timeState,
            assignmentInfo,
            studentProfile,
        });

        const payload: SubmitPayload = {
            exam_summary: {
                exam_start_time: timeState.examStartTime!.toISOString(),
                exam_end_time: timeState.examEndTime!.toISOString(),
                total_pure_time_seconds: fullReport.summary.total_pure_time_seconds || 0,
                correct_rate: fullReport.summary.correct_rate || 0,
                answer_change_total_count: fullReport.summary.answer_change_total_count,
            },
            problem_results: fullReport.problem_results.map(r => {
                const finalSubmittedAnswer = Array.isArray(r.submitted_answer)
                    ? r.submitted_answer.join(', ')
                    : r.submitted_answer;

                return {
                    problem_id: r.problem_id,
                    is_correct: r.is_correct ?? undefined,
                    time_taken_seconds: r.time_taken_seconds,
                    submitted_answer: finalSubmittedAnswer,
                    meta_cognition_status: r.meta_cognition_status ?? undefined,
                    answer_change_count: r.answer_change_count,
                };
            })
        };
        
        mutate({ assignmentId: assignmentInfo.id, payload });

        // [핵심 수정] 제출 후 상태 리셋 및 페이지 이동
        useMobileExamSessionStore.getState().resetSession();
        navigate(`/exam-report/${assignmentInfo.id}`, { state: { reportData: fullReport } });

    }, [assignmentInfo, problems, studentProfile, mutate, navigate, toast]);

    return {
        submitExam: handleSubmitExam,
        isSubmitting: isPending,
        isSubmitError: isError,
        submitError: error,
    };
}