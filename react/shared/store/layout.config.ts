/**
 * 각 페이지별로 우측 사이드바에 표시될 버튼의 종류를 정의합니다.
 */
export type SidebarButtonType = 
    'register' 
    | 'teacherRegister' 
    | 'settings' 
    | 'prompt' 
    | 'latexHelp' 
    | 'search' 
    | 'jsonView' 
    | 'selectedStudents' 
    | 'myLibrary'; // [신규] '내 서재' 버튼 타입 추가

/**
 * 각 페이지의 레이아웃 설정을 정의하는 인터페이스입니다.
 */
export interface PageLayoutConfig {
  sidebarButtons?: {
    [key in SidebarButtonType]?: {
      tooltip: string; // 버튼에 표시될 툴팁 텍스트
    };
  };
}

/**
 * 경로(path)를 키로, 해당 경로의 레이아웃 설정을 값으로 갖는 맵(map)입니다.
 * 이 파일이 "어떤 페이지에 어떤 사이드바 버튼이 필요한가"에 대한 유일한 정보 소스(Single Source of Truth)가 됩니다.
 */
export const layoutConfigMap: Record<string, PageLayoutConfig> = {
  '/dashboard': {
    sidebarButtons: {
      register: { tooltip: '신입생 등록' },
      teacherRegister: { tooltip: '강사/직원 등록' },
      settings: { tooltip: '테이블 설정' },
    },
  },
  '/problem-workbench': {
    sidebarButtons: {
      prompt: { tooltip: '프롬프트 모음' },
      latexHelp: { tooltip: 'LaTeX 문법 도움말' },
      settings: { tooltip: '문제 작업 설정' },
    },
  },
  '/json-renderer': { // 이 경로는 현재 사용되지 않지만 예시로 남겨둡니다.
    sidebarButtons: {
      prompt: { tooltip: '프롬프트 모음' },
      settings: { tooltip: 'JSON 렌더러 설정' },
    },
  },
  '/problem-publishing': {
    sidebarButtons: {
      search: { tooltip: '문제 검색 및 필터' },
      myLibrary: { tooltip: '내 서재 (문제집 관리)' }, // [신규] '내 서재' 버튼 설정 추가
      selectedStudents: { tooltip: '선택된 학생' },
      jsonView: { tooltip: 'JSON으로 변환' },
      prompt: { tooltip: '프롬프트 모음' },
      settings: { tooltip: '테이블 컬럼 설정' },
      latexHelp: { tooltip: 'LaTeX 문법 도움말' }
    }
  },
  '/mobile-exam': {
    sidebarButtons: {
        settings: { tooltip: '시험 설정 및 결과' },
    }
  }
};