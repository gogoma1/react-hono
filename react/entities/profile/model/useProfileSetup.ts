import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore, selectUser, selectIsLoadingAuth } from '../../../shared/store/authStore';
import { type PositionType } from './types';

// [수정됨] API 페이로드 타입의 키를 snake_case로 변경합니다.
interface ProfileSetupPayload {
    name: string;
    phone?: string;
    role_name: PositionType;
    academy_name?: string;
    region?: string;
}

export const useProfileSetup = () => {
    const navigate = useNavigate();
    const isLoadingAuth = useAuthStore(selectIsLoadingAuth);
    const user = useAuthStore(selectUser);

    const containerRef = useRef<HTMLDivElement>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiErrorMessage, setApiErrorMessage] = useState('');

    const [step, setStep] = useState(1);
    const [editingField, setEditingField] = useState<'name' | 'phone' | null>(null);

    const [selectedPosition, setSelectedPosition] = useState<PositionType | ''>('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const [academyName, setAcademyName] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.user_metadata?.name || '');
            setPhone(user.phone || '');
        }
    }, [isLoadingAuth, user]);

    const isFormComplete = useMemo(() => {
        const phoneRegex = /^[0-9]{3}-[0-9]{3,4}-[0-9]{4}$/;
        if (!name.trim() || !selectedPosition || !phoneRegex.test(phone)) return false;

        if (selectedPosition === '원장') {
            return !!academyName.trim() && !!selectedCity && !!selectedDistrict;
        }
        
        return true;
    }, [name, phone, selectedPosition, academyName, selectedCity, selectedDistrict]);

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
        setStep(nextStep);
        setEditingField(null);
        scrollToBottom();
    }, [scrollToBottom]);

    const handlePositionSelect = useCallback((position: PositionType) => {
        setSelectedPosition(position);
        setStep(2);
        scrollToBottom();
    }, [scrollToBottom]);

    const handleNameSubmit = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && name.trim()) {
            e.preventDefault();
            handleNextStep(3);
        }
    }, [name, handleNextStep]);
    
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
        const phoneRegex = /^[0-9]{3}-[0-9]{3,4}-[0-9]{4}$/;
        if (e.key === 'Enter' && phoneRegex.test(phone)) {
            e.preventDefault();
            handleNextStep(4);
        }
    }, [phone, handleNextStep]);

    const handleReset = useCallback(() => {
        setStep(1);
        setEditingField(null);
        setSelectedPosition('');
        setName(user?.user_metadata?.name || '');
        setPhone(user?.phone || '');
        setAcademyName('');
        setSelectedCity('');
        setSelectedDistrict('');
        setApiErrorMessage('');
    }, [user]);

    const handleSaveProfile = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();
        if (!isFormComplete || !user || !selectedPosition || isSubmitting) return;

        setIsSubmitting(true);
        setApiErrorMessage('');

        // [수정됨] payload 객체의 키를 snake_case로 변경합니다.
        const payload: ProfileSetupPayload = {
            name,
            phone,
            role_name: selectedPosition,
        };
        
        if (selectedPosition === '원장') {
            payload.academy_name = academyName;
            payload.region = `${selectedCity} ${selectedDistrict}`;
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
    }, [isFormComplete, user, selectedPosition, isSubmitting, name, phone, academyName, selectedCity, selectedDistrict, navigate]);

    useEffect(() => {
        if (selectedCity || selectedDistrict) {
            scrollToBottom();
        }
    }, [selectedCity, selectedDistrict, scrollToBottom]);
    
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
        apiErrorMessage,
        isFormComplete,
        setName,
        setPhone,
        setAcademyName,
        setSelectedCity,
        setSelectedDistrict,
        handlePositionSelect,
        handleNameSubmit,
        handlePhoneChange,
        handlePhoneSubmit,
        handleReset,
        handleSaveProfile,
        handleNextStep,
    };
};