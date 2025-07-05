import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { useAuthStore, selectUser, selectIsLoadingAuth } from '../../../shared/store/authStore';
import type { Academy } from '../../academy/model/types';
import { type PositionType, profileFormSchema, type ProfileFormSchema } from './types';

export const useProfileSetup = () => {
    const navigate = useNavigate();
    const isLoadingAuth = useAuthStore(selectIsLoadingAuth);
    const user = useAuthStore(selectUser);
    
    const containerRef = useRef<HTMLDivElement>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [step, setStep] = useState(1);
    const [editingField, setEditingField] = useState<'name' | 'phone' | null>(null); // [수정] 수정 모드 상태

    const [selectedPosition, setSelectedPosition] = useState<PositionType | ''>('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    
    const [academyName, setAcademyName] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [region, setRegion] = useState('');

    const [formErrors, setFormErrors] = useState<z.ZodFormattedError<ProfileFormSchema> | null>(null);
    const [apiErrorMessage, setApiErrorMessage] = useState('');

    useEffect(() => {
       if (user) {
           setName(user.user_metadata?.name || '');
           setPhone(user.phone || ''); 
       }
    }, [isLoadingAuth, user]);
    
    const isFormComplete = useMemo(() => {
        if (!name.trim() || !selectedPosition || !phone.trim()) return false;
        
        const phoneRegex = /^[0-9]{3}-[0-9]{3,4}-[0-9]{4}$/;
        if(!phoneRegex.test(phone)) return false;

        if (['학생', '강사'].includes(selectedPosition)) {
            return !!academyName && !!region;
        } else {
            return !!academyName && !!selectedCity && !!selectedDistrict;
        }
    }, [name, phone, selectedPosition, academyName, region, selectedCity, selectedDistrict]);

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

    const handlePositionSelect = (position: PositionType) => {
        setSelectedPosition(position);
        setStep(2);
    };

    const handleNextStep = (nextStep: number) => {
        setStep(nextStep);
        setEditingField(null); // 다음 단계로 넘어가면 수정 모드 해제
        scrollToBottom();
    };
    
    const handleNameSubmit = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && name.trim()) {
            e.preventDefault();
            handleNextStep(3);
        }
    }, [name]);
    
    const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numbers = value.replace(/[^0-9]/g, "");
        let formatted = "";

        if (numbers.length < 4) {
            formatted = numbers;
        } else if (numbers.length < 8) {
            formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        } else {
            formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
        }
        setPhone(formatted);
    }, []);

    const handlePhoneSubmit = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && phone.trim()) {
            e.preventDefault();
            handleNextStep(4);
        }
    }, [phone]);

    const handleAcademySelect = (academy: Academy) => {
        setAcademyName(academy.academyName);
        setRegion(academy.region);
    };

    const handleReset = () => {
        setStep(1);
        setEditingField(null);
        setSelectedPosition('');
        setName(user?.user_metadata?.name || '');
        setPhone(user?.phone || '');
        setAcademyName('');
        setSelectedCity('');
        setSelectedDistrict('');
        setRegion('');
        setFormErrors(null);
        setApiErrorMessage('');
    };

    useEffect(() => {
        if (selectedCity || selectedDistrict) {
            scrollToBottom();
        }
    }, [selectedCity, selectedDistrict, scrollToBottom]);

    const handleSaveProfile = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!isFormComplete || !user || isSubmitting) return;
        
        const isSearchingRole = ['학생', '강사'].includes(selectedPosition || '');
        const finalRegion = isSearchingRole ? region : `${selectedCity} ${selectedDistrict}`;

        const validationResult = profileFormSchema.safeParse({ name, phone, position: selectedPosition, academyName, region: finalRegion });

        if (!validationResult.success) {
            setFormErrors(validationResult.error.format());
            scrollToBottom();
            return;
        }
        
        setFormErrors(null);
        setIsSubmitting(true);
        setApiErrorMessage('');

        try {
            const response = await fetch('/api/profiles/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validationResult.data),
            });
            
            if (response.ok) {
                navigate('/', { replace: true });
            } else {
                const data = await response.json();
                setApiErrorMessage(data.error || '프로필 저장에 실패했습니다.');
            }
        } catch (error) {
            setApiErrorMessage('네트워크 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return {
        containerRef,
        isLoadingAuth,
        isSubmitting,
        step,
        editingField,
        setEditingField,
        selectedPosition,
        name,
        phone,
        academyName,
        selectedCity,
        selectedDistrict,
        region,
        formErrors,
        apiErrorMessage,
        isFormComplete,
        setName,
        setAcademyName,
        setSelectedCity,
        setSelectedDistrict,
        setRegion,
        handlePositionSelect,
        handleNameSubmit,
        handlePhoneChange,
        handlePhoneSubmit,
        handleAcademySelect,
        handleReset,
        handleSaveProfile,
        handleNextStep,
    };
};