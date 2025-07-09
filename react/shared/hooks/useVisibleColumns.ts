import { useMemo } from 'react';
import { useColumnSettingsStore } from '../store/columnSettingsStore';
import { useColumnPermissions } from './useColumnPermissions';

// [수정] PermittedColumnKey 타입을 useColumnPermissions에서 가져오도록 변경하거나,
// 여기에 직접 정의할 수 있습니다. 여기서는 더 넓은 타입으로 처리합니다.
import { ROLE_PERMISSIONS } from './useColumnPermissions';

// 모든 가능한 컬럼 키의 유니온 타입을 만듭니다.
type AllColumnKeys = typeof ROLE_PERMISSIONS['원장'][number];

export function useVisibleColumns(
  columnConfig: readonly { key: string; label: string; defaultHidden: boolean; }[]
) {
  const { permittedColumnKeys } = useColumnPermissions();
  const { visibility: userPreferences } = useColumnSettingsStore();

  const finalVisibility = useMemo(() => {
    const visibilityMap: Record<string, boolean> = {};

    columnConfig.forEach(col => {
      const { key, defaultHidden } = col;

      // [핵심 수정] key의 타입을 AllColumnKeys로 단언(assert)합니다.
      // "개발자인 내가 보장하는데, 이 key는 허용된 키 목록 중 하나야" 라고 컴파일러에게 알려줍니다.
      const hasPermission = permittedColumnKeys.has(key as AllColumnKeys);
      
      const userPrefersVisible = userPreferences[key] ?? !defaultHidden;
      visibilityMap[key] = hasPermission && userPrefersVisible;
    });

    // 테이블의 기본 액션 컬럼들은 항상 보이도록 설정합니다.
    visibilityMap['header_action_button'] = true;
    visibilityMap['student_name'] = true;
    visibilityMap['actions'] = true;
    visibilityMap['checkbox'] = true;
    visibilityMap['question_number'] = true;

    return visibilityMap;

  }, [permittedColumnKeys, columnConfig, userPreferences]);

  return finalVisibility;
}