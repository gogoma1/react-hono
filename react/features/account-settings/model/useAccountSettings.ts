// ./react/features/account-settings/model/useAccountSettings.ts

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMyProfileQuery, useUpdateProfileMutation, useDeactivateAccountMutation, useDeleteRoleMutation } from '../../../entities/profile/model/useProfileQuery';
import { updateProfileSchema, type UpdateProfileSchema, type UpdateProfilePayload } from '../../../entities/profile/model/types';

export type AccountSettingsSection = 'general' | 'account' | 'addRole';

export function useAccountSettings() {
    const [activeSection, setActiveSection] = useState<AccountSettingsSection>('general');

    const { data: profile, isLoading: isLoadingProfile, isError, error } = useMyProfileQuery();

    const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfileMutation();
    const { mutate: deactivateAccount, isPending: isDeactivating } = useDeactivateAccountMutation();
    const { mutate: deleteRole, isPending: isDeletingRole } = useDeleteRoleMutation(); // [신규] 역할 삭제 mutation

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

    const handleReturnToGeneral = useCallback(() => {
        setActiveSection('general');
    }, []);

    const handleSaveProfile = useCallback((formData: UpdateProfileSchema) => {
        const payload: UpdateProfilePayload = {
            name: formData.name,
        };

        const phoneTrimmed = formData.phone?.trim();
        if (phoneTrimmed) {
            payload.phone = phoneTrimmed;
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
    
    const handleDeleteRole = useCallback((roleId: string, roleName: string) => {
        if (window.confirm(`정말로 '${roleName}' 역할을 삭제하시겠습니까?`)) {
            deleteRole(roleId);
        }
    }, [deleteRole]);


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

        handleReturnToGeneral,
        
        handleDeleteRole,
        isDeletingRole,
    };
}