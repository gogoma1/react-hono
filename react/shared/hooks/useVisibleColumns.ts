// ./react/shared/hooks/useVisibleColumns.ts
import { useMemo } from 'react';
import { useUIStore } from '../store/uiStore';
import { useColumnPermissions, COLUMN_CONFIG } from './useColumnPermissions';

/**
 * 권한과 사용자 설정을 조합하여
 * 각 컬럼의 최종 표시 여부를 결정하는 훅
 */
export function useVisibleColumns() {
  const { permittedColumnKeys } = useColumnPermissions();
  const { columnVisibility: userPreferences } = useUIStore();

  const finalVisibility = useMemo(() => {
    const visibilityMap: Record<string, boolean> = {};

    // 모든 정의된 컬럼에 대해 순회
    COLUMN_CONFIG.forEach(col => {
      const { key } = col;
      // 권한이 있는지 확인
      const hasPermission = permittedColumnKeys.includes(key);
      // 사용자 설정이 있는지 확인 (없으면 기본값 true)
      const userPrefersVisible = userPreferences[key] ?? true;
      // 최종 표시 여부 결정
      visibilityMap[key] = hasPermission && userPrefersVisible;
    });

    // 권한 설정에 포함되지 않는, 항상 보여야 하는 특수 컬럼들 추가
    visibilityMap['header_action_button'] = true;
    visibilityMap['student_name'] = true;
    visibilityMap['actions'] = true;

    return visibilityMap;

  }, [permittedColumnKeys, userPreferences]);

  return finalVisibility;
}