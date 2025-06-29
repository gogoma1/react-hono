import { useMemo } from 'react';
import { useLocation } from 'react-router';

// [수정] 요청하신 순서대로 컬럼 설정 변경
export const PROBLEM_PUBLISHING_COLUMN_CONFIG = [
  { key: 'problem_category', label: '유형', defaultHidden: false },
  { key: 'difficulty', label: '난이도', defaultHidden: false },
  { key: 'major_chapter_id', label: '대단원', defaultHidden: false },
  { key: 'middle_chapter_id', label: '중단원', defaultHidden: false },
  { key: 'core_concept_id', label: '핵심개념', defaultHidden: false },
  { key: 'source', label: '출처', defaultHidden: true },
  { key: 'grade', label: '학년', defaultHidden: true },
  { key: 'semester', label: '학기', defaultHidden: true },
  { key: 'score', label: '배점', defaultHidden: false },
  { key: 'page', label: '페이지', defaultHidden: false },
  { key: 'problem_type', label: '객/주', defaultHidden: false },
  { key: 'answer', label: '정답', defaultHidden: false },
  { key: 'question_text', label: '문제', defaultHidden: true },
  { key: 'solution_text', label: '해설', defaultHidden: true },
] as const;

export const STUDENT_DASHBOARD_COLUMN_CONFIG = [
  { key: 'grade', label: '학년', defaultHidden: false },
  { key: 'subject', label: '과목', defaultHidden: false },
  { key: 'status', label: '상태', defaultHidden: false },
  { key: 'teacher', label: '담당 강사', defaultHidden: false },
  { key: 'student_phone', label: '학생 연락처', defaultHidden: false },
  { key: 'guardian_phone', label: '학부모 연락처', defaultHidden: false },
  { key: 'school_name', label: '학교명', defaultHidden: false },
  { key: 'tuition', label: '수강료', defaultHidden: false },
  { key: 'admission_date', label: '입원일', defaultHidden: false },
  { key: 'discharge_date', label: '퇴원일', defaultHidden: false },
] as const;

const ROLE_PERMISSIONS = {
  '원장': [...STUDENT_DASHBOARD_COLUMN_CONFIG.map(c => c.key), ...PROBLEM_PUBLISHING_COLUMN_CONFIG.map(c => c.key)],
  '강사': [
    'grade', 'subject', 'status', 'teacher', 'student_phone',
    'school_name', 'admission_date', 'discharge_date',
    ...PROBLEM_PUBLISHING_COLUMN_CONFIG.filter(c => !c.key.includes('text')).map(c => c.key),
  ],
} as const;

type Role = keyof typeof ROLE_PERMISSIONS;

export function useColumnPermissions() {
  const currentUserRole: Role = '원장';
  const location = useLocation();
  const currentPath = location.pathname;

  const { permittedColumnsConfig, allColumnConfig } = useMemo(() => {
    const roleAllowedKeys = ROLE_PERMISSIONS[currentUserRole] || [];
    
    let baseConfig;
    if (currentPath.startsWith('/problem-publishing')) {
      baseConfig = PROBLEM_PUBLISHING_COLUMN_CONFIG;
    } else { 
      baseConfig = STUDENT_DASHBOARD_COLUMN_CONFIG;
    }
    
    const permittedConfig = baseConfig.filter(col => roleAllowedKeys.includes(col.key));

    return { 
      permittedColumnsConfig: permittedConfig,
      allColumnConfig: baseConfig
    };
  }, [currentUserRole, currentPath]);

  const permittedColumnKeys = useMemo(() => 
      new Set(permittedColumnsConfig.map(c => c.key)),
      [permittedColumnsConfig]
  );

  return { 
    permittedColumnsConfig,
    allColumnConfig,
    permittedColumnKeys,
  };
}