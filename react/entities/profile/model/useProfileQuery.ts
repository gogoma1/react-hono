import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
// [신규] addRoleAPI와 AddRolePayload를 import 합니다.
import { fetchMyProfileAPI, updateMyProfileAPI, deactivateAccountAPI, addRoleAPI } from '../api/profileApi';
import type { MyProfile, UpdateProfilePayload, DbProfile, AddRolePayload } from './types';
import { useAuthStore } from '../../../shared/store/authStore';

export const MY_PROFILE_QUERY_KEY = 'myProfile';

/**
 * 내 프로필 정보를 가져오는 React Query 훅
 */
export function useMyProfileQuery() {
    return useQuery<MyProfile, Error>({
        queryKey: [MY_PROFILE_QUERY_KEY],
        queryFn: fetchMyProfileAPI,
        staleTime: 1000 * 60 * 5, // 5분
    });
}

/**
 * [신규] 내 프로필에 새로운 역할을 추가하는 Mutation
 */
export function useAddRoleMutation() {
    const queryClient = useQueryClient();
    return useMutation<DbProfile, Error, AddRolePayload>({
        mutationFn: addRoleAPI,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [MY_PROFILE_QUERY_KEY] });
            alert('새로운 역할이 성공적으로 추가되었습니다.');
        },
        onError: (error) => {
            alert(`역할 추가 실패: ${error.message}`);
        }
    });
}

/**
 * 내 프로필 정보(이름/전화번호)를 수정하는 Mutation
 */
export function useUpdateProfileMutation() {
    const queryClient = useQueryClient();
    return useMutation<DbProfile, Error, UpdateProfilePayload>({
        mutationFn: updateMyProfileAPI,
        onSuccess: (_data) => {
            queryClient.invalidateQueries({ queryKey: [MY_PROFILE_QUERY_KEY] });
            alert('프로필 정보가 성공적으로 업데이트되었습니다.');
        },
        onError: (error) => {
            alert(`프로필 업데이트 실패: ${error.message}`);
        }
    });
}

/**
 * 계정을 비활성화하는 Mutation
 */
export function useDeactivateAccountMutation() {
    const navigate = useNavigate();
    const signOut = useAuthStore((state) => state.signOut);

    return useMutation<{ message: string }, Error, void>({
        mutationFn: deactivateAccountAPI,
        onSuccess: async () => {
            alert('계정이 비활성화되었습니다. 이용해주셔서 감사합니다.');
            await signOut();
            navigate('/login', { replace: true });
        },
        onError: (error) => {
            alert(`계정 비활성화 실패: ${error.message}`);
        }
    });
}