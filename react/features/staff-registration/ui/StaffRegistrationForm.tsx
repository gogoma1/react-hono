import React from 'react';
import { useStaffRegistration } from '../model/useStaffRegistration';
import type { StaffMember } from '../../../entities/staff/model/types';
import CategoryInput from '../../student-registration/ui/CategoryInput';
import '../../student-registration/ui/StudentRegistrationForm.css'; // 학생 등록 폼 스타일 재활용
import { LuUserPlus, LuUserCog } from 'react-icons/lu';
import LoadingButton from '../../../shared/ui/loadingbutton/LoadingButton';

interface StaffRegistrationFormProps {
    onSuccess?: () => void;
    academyId: string;
    allStaffMembers: StaffMember[];
}

const StaffRegistrationForm: React.FC<StaffRegistrationFormProps> = ({ onSuccess, academyId, allStaffMembers }) => {
    const {
        name, setName,
        phone, setPhone,
        subject, setSubject,
        uniqueSubjects,
        handleSubmit,
        addStaffStatus
    } = useStaffRegistration(academyId, allStaffMembers, onSuccess);
    
    const isFormValid = name.trim() !== '' && phone.trim() !== '';

    return (
        <div className="student-registration-container">
            <h4 className="registration-form-title">
                강사 | 직원 등록
            </h4>
            
            <p className="registration-form-description">
                등록된 구성원은 본인 계정으로 로그인 후 학원에 연결할 수 있습니다.
            </p>

            <form onSubmit={(e) => e.preventDefault()} className="registration-form" noValidate>
                {/* --- 버튼 상단 배치 --- */}
                <div className="form-actions top">
                    <LoadingButton
                        type="button"
                        onClick={() => handleSubmit('teacher')}
                        className="primary"
                        isLoading={addStaffStatus.isPending}
                        disabled={!isFormValid || addStaffStatus.isPending}
                        loadingText="등록중..."
                    >
                        <LuUserPlus size={16} />
                        강사로 추가
                    </LoadingButton>
                    <LoadingButton
                        type="button"
                        onClick={() => handleSubmit('staff')}
                        className="secondary"
                        isLoading={addStaffStatus.isPending}
                        disabled={!isFormValid || addStaffStatus.isPending}
                        loadingText="등록중..."
                    >
                        <LuUserCog size={16} />
                        실장/직원으로 추가
                    </LoadingButton>
                </div>
                
                {addStaffStatus.isError && (
                    <p className="form-error-message top-error">등록 실패: {addStaffStatus.error?.message}</p>
                )}

                <div className="form-divider" />

                <div className="form-group">
                    <label htmlFor="staff-name" className="form-label">이름 *</label>
                    <input id="staff-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="form-input" placeholder="강사/직원 이름을 입력하세요"/>
                </div>
                <div className="form-group">
                    <label htmlFor="staff-phone" className="form-label">연락처 *</label>
                    <input id="staff-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="form-input" placeholder="010-1234-5678"/>
                </div>
                <CategoryInput 
                    label="담당 과목" 
                    value={subject} 
                    onChange={setSubject} 
                    suggestions={uniqueSubjects} 
                    placeholder="직접 입력 (예: 수학, 영어)"
                />
            </form>
        </div>
    );
};

export default StaffRegistrationForm;