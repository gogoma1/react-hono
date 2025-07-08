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
    const queryKey = [STAFF_QUERY_KEY, academyId];

    const {
        data: staffMembers = [],
        isLoading: isLoadingStaff,
        isError: isStaffError,
        error: staffError,
    } = useQuery<StaffMember[], Error>({
        queryKey: queryKey,
        queryFn: () => fetchStaffAPI(academyId!),
        enabled: !!academyId,
        staleTime: 1000 * 60 * 2, // 2분
    });

    const addStaffMutation = useMutation<StaffMember, Error, CreateStaffInput>({
        mutationFn: addStaffAPI,
        onSuccess: (newMember) => {
            queryClient.invalidateQueries({ queryKey: [STAFF_QUERY_KEY, newMember.academy_id] });
        },
    });

    const updateStaffMutation = useMutation<StaffMember, Error, UpdateStaffInput>({
        mutationFn: updateStaffAPI,
        onSuccess: (updatedMember) => {
            queryClient.invalidateQueries({ queryKey: [STAFF_QUERY_KEY, updatedMember.academy_id] });
        }
    });

    const resignStaffMutation = useMutation<{ message: string, id: string }, Error, string>({
        mutationFn: resignStaffAPI,
        onSuccess: () => {
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