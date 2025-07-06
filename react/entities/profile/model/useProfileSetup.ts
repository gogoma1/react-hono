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
        setTimeout(() => {
            if (containerRef.current) {
                containerRef.current.scrollTo({
                    top: containerRef.current.scrollHeight,
                    behavior: 'smooth',
                });
            }
        }, 100);
    }, []);

    const handleNextStep = useCallback((nextStep: number) => {
        const newErrors: ValidationErrors = {};
        if (nextStep > 2 && !name.trim()) {
            newErrors.name = "이름을 입력해주세요";
        }
        
        const phoneRegex = /^[0-9]{3}-[0-9]{3,4}-[0-9]{4}$/;
        if (nextStep > 3 && !phoneRegex.test(phone)) {
            newErrors.phone = "올바른 전화번호를 입력해주세요";
        }

        setValidationErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        setStep(nextStep);
        setEditingField(null);
        scrollToBottom();
    }, [name, phone, scrollToBottom]);

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
        scrollToBottom();
    }, [scrollToBottom]);

    const handleNameSubmit = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleNextStep(3);
        }
    }, [handleNextStep]);
    
    // [핵심 최종 수정] 전화번호 하이픈 자동 입력 로직
    const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const numbers = e.target.value.replace(/[^0-9]/g, "");

        if (numbers.length <= 3) {
            setPhone(numbers);
        } else if (numbers.length <= 7) {
            const middle = numbers.slice(3);
            let formatted = `010-${middle}`;
            // 중간 4자리가 모두 입력되면 바로 하이픈 추가
            if (middle.length === 4) {
                formatted += '-';
            }
            setPhone(formatted);
        } else { // 8자리 이상 입력 시
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
        scrollToBottom();
    }, [scrollToBottom]);

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
        setApiErrorMessage('');

        const payload: ProfileSetupPayload = {
            name,
            phone,
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
                setApiErrorMessage(data.error || '프로필 저장에 실패했습니다. 관리자에게 문의하세요.');
            }
        } catch (error) {
            setApiErrorMessage('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    }, [isFormComplete, user, selectedPosition, isSubmitting, name, phone, academyName, selectedCity, selectedDistrict, selectedAcademy, navigate, needsAcademySelection]);

    useEffect(() => {
        if (selectedCity || selectedDistrict) {
            scrollToBottom();
        }
    }, [selectedCity, selectedDistrict, scrollToBottom]);
    
    return {
        // Ref
        containerRef,
        nameInputRef,
        phoneInputRef,
        academyNameInputRef,
        academySearchInputRef,
        // 상태
        isLoadingAuth,
        isSubmitting,
        step,
        editingField,
        selectedPosition,
        name,
        phone,
        academyName,
        selectedCity,
        selectedDistrict,
        selectedAcademy,
        apiErrorMessage,
        isFormComplete,
        validationErrors,
        needsAcademySelection,
        // 상태 설정 함수
        setEditingField,
        setName,
        setAcademyName,
        setSelectedCity,
        setSelectedDistrict,
        setSelectedAcademy,
        // 이벤트 핸들러
        handlePositionSelect,
        handleAcademySelect,
        handleNameSubmit,
        handlePhoneChange,
        handlePhoneSubmit,
        handleReset,
        handleSaveProfile,
        handleNextStep,
        handleFinishEditing,
    };
};