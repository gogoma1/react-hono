// ./react/features/conditional-nav/ui/MobileExamsNavLink.tsx

import React from 'react';
import { NavLink } from 'react-router';
import Tippy from '@tippyjs/react';

import { useMyProfileQuery } from '../../../entities/profile/model/useProfileQuery';
import type { MenuItemData } from '../../../widgets/rootlayout/GlassSidebar';

interface MobileExamsNavLinkProps {
    item: MenuItemData;
    isCollapsed: boolean;
    onLinkClick: () => void;
}

const MobileExamsNavLink: React.FC<MobileExamsNavLinkProps> = ({ item, isCollapsed, onLinkClick }) => {
    // 1. 현재 로그인한 사용자의 프로필 정보를 가져옵니다.
    const { data: profile, isLoading, isError } = useMyProfileQuery();

    // 2. 프로필 정보를 바탕으로 동적 경로를 결정합니다.
    const path = React.useMemo(() => {
        // 로딩 중이거나 에러 발생 시, 또는 프로필 정보가 없으면 기본 경로로 설정합니다.
        if (isLoading || isError || !profile) {
            return '/published-exams';
        }
        // 역할 목록에 '학생'이 포함되어 있는지 확인합니다.
        const isStudent = profile.roles.some(role => role.name === '학생');
        // 학생이면 /mobile-exam, 아니면 /published-exams로 설정합니다.
        return isStudent ? '/mobile-exam' : '/published-exams';
    }, [profile, isLoading, isError]);
    
    const showFullText = !isCollapsed;
    const itemAriaLabel = `${item.name}${item.badge ? `, 알림 ${item.badge}개` : ''}`;

    // 로딩 중일 때 UI
    if (isLoading) {
        return (
             <li className={`${item.isSubItem ? 'sub-menu-item-li' : ''} ${isCollapsed ? 'li-collapsed' : ''}`}>
                 <Tippy content="로딩 중..." placement="right" theme="custom-glass" animation="perspective" delay={[350, 0]} disabled={showFullText}>
                     <div className="menu-item-link disabled-link" aria-label="경로 확인 중">
                         <span className="menu-icon-wrapper">{item.icon}</span>
                         {showFullText && <span className="menu-item-name">{item.name}</span>}
                     </div>
                 </Tippy>
             </li>
        );
    }
    
    // 3. 결정된 경로로 NavLink를 렌더링합니다. (기존 GlassSidebar의 렌더링 로직과 동일하게 구성)
    return (
        <li className={`${item.isSubItem ? 'sub-menu-item-li' : ''} ${isCollapsed ? 'li-collapsed' : ''}`}>
            <Tippy content={item.name} placement="right" theme="custom-glass" animation="perspective" delay={[350, 0]} disabled={showFullText}>
                <NavLink
                    to={path}
                    className={({ isActive }) => 
                        `menu-item-link ${isActive ? 'active' : ''} ${item.isSubItem ? 'sub-menu-item-link' : ''} ${isCollapsed ? 'link-collapsed' : ''}`
                    }
                    onClick={onLinkClick}
                    aria-label={itemAriaLabel}
                >
                    <span className="menu-icon-wrapper">{item.icon}</span>
                    {showFullText && <span className="menu-item-name">{item.name}</span>}
                    {showFullText && item.badge && (
                        <span className="notification-badge" aria-label={`알림 ${item.badge}개`}>{item.badge}</span>
                    )}
                </NavLink>
            </Tippy>
        </li>
    );
};

export default MobileExamsNavLink;