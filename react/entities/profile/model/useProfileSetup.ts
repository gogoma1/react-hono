import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore, selectUser, selectIsLoadingAuth } from '../../../shared/store/authStore';
import { type PositionType } from './types';
import type { Academy } from '../../academy/model/types';

interface ProfileSetupPayload {
    name: string;
    phone?: string;
    role_name: PositionType;
    academy_name?: string;
    region?: string;
    academy_id?: string;
}

type ValidationErrors = {
    name?: string;
    phone?: string;
    academy?: string;
};

export const useProfileSetup = () => {
    const navigate = useNavigate();
    const isLoadingAuth = useAuthStore(selectIsLoadingAuth);
    const user = useAuthStore(selectUser);

    const containerRef = useRef<HTMLDivElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const academyNameInputRef = useRef<HTMLInputElement>(null);
    const academySearchInputRef = useRef<HTMLInputElement>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiErrorMessage, setApiErrorMessage] = useState('');

    const [step, setStep] = useState(1);
    const [editingField, setEditingField] = useState<'name' | 'phone' | 'academyName' | null>(null);

    const [selectedPosition, setSelectedPosition] = useState<PositionType | ''>('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('010-');

    const [academyName, setAcademyName] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    
    const [selectedAcademy, setSelectedAcademy] = useState<Academy | null>(null);
    
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (user) {
            setName(user.user_metadata?.name || '');
            setPhone(user.phone || '010-');
        }
    }, [isLoadingAuth, user]);
    
    const needsAcademySelection = useMemo(() => {
        return ['강사', '학생', '학부모'].includes(selectedPosition);
    }, [selectedPosition]);

    const isFormComplete = useMemo(() => {
        const phoneRegex = /^[0-9]{3}-[0-9]{3,4}-[0-9]{4}$/;
        if (!name.trim() || !selectedPosition || !phoneRegex.test(phone)) return false;

        if (selectedPosition === '원장') {
            return !!academyName.trim() && !!selectedCity && !!selectedDistrict;
        }
        
        if (needsAcademySelection) {
            return !!selectedAcademy;
        }
        
        return true;
    }, [name, phone, selectedPosition, academyName, selectedCity, selectedDistrict, selectedAcademy, needsAcademySelection]);

    const scrollToBottom = useCallback(() => {
        // --- [핵심 수정] ---
        // 지연 시간을 100ms에서 160ms로 늘립니다.
        // 이는 입력 필드에 포커스를 주는 시간(150ms)보다 약간 길게 설정하여
        // 새로운 UI가 완전히 렌더링되고 자리를 잡은 후에 스크롤이 실행되도록 보장합니다.
        setTimeout(() => {
            if (containerRef.current) {
                containerRef.current.scrollTo({
                    top: containerRef.current.scrollHeight,
                    behavior: 'smooth',
                });
            }
        }, 160);
    }, []);

    useEffect(() => {
        if (step > 1) {
            scrollToBottom();
        }
    }, [step, selectedPosition, selectedAcademy, selectedCity, selectedDistrict, scrollToBottom]);


    const handleNextStep = useCallback((nextStep: number) => {
        const newErrors: ValidationErrors = {};
        if (nextStep > 2 && !name.trim()) {
            newErrors.name = "이름을 입력해주세요";
            return;
        }
        
        const phoneRegex = /^[0-9]{3}-[0-9]{3,4}-[0-9]{4}$/;
        if (nextStep > 3 && !phoneRegex.test(phone)) {
            newErrors.phone = "올바른 전화번호를 입력해주세요";
            return;
        }

        setValidationErrors(newErrors);
        setStep(nextStep);
        setEditingField(null);
    }, [name, phone]);

    useEffect(() => {
        const focusTimeout = setTimeout(() => {
            if (step === 2) nameInputRef.current?.focus();
            if (step === 3) phoneInputRef.current?.focus();
            if (step === 4) {
                if (selectedPosition === '원장') {
                    academyNameInputRef.current?.focus();
                } else if (needsAcademySelection) {
                    academySearchInputRef.current?.focus();
                }
            }
        }, 150);

        return () => clearTimeout(focusTimeout);
    }, [step, selectedPosition, needsAcademySelection]);
    
    const handleFinishEditing = useCallback(() => {
        setEditingField(null);
    }, []);

    const handlePositionSelect = useCallback((position: PositionType) => {
        setSelectedPosition(position);
        setStep(2);
    }, []);

    const handleNameSubmit = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleNextStep(3);
        }
    }, [handleNextStep]);
    
    const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const numbers = e.target.value.replace(/[^0-9]/g, "");

        if (numbers.length <= 3) {
            setPhone(numbers);
        } else if (numbers.length <= 7) {
            const middle = numbers.slice(3);
            let formatted = `010-${middle}`;
            if (middle.length === 4) formatted += '-';
            setPhone(formatted);
        } else {
            const middle = numbers.slice(3, 7);
            const end = numbers.slice(7, 11);
            setPhone(`010-${middle}-${end}`);
        }
        setValidationErrors(prev => ({...prev, phone: undefined }));
    }, []);

    const handlePhoneSubmit = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleNextStep(4);
        }
    }, [handleNextStep]);

    const handleAcademySelect = useCallback((academy: Academy) => {
        setSelectedAcademy(academy);
        setValidationErrors(prev => ({ ...prev, academy: undefined }));
        setApiErrorMessage('');
    }, []);

    const handleReset = useCallback(() => {
        setStep(1);
        setEditingField(null);
        setSelectedPosition('');
        setName(user?.user_metadata?.name || '');
        setPhone(user?.phone || '010-');
        setAcademyName('');
        setSelectedCity('');
        setSelectedDistrict('');
        setSelectedAcademy(null);
        setApiErrorMessage('');
        setValidationErrors({});
    }, [user]);

    const handleSaveProfile = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();
        setApiErrorMessage('');

        const newErrors: ValidationErrors = {};
        if (!name.trim()) newErrors.name = '이름을 입력해주세요';
        const phoneRegex = /^[0-9]{3}-[0-9]{3,4}-[0-9]{4}$/;
        if (!phoneRegex.test(phone)) newErrors.phone = '올바른 전화번호를 입력해주세요';
        if (needsAcademySelection && !selectedAcademy) newErrors.academy = '소속될 학원을 선택해주세요';

        setValidationErrors(newErrors);

        if (Object.keys(newErrors).length > 0 || !isFormComplete || !user || !selectedPosition || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        const sanitizedPhone = phone.replace(/-/g, '');

        const payload: ProfileSetupPayload = {
            name,
            phone: sanitizedPhone,
            role_name: selectedPosition,
        };
        
        if (selectedPosition === '원장') {
            payload.academy_name = academyName;
            payload.region = `${selectedCity} ${selectedDistrict}`;
        }
        
        if (needsAcademySelection && selectedAcademy) {
            payload.academy_id = selectedAcademy.id;
        }
        
        try {
            const response = await fetch('/api/profiles/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            
            if (response.ok) {
                navigate('/dashboard', { replace: true });
            } else {
                const data = await response.json();
                const friendlyMessage = data.error === 'Enrollment not found' 
                    ? `선택하신 학원에 회원님의 전화번호(${phone})로 등록된 정보가 없습니다. 학원을 다시 선택하시거나, 담당 선생님께 문의하여 등록을 요청해주세요.`
                    : data.error || '프로필 저장에 실패했습니다. 관리자에게 문의하세요.';
                setApiErrorMessage(friendlyMessage);
            }
        } catch (error) {
            setApiErrorMessage('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    }, [isFormComplete, user, selectedPosition, isSubmitting, name, phone, academyName, selectedCity, selectedDistrict, selectedAcademy, navigate, needsAcademySelection]);
    
    return {
        containerRef, nameInputRef, phoneInputRef, academyNameInputRef, academySearchInputRef,
        isLoadingAuth, isSubmitting, step, editingField, selectedPosition, name, phone,
        academyName, selectedCity, selectedDistrict, selectedAcademy, apiErrorMessage,
        isFormComplete, validationErrors, needsAcademySelection,
        setEditingField, setName, setAcademyName, setSelectedCity, setSelectedDistrict,
        setSelectedAcademy, handlePositionSelect, handleAcademySelect, handleNameSubmit,
        handlePhoneChange, handlePhoneSubmit, handleReset, handleSaveProfile,
        handleNextStep, handleFinishEditing,
    };
};