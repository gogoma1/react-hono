import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMyProfileQuery, useUpdateProfileMutation, useDeactivateAccountMutation } from '../../../entities/profile/model/useProfileQuery';
import { updateProfileSchema, type UpdateProfileSchema, type UpdateProfilePayload } from '../../../entities/profile/model/types';

// [수정] 'addRole' 상태를 추가합니다.
export type AccountSettingsSection = 'general' | 'account' | 'addRole';

export function useAccountSettings() {
    // [수정] Section 타입 적용
    const [activeSection, setActiveSection] = useState<AccountSettingsSection>('general');

    const { data: profile, isLoading: isLoadingProfile, isError, error } = useMyProfileQuery();

    const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfileMutation();
    const { mutate: deactivateAccount, isPending: isDeactivating } = useDeactivateAccountMutation();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors: formErrors, isDirty }
    } = useForm<UpdateProfileSchema>({
        resolver: zodResolver(updateProfileSchema),
        defaultValues: {
            name: '',
            phone: '',
        }
    });

    const [deactivationConfirmText, setDeactivationConfirmText] = useState('');
    const isDeactivationConfirmed = deactivationConfirmText === '비활성화';

    useEffect(() => {
        if (profile) {
            reset({
                name: profile.name,
                phone: profile.phone || '',
            });
        }
    }, [profile, reset]);

    // [신규] '역할 추가' 패널에서 성공 또는 취소 시 '일반' 섹션으로 돌아가는 함수
    const handleReturnToGeneral = useCallback(() => {
        setActiveSection('general');
    }, []);

    const handleSaveProfile = useCallback((formData: UpdateProfileSchema) => {
        const payload: UpdateProfilePayload = {
            name: formData.name,
        };

        if (formData.phone && formData.phone.trim() !== '') {
            payload.phone = formData.phone;
        }
        
        updateProfile(payload, {
            onSuccess: (updatedData) => {
                reset({
                    name: updatedData.name,
                    phone: updatedData.phone || '',
                });
            }
        });
    }, [updateProfile, reset]);

    const handleDeactivateAccount = useCallback(() => {
        if (isDeactivationConfirmed) {
            deactivateAccount();
        } else {
            alert("'비활성화'를 정확히 입력해주세요.");
        }
    }, [isDeactivationConfirmed, deactivateAccount]);

    return {
        activeSection,
        setActiveSection,

        profile,
        isLoadingProfile,
        isError,
        error,

        register,
        handleSave: handleSubmit(handleSaveProfile),
        resetForm: reset,
        formErrors,
        isDirty,
        isUpdating,

        deactivationConfirmText,
        setDeactivationConfirmText,
        isDeactivationConfirmed,
        handleDeactivateAccount,
        isDeactivating,

        // [신규] 반환
        handleReturnToGeneral,
    };
}