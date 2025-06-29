import { useMemo } from 'react';
import { useUIStore } from '../store/uiStore';
import { useColumnPermissions } from './useColumnPermissions';

/**
 * 권한과 사용자 설정을 조합하여
 * 각 컬럼의 최종 표시 여부를 결정하는 훅
 */
export function useVisibleColumns() {
  // [수정] 훅에서 필요한 모든 정보를 가져옵니다.
  const { permittedColumnKeys, allColumnConfig } = useColumnPermissions();
  const { columnVisibility: userPreferences } = useUIStore();

  const finalVisibility = useMemo(() => {
    const visibilityMap: Record<string, boolean> = {};

    // [수정] 정적 CONFIG 대신, 현재 페이지에 맞는 allColumnConfig를 순회합니다.
    allColumnConfig.forEach(col => {
      const { key } = col;
      const hasPermission = permittedColumnKeys.has(key);
      const userPrefersVisible = userPreferences[key] ?? !col.defaultHidden; // [수정] UI 상태가 없으면 defaultHidden을 기준으로 판단
      visibilityMap[key] = hasPermission && userPrefersVisible;
    });

    // 테이블의 기본/필수 컬럼은 항상 보이도록 설정
    visibilityMap['header_action_button'] = true;
    visibilityMap['student_name'] = true;
    visibilityMap['actions'] = true;
    visibilityMap['checkbox'] = true;
    visibilityMap['question_number'] = true;

    return visibilityMap;

  }, [permittedColumnKeys, allColumnConfig, userPreferences]);

  return finalVisibility;
}