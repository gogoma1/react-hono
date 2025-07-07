import { useState, useMemo, useCallback, useRef } from 'react';
import type { PositionType } from '../../../entities/profile/model/types';
import type { Academy } from '../../../entities/academy/model/types';
import { useAddRoleMutation } from '../../../entities/profile/model/useProfileQuery';
import type { AddRolePayload } from '../../../entities/profile/model/types';

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
        return true; // '과외 선생님' 등
    }, [selectedPosition, academyName, selectedCity, selectedDistrict, selectedAcademy, needsAcademySelection]);

    const handlePositionSelect = useCallback((position: PositionType) => {
        setSelectedPosition(position);
        // 역할이 바뀌면 하위 선택사항 초기화
        setAcademyName('');
        setSelectedCity('');
        setSelectedDistrict('');
        setSelectedAcademy(null);
        setValidationErrors({});
        setApiErrorMessage('');
    }, []);

    const handleAcademySelect = useCallback((academy: Academy) => {
        setSelectedAcademy(academy);
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

        const payload: AddRolePayload = {
            role_name: selectedPosition,
        };
        
        if (selectedPosition === '원장') {
            payload.academy_name = academyName;
            payload.region = `${selectedCity} ${selectedDistrict}`;
        }
        
        if (needsAcademySelection && selectedAcademy) {
            payload.academy_id = selectedAcademy.id;
        }

        addRoleMutation.mutate(payload, {
            onSuccess: () => {
                onSuccess?.();
            },
            onError: (error) => {
                const friendlyMessage = error.message.includes('Enrollment not found') 
                    ? `선택하신 학원에 회원님의 전화번호로 등록된 정보가 없습니다. 학원을 다시 선택하시거나, 담당 선생님께 문의하여 등록을 요청해주세요.`
                    : error.message || '역할 추가에 실패했습니다.';
                setApiErrorMessage(friendlyMessage);
            }
        });

    }, [isFormComplete, addRoleMutation, selectedPosition, academyName, selectedCity, selectedDistrict, selectedAcademy, needsAcademySelection, onSuccess]);

    return {
        // Refs
        academyNameInputRef,
        academySearchInputRef,
        // State
        selectedPosition,
        academyName,
        selectedCity,
        selectedDistrict,
        selectedAcademy,
        needsAcademySelection,
        validationErrors,
        apiErrorMessage,
        isFormComplete,
        isSubmitting: addRoleMutation.isPending,
        // Setters & Handlers
        setAcademyName,
        setSelectedCity,
        setSelectedDistrict,
        setSelectedAcademy,
        handlePositionSelect,
        handleAcademySelect,
        handleSave,
    };
};