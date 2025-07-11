// 이전과 동일
import { useQuery } from '@tanstack/react-query';
import { fetchExamReportAPI } from '../api/examReportApi';
import type { FullExamReport } from './types';

export const EXAM_REPORT_QUERY_KEY = 'examReport';

export const useExamReportQuery = (assignmentId: string | undefined) => {
    return useQuery<FullExamReport, Error>({
        queryKey: [EXAM_REPORT_QUERY_KEY, assignmentId],
        queryFn: () => fetchExamReportAPI(assignmentId!),
        enabled: !!assignmentId,
        staleTime: 1000 * 60 * 5,
    });
};