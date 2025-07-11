// 이전과 동일
import { handleApiResponse } from '../../../shared/api/api.utils';
import type { FullExamReport } from '../model/types';

const API_BASE_URL = '/api/exams/assignments';

export const fetchExamReportAPI = async (assignmentId: string): Promise<FullExamReport> => {
    const response = await fetch(`${API_BASE_URL}/${assignmentId}/report`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse<FullExamReport>(response);
};