import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { fetchMyProfileAPI, updateMyProfileAPI, deactivateAccountAPI, addRoleAPI, deleteRoleAPI, checkProfileExistsAPI } from '../api/profileApi';
import type { MyProfile, UpdateProfilePayload, DbProfile, AddRolePayload } from './types';
import { useAuthStore } from '../../../shared/store/authStore';
import { useToast } from '../../../shared/store/toastStore';

export const MY_PROFILE_QUERY_KEY = 'myProfile';
export const PROFILE_EXISTS_QUERY_KEY = 'profileExists'; // [신규] 쿼리 키 정의

/**
 * [신규] 현재 사용자의 프로필 존재 여부를 확인하는 React Query 훅
 */
export function useProfileExistsQuery() {
    return useQuery<{ success: boolean, exists: boolean }, Error>({
        queryKey: [PROFILE_EXISTS_QUERY_KEY],
        queryFn: checkProfileExistsAPI,
        staleTime: Infinity, // 한번 확인하면 바뀌지 않으므로 staleTime을 무한으로 설정
        gcTime: Infinity,    // gcTime도 무한으로 설정하여 캐시 유지
        retry: 1,            // 실패 시 1번만 재시도
    });
}

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
 * 내 프로필에 새로운 역할을 추가하는 Mutation
 */
export function useAddRoleMutation() {
    const queryClient = useQueryClient();
    const toast = useToast(); // [추가] 토스트 훅 사용

    return useMutation<DbProfile, Error, AddRolePayload>({
        mutationFn: addRoleAPI,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [MY_PROFILE_QUERY_KEY] });
            toast.success('새로운 역할이 성공적으로 추가되었습니다.');
        },
        onError: (error) => {
            toast.error(`역할 추가 실패: ${error.message}`);
        }
    });
}

/**
 * 내 프로필에서 역할을 삭제하는 Mutation
 */
export function useDeleteRoleMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation<{ message: string }, Error, string>({
        mutationFn: deleteRoleAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [MY_PROFILE_QUERY_KEY] });
            toast.info(data.message);
        },
        onError: (error) => {
            toast.error(`역할 삭제 실패: ${error.message}`);
        }
    });
}


/**
 * 내 프로필 정보(이름/전화번호)를 수정하는 Mutation
 */
export function useUpdateProfileMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation<DbProfile, Error, UpdateProfilePayload>({
        mutationFn: updateMyProfileAPI,
        onSuccess: (_data) => {
            queryClient.invalidateQueries({ queryKey: [MY_PROFILE_QUERY_KEY] });
            toast.success('프로필 정보가 성공적으로 업데이트되었습니다.');
        },
        onError: (error) => {
            toast.error(`프로필 업데이트 실패: ${error.message}`);
        }
    });
}

/**
 * 계정을 비활성화하는 Mutation
 */
export function useDeactivateAccountMutation() {
    const navigate = useNavigate();
    const signOut = useAuthStore((state) => state.signOut);
    const toast = useToast();

    return useMutation<{ message: string }, Error, void>({
        mutationFn: deactivateAccountAPI,
        onSuccess: async () => {
            toast.info('계정이 비활성화되었습니다. 이용해주셔서 감사합니다.');
            await signOut();
            navigate('/login', { replace: true });
        },
        onError: (error) => {
            toast.error(`계정 비활성화 실패: ${error.message}`);
        }
    });
}