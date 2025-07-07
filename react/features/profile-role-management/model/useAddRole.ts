// ./react/features/profile-role-management/model/useAddRole.ts

import { useState, useMemo, useCallback, useRef } from 'react';
import type { PositionType, AddRolePayload } from '../../../entities/profile/model/types';
import { POSITIONS } from '../../../entities/profile/model/types';
import type { Academy } from '../../../entities/academy/model/types';
import { useAddRoleMutation, useMyProfileQuery } from '../../../entities/profile/model/useProfileQuery';
import { STAFF_GROUP, MEMBER_GROUP } from '../../../entities/profile/model/role-groups';

type ValidationErrors = {
    position?: string;
    academy?: string;
};

/**
 * '역할 추가' 패널의 상태와 로직을 관리하는 훅.
 * @param onSuccess - 역할 추가 성공 시 호출될 콜백 함수.
 */
export const useAddRole = (onSuccess?: () => void) => {
    const academyNameInputRef = useRef<HTMLInputElement>(null);
    const academySearchInputRef = useRef<HTMLInputElement>(null);

    const addRoleMutation = useAddRoleMutation();
    const { data: myProfile } = useMyProfileQuery();

    const [selectedPosition, setSelectedPosition] = useState<PositionType | ''>('');
    const [academyName, setAcademyName] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedAcademy, setSelectedAcademy] = useState<Academy | null>(null);
    
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [apiErrorMessage, setApiErrorMessage] = useState('');

    const needsAcademySelection = useMemo(() => {
        return ['강사', '학생', '학부모'].includes(selectedPosition);
    }, [selectedPosition]);

    const isFormComplete = useMemo(() => {
        if (!selectedPosition) return false;
        if (selectedPosition === '원장') {
            return !!academyName.trim() && !!selectedCity && !!selectedDistrict;
        }
        if (needsAcademySelection) {
            return !!selectedAcademy;
        }
        return true;
    }, [selectedPosition, academyName, selectedCity, selectedDistrict, selectedAcademy, needsAcademySelection]);

    const disabledRoles = useMemo(() => {
        const disabled = new Map<PositionType, string>();
        if (!myProfile) return disabled;

        const targetAcademyId = needsAcademySelection && selectedAcademy ? selectedAcademy.id : null;

        // 사용자의 역할을 학원별로 그룹화합니다.
        const userRolesByAcademy = new Map<string, Set<string>>();
        myProfile.roles.forEach(role => {
            const key = role.academyId || 'global'; // 학원 소속이 아닌 역할은 'global' 키 사용
            if (!userRolesByAcademy.has(key)) {
                userRolesByAcademy.set(key, new Set<string>());
            }
            userRolesByAcademy.get(key)!.add(role.name);
        });

        const globalRoles = userRolesByAcademy.get('global') || new Set<string>();
        const academyRoles = targetAcademyId ? userRolesByAcademy.get(targetAcademyId) || new Set<string>() : new Set<string>();
        
        const hasStaffRoleInAcademy = [...academyRoles].some(r => STAFF_GROUP.includes(r));
        const hasMemberRoleInAcademy = [...academyRoles].some(r => MEMBER_GROUP.includes(r));

        POSITIONS.forEach((pos: PositionType) => {
            if (globalRoles.has(pos)) {
                disabled.set(pos, "이미 보유한 역할입니다.");
                return;
            }

            // 학원이 선택된 경우, 해당 학원 내에서의 역할 충돌을 검사합니다.
            if (targetAcademyId) {
                if (academyRoles.has(pos)) {
                    disabled.set(pos, "이미 이 학원에서 동일한 역할을 가지고 있습니다.");
                    return;
                }
                
                const isAddingStaff = STAFF_GROUP.includes(pos);
                const isAddingMember = MEMBER_GROUP.includes(pos);
                
                if (isAddingStaff && hasMemberRoleInAcademy) {
                    disabled.set(pos, "이미 소속원 역할이 있어 추가할 수 없습니다.");
                } else if (isAddingMember && hasStaffRoleInAcademy) {
                    disabled.set(pos, "이미 관리자 역할이 있어 추가할 수 없습니다.");
                } else if (pos === '학생' && academyRoles.has('학부모')) {
                    disabled.set(pos, "이미 학부모 역할이 있어 추가할 수 없습니다.");
                } else if (pos === '학부모' && academyRoles.has('학생')) {
                    disabled.set(pos, "이미 학생 역할이 있어 추가할 수 없습니다.");
                }
            } else if (needsAcademySelection) { // 학원 선택이 필요한데 아직 안 한 경우
                 disabled.set(pos, "학원을 먼저 선택해야 합니다.");
            }
        });

        return disabled;
    }, [myProfile, selectedAcademy, needsAcademySelection]);


    const handlePositionSelect = useCallback((position: PositionType) => {
        setSelectedPosition(position);
        // '원장'이나 학원 소속 역할이 아닌 경우, 학원 관련 상태를 초기화합니다.
        if (!['원장', '강사', '학생', '학부모'].includes(position)) {
            setAcademyName('');
            setSelectedCity('');
            setSelectedDistrict('');
            setSelectedAcademy(null);
        }
        setValidationErrors({});
        setApiErrorMessage('');
    }, []);

    const handleAcademySelect = useCallback((academy: Academy) => {
        setSelectedAcademy(academy);
        // 학원을 선택하면, 선택 가능한 역할을 다시 고르도록 유도합니다.
        setSelectedPosition('');
        setValidationErrors(prev => ({ ...prev, academy: undefined }));
        setApiErrorMessage('');
    }, []);

    const handleSave = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();
        setApiErrorMessage('');
        setValidationErrors({});

        if (!isFormComplete || !selectedPosition || addRoleMutation.isPending) {
            if (!selectedPosition) setValidationErrors(prev => ({...prev, position: "역할을 선택해주세요."}));
            if (needsAcademySelection && !selectedAcademy) setValidationErrors(prev => ({ ...prev, academy: "소속될 학원을 선택해주세요."}));
            return;
        }

        const payload: AddRolePayload = { role_name: selectedPosition };
        if (selectedPosition === '원장') {
            payload.academy_name = academyName;
            payload.region = `${selectedCity} ${selectedDistrict}`;
        }
        if (needsAcademySelection && selectedAcademy) {
            payload.academy_id = selectedAcademy.id;
        }

        addRoleMutation.mutate(payload, {
            onSuccess: () => onSuccess?.(),
            onError: (error) => setApiErrorMessage(error.message || '역할 추가에 실패했습니다.')
        });
    }, [isFormComplete, addRoleMutation, selectedPosition, academyName, selectedCity, selectedDistrict, selectedAcademy, needsAcademySelection, onSuccess]);

    return {
        academyNameInputRef, academySearchInputRef,
        selectedPosition, academyName, selectedCity, selectedDistrict, selectedAcademy,
        needsAcademySelection, validationErrors, apiErrorMessage, isFormComplete,
        isSubmitting: addRoleMutation.isPending,
        disabledRoles,
        setAcademyName, setSelectedCity, setSelectedDistrict, setSelectedAcademy,
        handlePositionSelect, handleAcademySelect, handleSave,
    };
};