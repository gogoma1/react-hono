// ./react/shared/hooks/useColumnPermissions.ts
import { useMemo } from 'react';
// import { useAuthStore } from '../store/authStore'; // 나중에 실제 역할(role)을 가져오기 위해 주석 처리

// 모든 컬럼의 중앙 정의 (Source of Truth)
export const COLUMN_CONFIG = [
  { key: 'grade', label: '학년' },
  { key: 'subject', label: '과목' },
  { key: 'status', label: '상태' },
  { key: 'teacher', label: '담당 강사' },
  { key: 'student_phone', label: '학생 연락처' },
  { key: 'guardian_phone', label: '학부모 연락처' },
  { key: 'school_name', label: '학교명' },
  { key: 'tuition', label: '수강료' },
  { key: 'admission_date', label: '입원일' },
  { key: 'discharge_date', label: '퇴원일' },
] as const; // as const로 key 값을 string이 아닌 리터럴 타입으로 추론

// 역할별 허용된 컬럼 키 목록
const ROLE_PERMISSIONS = {
  // 원장은 모든 정보를 볼 수 있음
  '원장': COLUMN_CONFIG.map(c => c.key),
  // 강사는 '수강료'와 '학부모 연락처'를 볼 수 없음 (예시)
  '강사': [
    'grade', 'subject', 'status', 'teacher', 'student_phone',
    'school_name', 'admission_date', 'discharge_date'
  ],
  // 다른 역할 추가 가능
} as const;

type Role = keyof typeof ROLE_PERMISSIONS;

export function useColumnPermissions() {
  // const userRole = useAuthStore(state => state.user?.role); // 나중에 실제 사용자 역할 가져오기
  const currentUserRole: Role = '원장'; // 지금은 '원장'으로 하드코딩, '강사'로 바꿔서 테스트해보세요.

  const permittedColumnKeys = useMemo(() => {
    return ROLE_PERMISSIONS[currentUserRole] || [];
  }, [currentUserRole]);

  // 토글 UI에 필요한 설정 정보 (key, label)
  const permittedColumnsConfig = useMemo(() => {
    return COLUMN_CONFIG.filter(col => permittedColumnKeys.includes(col.key));
  }, [permittedColumnKeys]);

  return { 
    permittedColumnKeys,      // 허용된 컬럼 키 배열
    permittedColumnsConfig,   // 허용된 컬럼의 설정 객체 배열 (UI용)
    allColumnConfig: COLUMN_CONFIG, // 테이블 정의에 필요한 전체 설정
  };
}