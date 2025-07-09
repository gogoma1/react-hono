import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchStaffAPI,
    addStaffAPI,
    updateStaffAPI,
    resignStaffAPI,
} from '../api/staffApi';
import type { StaffMember, CreateStaffInput, UpdateStaffInput } from './types';

export const STAFF_QUERY_KEY = 'staff';

/**
 * 특정 학원의 강사/직원 데이터를 관리하는 React Query 훅.
 * @param academyId - 관리할 대상 학원의 ID.
 */
export function useStaffData(academyId: string | null | undefined) {
    const queryClient = useQueryClient();
    // [수정] 쿼리 키에 academyId를 포함시켜 학원별로 캐시를 관리합니다.
    const queryKey = [STAFF_QUERY_KEY, academyId];

    const {
        data: staffMembers = [],
        isLoading: isLoadingStaff,
        isError: isStaffError,
        error: staffError,
    } = useQuery<StaffMember[], Error>({
        queryKey: queryKey,
        queryFn: () => fetchStaffAPI(academyId!),
        enabled: !!academyId, // academyId가 있을 때만 쿼리를 실행합니다.

        // [핵심 수정] 캐싱 시간을 길게 설정합니다.
        // staleTime: 데이터가 10분 동안 '신선한' 상태를 유지합니다.
        // 이 시간 내에는 사이드바를 몇 번을 열어도 네트워크 요청을 다시 보내지 않습니다.
        staleTime: 1000 * 60 * 10, // 10분
        
        // gcTime: 이 쿼리를 사용하는 컴포넌트가 모두 사라져도 15분 동안 캐시를 메모리에 유지합니다.
        // 사용자가 다른 페이지에 갔다가 다시 돌아와도 빠르게 데이터를 보여줄 수 있습니다.
        gcTime: 1000 * 60 * 15, // 15분
    });

    const addStaffMutation = useMutation<StaffMember, Error, CreateStaffInput>({
        mutationFn: addStaffAPI,
        onSuccess: (newMember) => {
            // [중요] 새로운 강사가 추가되면, 해당 학원의 캐시를 무효화하여 최신 목록을 다시 불러오게 합니다.
            queryClient.invalidateQueries({ queryKey: [STAFF_QUERY_KEY, newMember.academy_id] });
        },
    });

    const updateStaffMutation = useMutation<StaffMember, Error, UpdateStaffInput>({
        mutationFn: updateStaffAPI,
        onSuccess: (updatedMember) => {
            // 강사 정보가 수정되어도 캐시를 무효화합니다.
            queryClient.invalidateQueries({ queryKey: [STAFF_QUERY_KEY, updatedMember.academy_id] });
        }
    });

    const resignStaffMutation = useMutation<{ message: string, id: string }, Error, string>({
        mutationFn: resignStaffAPI,
        onSuccess: () => {
            // 강사가 퇴사 처리되어도 캐시를 무효화합니다.
            queryClient.invalidateQueries({ queryKey: queryKey });
        },
    });

    return {
        staffMembers,
        isLoadingStaff,
        isStaffError,
        staffError,
        addStaff: addStaffMutation.mutateAsync,
        addStaffStatus: addStaffMutation,
        updateStaff: updateStaffMutation.mutateAsync,
        updateStaffStatus: updateStaffMutation,
        resignStaff: resignStaffMutation.mutateAsync,
        resignStaffStatus: resignStaffMutation,
    };
}