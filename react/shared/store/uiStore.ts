import { create } from 'zustand';

const breakpoints = {
    mobile: 768, // 모바일 화면 너비 기준 (이하)
    tablet: 1024, // 태블릿 화면 너비 기준 (이하, 모바일 초과)
};

// 현재 뷰포트에 따른 브레이크포인트 타입을 정의합니다.
type Breakpoint = 'mobile' | 'tablet' | 'desktop';

// 현재 창 너비를 기반으로 브레이크포인트를 반환하는 함수입니다.
const getCurrentBreakpoint = (): Breakpoint => {
    if (typeof window === 'undefined') return 'desktop'; // SSR 또는 테스트 환경 기본값
    const width = window.innerWidth;
    if (width < breakpoints.mobile) return 'mobile';
    if (width < breakpoints.tablet) return 'tablet';
    return 'desktop';
};

// UI 상태 및 관련 액션을 정의하는 인터페이스입니다.
interface UIState {
    // 오른쪽 사이드바 (데스크탑/태블릿 확장 상태, 모바일에서는 열림 상태)
    isRightSidebarExpanded: boolean; // 데스크탑/태블릿에서 확장 여부
    toggleRightSidebar: () => void;   // 모든 뷰포트에서 오른쪽 사이드바 토글
    setRightSidebarExpanded: (expanded: boolean) => void; // 데스크탑/태블릿 확장 상태 직접 설정

    // 왼쪽 사이드바 (데스크탑/태블릿 확장 상태, 모바일에서는 열림 상태)
    isLeftSidebarExpanded: boolean; // 데스크탑/태블릿에서 확장 여부
    toggleLeftSidebar: () => void;    // 모든 뷰포트에서 왼쪽 사이드바 토글
    setLeftSidebarExpanded: (expanded: boolean) => void; // 데스크탑/태블릿 확장 상태 직접 설정

    // 모바일 뷰에서 현재 열린 사이드바의 종류를 관리합니다. ('left', 'right', 또는 null)
    mobileSidebarType: 'left' | 'right' | null;
    openMobileSidebar: (type: 'left' | 'right') => void; // 특정 모바일 사이드바 열기
    closeMobileSidebar: () => void;                     // 모든 모바일 사이드바 닫기

    // 현재 애플리케이션의 브레이크포인트 상태입니다.
    currentBreakpoint: Breakpoint;
    updateBreakpoint: () => void; // 윈도우 리사이즈 시 브레이크포인트 업데이트
}

// Zustand 스토어를 생성합니다.
export const useUIStore = create<UIState>((set, get) => ({
    // --- 오른쪽 사이드바 상태 및 액션 ---
    isRightSidebarExpanded: false, // 기본적으로 데스크탑/태블릿에서 오른쪽 사이드바는 축소 상태
    toggleRightSidebar: () => {
        const currentBp = get().currentBreakpoint;
        if (currentBp === 'mobile') {
            // 모바일에서는 mobileSidebarType을 통해 오른쪽 사이드바 열림/닫힘 제어
            if (get().mobileSidebarType === 'right') {
                get().closeMobileSidebar();
            } else {
                get().openMobileSidebar('right');
            }
        } else {
            // 데스크탑/태블릿에서는 isRightSidebarExpanded 상태를 직접 토글
            set((state) => ({ isRightSidebarExpanded: !state.isRightSidebarExpanded }));
        }
    },
    setRightSidebarExpanded: (expanded) => set({ isRightSidebarExpanded: expanded }),

    // --- 왼쪽 사이드바 상태 및 액션 ---
    isLeftSidebarExpanded: true, // 기본적으로 데스크탑에서 왼쪽 사이드바는 확장 상태
    toggleLeftSidebar: () => {
        const currentBp = get().currentBreakpoint;
        if (currentBp === 'mobile') {
            // 모바일에서는 mobileSidebarType을 통해 왼쪽 사이드바 열림/닫힘 제어
            if (get().mobileSidebarType === 'left') {
                get().closeMobileSidebar();
            } else {
                get().openMobileSidebar('left');
            }
        } else {
            // 데스크탑/태블릿에서는 isLeftSidebarExpanded 상태를 직접 토글
            set((state) => ({ isLeftSidebarExpanded: !state.isLeftSidebarExpanded }));
        }
    },
    setLeftSidebarExpanded: (expanded) => set({ isLeftSidebarExpanded: expanded }),

    // --- 모바일 사이드바 상태 및 액션 ---
    mobileSidebarType: null, // 초기에는 모바일 사이드바가 열려있지 않음
    openMobileSidebar: (type) => {
        // 특정 타입의 모바일 사이드바를 열도록 상태 업데이트
        set({ mobileSidebarType: type });
        // (선택적) 모바일 사이드바가 열릴 때 다른 데스크탑/태블릿 사이드바 상태 조정 로직 추가 가능
        // 예: if (get().isRightSidebarExpanded) get().setRightSidebarExpanded(false);
    },
    closeMobileSidebar: () => set({ mobileSidebarType: null }), // 모든 모바일 사이드바 닫기

    // --- 브레이크포인트 상태 및 액션 ---
    currentBreakpoint: getCurrentBreakpoint(), // 초기 브레이크포인트 설정
    updateBreakpoint: () => {
        const newBreakpoint = getCurrentBreakpoint();
        const oldBreakpoint = get().currentBreakpoint;
        if (newBreakpoint !== oldBreakpoint) {
            set({ currentBreakpoint: newBreakpoint });
            get().closeMobileSidebar(); // 브레이크포인트 변경 시 모든 모바일 사이드바 닫기

            // 브레이크포인트 변경에 따른 사이드바 기본 상태 조정
            if (newBreakpoint === 'desktop') {
                get().setLeftSidebarExpanded(true); // 데스크탑에서는 왼쪽 사이드바 자동 확장
            } else if (newBreakpoint === 'tablet') {
                get().setLeftSidebarExpanded(false); // 태블릿에서는 왼쪽 사이드바 자동 축소 (아이콘만)
            }
            // 모바일 뷰에서는 mobileSidebarType으로 사용자가 직접 제어
        }
    },
}));

// --- 스토어 초기화 및 이벤트 리스너 등록 ---
// 클라이언트 사이드에서만 실행되도록 window 객체 존재 여부 확인
if (typeof window !== 'undefined') {
    const { updateBreakpoint, setLeftSidebarExpanded, currentBreakpoint } = useUIStore.getState();

    // 윈도우 리사이즈 이벤트에 updateBreakpoint 함수 연결
    window.addEventListener('resize', updateBreakpoint);

    // 앱 초기 로드 시 현재 브레이크포인트에 따라 왼쪽 사이드바 상태 설정
    const initialBp = currentBreakpoint;
    if (initialBp === 'desktop') {
        setLeftSidebarExpanded(true);
    } else { // tablet 또는 mobile
        setLeftSidebarExpanded(false);
    }
    // 초기 브레이크포인트 업데이트 강제 실행 (최신 상태 보장)
    // updateBreakpoint(); // Zustand v4에서는 스토어 외부에서 getState().action() 호출 권장
    useUIStore.getState().updateBreakpoint();
}