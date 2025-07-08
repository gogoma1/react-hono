// ./react/shared/utils/problem.utils.ts

import type { Problem } from "../../entities/problem/model/types";
import type { ProcessedProblem } from "../../features/problem-publishing/model/problemPublishingStore";

/**
 * DB에서 가져온 Problem 배열을 프론트엔드에서 사용하기 편한 ProcessedProblem 배열로 변환합니다.
 * @param problems - DB에서 조회한 원본 문제 객체 배열
 * @returns uniqueId와 display_question_number가 추가된 문제 객체 배열
 */
export const processProblemsForDisplay = (problems: Problem[]): ProcessedProblem[] => {
    if (!problems) return [];

    return problems.map((p) => ({
        ...p,
        question_text: p.question_text ?? '',
        solution_text: p.solution_text ?? '',
        uniqueId: p.problem_id, // 고유 식별자
        display_question_number: p.problem_type === '서답형'
            ? `서답형 ${p.question_number}`
            : String(p.question_number),
    }));
};