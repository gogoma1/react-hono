import { useState, useMemo, useEffect } from 'react';
import type { CreateStaffInput, StaffDetails, StaffMember } from '../../../entities/staff/model/types';
import { useStaffData } from '../../../entities/staff/model/useStaffData';

const getUniqueValuesFromDetails = (staffMembers: StaffMember[], key: keyof StaffDetails): string[] => {
    if (!staffMembers || staffMembers.length === 0) return [];
    
    const values = staffMembers
        .map(member => member.details?.[key])
        .filter((value): value is string => typeof value === 'string' && value.trim() !== '');
        
    return Array.from(new Set(values)).sort();
};

/**
 * 강사/직원 등록 폼의 상태와 제출 로직을 관리하는 훅.
 * @param academyId - 등록할 학원의 ID
 * @param allStaffMembers - 기존 직원 목록 (제안용)
 * @param onSuccess - 등록 성공 시 호출될 콜백 함수
 */
export function useStaffRegistration(academyId: string, allStaffMembers: StaffMember[], onSuccess?: () => void) {
    const { addStaff, addStaffStatus } = useStaffData(academyId);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [subject, setSubject] = useState('');

    const uniqueSubjects = useMemo(() => getUniqueValuesFromDetails(allStaffMembers, 'subject'), [allStaffMembers]);

    const resetForm = () => {
        setName('');
        setPhone('');
        setSubject('');
    };

    useEffect(() => {
        if (addStaffStatus.isSuccess) {
            resetForm();
            if (onSuccess) {
                onSuccess();
            }
        }
    }, [addStaffStatus.isSuccess, onSuccess]);

    /**
     * 제출 핸들러. 어떤 유형으로 등록할지 인자로 받습니다.
     * @param memberType - 'teacher' 또는 'staff'
     */
    const handleSubmit = async (memberType: 'teacher' | 'staff') => {
        if (!name.trim() || !phone.trim() || addStaffStatus.isPending) return;

        const newStaffData: CreateStaffInput = {
            academy_id: academyId,
            member_type: memberType,
            details: {
                student_name: name.trim(),
                student_phone: phone.trim().replace(/-/g, ''), // 하이픈 제거
                subject: subject.trim() || undefined,
            }
        };

        try {
            await addStaff(newStaffData);
        } catch (err) {
            console.error(`Failed to add ${memberType}:`, err);
        }
    };

    return {
        name, setName,
        phone, setPhone,
        subject, setSubject,
        uniqueSubjects,
        handleSubmit,
        addStaffStatus,
    };
}