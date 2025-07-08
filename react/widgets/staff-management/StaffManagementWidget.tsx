import React from 'react';
import StaffRegistrationForm from '../../features/staff-registration/ui/StaffRegistrationForm';
import { useStaffData } from '../../entities/staff/model/useStaffData';
import './StaffManagementWidget.css';
import { LuLoader, LuUsers, LuUserCheck, LuUserX } from 'react-icons/lu';

interface StaffManagementWidgetProps {
    academyId: string;
    onSuccess?: () => void;
}

const StaffManagementWidget: React.FC<StaffManagementWidgetProps> = ({ academyId, onSuccess }) => {
    const { staffMembers, isLoadingStaff } = useStaffData(academyId);

    const getRoleDisplayName = (memberType: 'teacher' | 'staff') => {
        return memberType === 'teacher' ? '강사' : '직원';
    };

    return (
        <div className="staff-management-widget">
            <StaffRegistrationForm
                academyId={academyId}
                allStaffMembers={staffMembers}
                onSuccess={onSuccess}
            />

            <div className="registered-staff-list">
                <h4 className="list-title">
                    <LuUsers size={18} />
                    <span>등록된 강사/직원 목록 ({staffMembers.length})</span>
                </h4>
                {isLoadingStaff ? (
                    <div className="list-loading">
                        <LuLoader className="spinner-icon" />
                        <span>목록을 불러오는 중...</span>
                    </div>
                ) : (
                    <ul>
                        {staffMembers.map(member => (
                            <li key={member.id} className={`staff-item ${member.profile_id ? 'linked' : 'unlinked'}`}>
                                <span className="staff-role-badge">
                                    {getRoleDisplayName(member.member_type)}
                                </span>
                                <span className="staff-name">{member.details?.student_name}</span>
                                <span className="staff-subject">{member.details?.subject || ''}</span>
                                
                                <div className="staff-status-wrapper" title={member.profile_id ? '계정이 연결되었습니다.' : '아직 계정이 연결되지 않았습니다.'}>
                                    {member.profile_id ? 
                                        <LuUserCheck size={16} className="status-icon linked" /> : 
                                        <LuUserX size={16} className="status-icon unlinked" />
                                    }
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default StaffManagementWidget;