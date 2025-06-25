----- ./react/App.css -----
/* client/src/App.css */

/* ==========================================================================
   1. 기본 레이아웃 (App Container, Wrappers)
   ========================================================================== */

.app-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.background-blobs-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.layout-main-wrapper {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
  padding-top: var(--navbar-height);
}

.content-body-wrapper {
  display: flex;
  flex-grow: 1;
  overflow: hidden;
  position: relative;
}

.main-content {
  flex-grow: 1;
  background-color: var(--main-content-bg-color);
  padding: 25px;
  padding-bottom: 25px; /* 검색바를 위한 하단 여백 확보 */
  overflow-y: auto;
  position: relative;
  z-index: 5;
  height: 100%;
  box-sizing: border-box;
  border-top-left-radius: var(--main-content-border-radius);
  border-top-right-radius: var(--main-content-border-radius);
  box-shadow:
    inset 0px 6px 12px -6px rgba(0, 0, 0, 0.07),
    inset 5px 0px 10px -5px rgba(0, 0, 0, 0.05),
    inset -5px 0px 10px -5px rgba(0, 0, 0, 0.045);
  scrollbar-gutter: stable;
}


/* ==========================================================================
   2. 오버레이 및 하단 콘텐츠 영역 (Overlay & Bottom Content Area)
   ========================================================================== */

.clickable-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 105;
  background-color: rgba(var(--mobile-overlay-bg-rgb), var(--mobile-overlay-bg-opacity));
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease-in-out, visibility 0s 0.3s linear;
  cursor: pointer;
  backdrop-filter: blur(var(--mobile-overlay-blur)) saturate(100%);
  -webkit-backdrop-filter: blur(var(--mobile-overlay-blur)) saturate(100%);
}

/* RootLayout의 .app-container에 mobile-sidebar-active 클래스가 추가될 때 활성화 */
.app-container.mobile-sidebar-active .clickable-overlay {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.3s ease-in-out, visibility 0s 0s linear;
}

.bottom-content-area {
  position: fixed;
  bottom: 0;
  z-index: 95;
  pointer-events: none;
  transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}




/* ==========================================================================
   3. 반응형 레이아웃 (Responsive Layout)
   ========================================================================== */

/* 태블릿 (Tablet) */
@media (max-width: 1024px) and (min-width: 769px) {
  .main-content {
    padding: 20px;
    padding-bottom: 20px;
    border-top-left-radius: calc(var(--main-content-border-radius) - 3px);
    border-top-right-radius: calc(var(--main-content-border-radius) - 3px);
  }
}

/* 모바일 (Mobile) */
@media (max-width: 768px) {
  .app-container {
    overflow-x: hidden;
  }

  .main-content {
    padding: 15px;
    padding-bottom: 15px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    box-shadow: none;
  }

  /* 모바일에서 검색바는 항상 전체 너비 */
  .bottom-content-area {
    left: 0 !important; /* !important로 데스크탑 스타일 덮어쓰기 보장 */
    width: 100% !important;
  }
  
  /* 모바일 사이드바 공통 스타일 */
  .mobile-sidebar {
    position: fixed !important;
    top: 0;
    height: 100vh !important;
    z-index: 110;
    box-shadow: 0 8px 35px rgba(0, 0, 0, 0.28);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.12) transparent;

    opacity: 0;
    pointer-events: none;
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .mobile-sidebar.left-mobile-sidebar {
    left: 0;
    transform: translateX(-100%);
  }

  .mobile-sidebar.right-mobile-sidebar {
    left: auto;
    right: 0;
    transform: translateX(100%);
  }

  .mobile-sidebar.open {
    transform: translateX(0);
    opacity: 1;
    pointer-events: auto;
  }
}
----- ./react/entities/exam/ui/ExamPage.css -----
/* react/entities/exam/ui/ExamPage.css */

/* ==========================================================================
   1. 시험지 페이지 기본 레이아웃 (ExamPage)
   ========================================================================== */
.exam-page-component {
    position: relative;
    margin: 0 auto;
    box-sizing: border-box;
    aspect-ratio: 210 / 297;
    height: 1123px;
    width: 794px;
    overflow: hidden;
    border: 2px solid black;
    background-color: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.exam-paper {
    position: relative;
    box-sizing: border-box;
    display: flex;
    height: 100%;
    width: 100%;
    flex-direction: column;
    padding: 1.8em;
    color: #374151;
}

/* ==========================================================================
   2. 시험지 헤더 레이아웃 (ExamHeader)
   ========================================================================== */

/* --- 공통 및 1페이지 헤더 --- */
.exam-header-container, .exam-header-simplified-container { flex-shrink: 0; }
.exam-header-title-section { position: relative; margin-bottom: 1.8em; display: flex; align-items: center; justify-content: center; }
.exam-header-page-number { position: absolute; right: 0; top: 50%; transform: translateY(-50%); padding: 0.45em 0.9em; font-size: 3em; font-weight: 700; }
.exam-header-info-section { margin-bottom: 1.4em; display: flex; align-items: center; gap: 1.4em; }
.exam-header-subject-wrapper { display: flex; flex-grow: 1; align-items: center; gap: 1.4em; }
.exam-header-subject-wrapper-inner { flex-grow: 1; }
.exam-header-additional-box { box-sizing: border-box; display: flex; min-height: 3.6em; width: 11em; flex-shrink: 0; align-items: center; justify-content: center; border: 0.1em solid transparent; padding: 0.4em; text-align: center; font-size: 1em; }
.exam-header-divider-container { margin-bottom: 1.4em; width: 100%; flex-shrink: 0; }
.exam-header-divider { height: 0.1em; min-height: 1px; width: 100%; background-color: black; }

/* --- 2페이지 이상 헤더 --- */
.exam-header-simplified-container { margin-bottom: 1.4em; display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 0.1em solid black; padding-bottom: 0.5em; padding-top: 0.25em; font-size: 1em; }
.simplified-item-wrapper { display: flex; width: 6rem; flex-shrink: 0; align-items: flex-end; justify-content: center; }
.simplified-subject-wrapper { order: 2; margin-bottom: 0.25em; display: flex; flex-grow: 1; align-items: flex-end; justify-content: center; padding: 0 1rem; text-align: center; }
.simplified-page-number { display: inline-block; padding: 0em 0.9em; font-size: 3em; font-weight: 700; line-height: 1.2em; }
/* flex-order를 위한 클래스 */
.order-1 { order: 1; }
.order-2 { order: 2; }
.order-3 { order: 3; }

/* ==========================================================================
   3. 헤더 수정 기능 관련 스타일 (EditableArea)
   ========================================================================== */

/* Svelte의 group 클래스를 모방하기 위한 wrapper */
.editable-wrapper-group {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.editable-trigger-button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    cursor: pointer;
    background: none;
    border: none;
    color: inherit;
    font: inherit;
    text-align: inherit;
    transition: background-color 0.2s;
    border-radius: 6px;
}
.editable-trigger-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
}
.editable-trigger-button:focus-visible {
    outline: 2px solid var(--accent-color);
    box-shadow: 0 0 0 2px var(--accent-color);
}

.editable-trigger-button .edit-icon-overlay {
    position: absolute;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    top: 50%;
    right: 0.5em;
    transform: translateY(-50%);
    color: #9ca3af; /* text-muted-foreground */
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
}

/* Svelte의 group-hover 효과 재현 */
.editable-wrapper-group:hover .edit-icon-overlay {
    opacity: 0.7;
}

.edit-icon-svg {
    width: 0.8em;
    height: 0.8em;
    vertical-align: middle;
}

/* --- 개별 헤더 요소의 wrapper 및 button 스타일 --- */
.exam-header-title-wrapper { min-width: 27em; }
.exam-header-title-button { padding: 0.7em 1.4em; font-weight: 700; }

.exam-header-school-wrapper { min-height: 2.7em; width: 11em; flex-shrink: 0; overflow: hidden; white-space: nowrap; border-radius: 1.8em; border: 0.1em solid black; }
.exam-header-school-button { padding: 0.5em 1em; }

.exam-header-subject-wrapper-inner { min-height: 2.7em; }
.exam-header-subject-button { font-weight: 700; padding: 0.5em 1em; }

.simplified-grade-button { border: 0.1em solid black; border-radius: 9999px; font-weight: 600; line-height: 1.2em; padding: 0.25rem 0.75rem; margin-bottom: 0.25rem; }
.simplified-subject-button { padding-bottom: 0.1em; line-height: 1.2em; font-weight: 600; }
.simplified-subject-button .edit-icon-svg { font-size: 0.7em; }

/* ==========================================================================
   4. 문제 배치 및 개별 문제 스타일
   ========================================================================== */
.exam-columns-container { position: relative; box-sizing: border-box; display: flex; min-height: 0; width: 100%; flex-grow: 1; gap: 1.8em; overflow: hidden; padding-bottom: 2.5em; }
.exam-column { min-width: 0; flex: 1 1 0%; }
.column-divider { pointer-events: none; position: absolute; top: 0; bottom: 2.5em; left: 50%; z-index: 1; width: 1px; transform: translateX(-50%); background-color: black; }

.problem-container {
    position: relative;
    padding: 0.9em 1.1em;
    margin-bottom: 1.8em;
    box-sizing: border-box;
    display: flex;
    width: 100%;
    flex-direction: column;
    overflow: hidden;
    border: 0.1em dashed #d1d5db;
    background-color: white;
    transition: min-height 0.2s ease-in-out;
}

/* [수정] 헤더를 양쪽으로 정렬하기 위해 justify-content 변경 */
.problem-header {
    margin-bottom: 0.7em;
    display: flex;
    flex-shrink: 0;
    align-items: center; /* 아이콘과 정렬을 위해 baseline에서 center로 변경 */
    justify-content: space-between; /* 양쪽 정렬 */
    white-space: nowrap;
    font-size: 1em;
    font-weight: 700;
    line-height: 1;
}
.problem-header .header-inner { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.3em; }

.problem-number { font-size: 2em; font-weight: 700; line-height: 1; }
.global-index { margin-left: 0.1em; font-size: 1em; font-weight: 400; line-height: 1; color: #6b7280; }
.problem-score { margin-left: 0.2em; font-size: 1em; font-weight: 700; line-height: 1; }

.text-trigger { 
    display: block; 
    width: 100%; 
    height: 100%; 
    cursor: pointer; 
    border-radius: 4px; 
    padding: 0; 
    text-align: left; 
    color: inherit; 
    background: none; 
    border: none; 
    font: inherit; 
    /* 전체 컨테이너에서 패딩을 뺐으므로, 이 버튼이 패딩 역할을 해야 할 수 있습니다. */
    /* 필요 시 패딩 추가: padding: 0.9em 1.1em; */
}
.text-trigger:hover { background-color: rgba(0,0,0,0.05); }
.text-trigger:focus-visible { outline: 2px solid var(--accent-color); outline-offset: 2px; }

.problem-content-wrapper { position: relative; min-height: 0; width: 100%; flex-grow: 1; overflow: hidden; line-height: 1.75; }
.mathpix-wrapper { display: block; width: 100%; overflow-x: hidden; word-wrap: break-word; }

.page-footer { position: absolute; bottom: 0.9em; left: 50%; z-index: 10; transform: translateX(-50%); background-color: white; }
.page-counter-box { display: inline-block; border: 0.1em solid black; background-color: white; padding: 0.3em 1.4em; font-size: 1.2em; }

/* [추가] 문제 선택 해제 버튼 스타일 */
.problem-deselect-button {
    background: none;
    border: none;
    padding: 2px;
    margin-right: 3px;
    cursor: pointer;
    color: #9ca3af; /* 회색 계열 */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s, transform 0.2s, background-color 0.2s;
    line-height: 1;
    border-radius: 50%;
}

.problem-deselect-button:hover {
    color: #ef4444; /* 빨간색 계열 */
    background-color: rgba(239, 68, 68, 0.1); /* 호버 시 옅은 빨간색 배경 */
    transform: scale(1.1);
}

.problem-deselect-button:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: 1px;
}
----- ./react/entities/student/ui/StudentDisplayDesktop.css -----
/* ./react/entities/student/ui/StudentDisplayDesktop.css */
/* 재원 상태 */
.badge.status-enroll {
    background-color: #28a745;
    color: white;
}

/* 휴원 상태 */
.badge.status-pause {
    background-color: #ffc107;
    color: #212529;
}

/* 퇴원 상태 */
.badge.status-leave {
    background-color: #6c757d;
    color: white;
}

/* 기본 또는 알 수 없는 상태 */
.badge.status-default {
    background-color: #adb5bd;
    color: white;
}

.table-cell-checkbox-td {
    border-bottom: none;
}

.header-icon-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
}

.header-icon-button {
    background: none;
    border: none;
    padding: 4px;
    margin: 0;
    cursor: pointer;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out, transform 0.1s ease-in-out;
    line-height: 1;
}

.header-icon-button:hover:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.1);
    color: var(--accent-color);
}

.header-icon-button:active:not(:disabled) {
    transform: scale(0.95);
}

.header-icon-button:disabled {
    color: var(--text-disabled);
    opacity: 0.5;
    cursor: not-allowed;
}
----- ./react/entities/student/ui/StudentDisplayMobile.css -----
/* ./react/entities/student/ui/StudentDisplayMobile.css */
/* 모바일 상태 뱃지 클래스 이름 일치시키기 (소문자) */
.badge.status-재원, .badge.status-enroll { background-color: #28a745; color: white; }
.badge.status-휴원, .badge.status-pause { background-color: #ffc107; color: #212529; }
.badge.status-퇴원, .badge.status-leave { background-color: #6c757d; color: white; }
.badge.status-delete { background-color: #f56565; color: white; }


.mobile-student-list-container {
    padding: 5px;
}

.mobile-loading-state {
    padding: 2rem;
    text-align: center;
    color: var(--text-placeholder);
}

.mobile-student-card {
    background: var(--main-content-bg-color);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    margin-bottom: 1rem;
    padding: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    cursor: pointer;
    transition: box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out, background-color 0.2s ease-in-out, transform 0.2s ease-in-out;
    -webkit-tap-highlight-color: transparent;
}

.mobile-student-card:hover:not(.active) {
    border-color: rgba(var(--accent-color-rgb), 0.5);
    box-shadow: 0 4px 12px rgba(var(--accent-color-rgb), 0.15);
}

/* [추가됨] 선택된 카드에 대한 강조 스타일 */
.mobile-student-card.selected {
    border-color: var(--accent-color);
    background-color: rgba(var(--accent-color-rgb), 0.05); /* 은은한 배경색 추가 */
}

/* 활성화(클릭)된 카드는 선택된 카드보다 더 강한 강조 효과를 줌 */
.mobile-student-card.active {
    border-color: var(--accent-color-darker);
    box-shadow: 0 5px 15px rgba(var(--accent-color-rgb), 0.25);
    transform: scale(1.01); /* 클릭 시 약간 커지는 효과 */
}

.card-content-wrapper {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
}

.card-main-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.main-info-name-status {
    display: flex;
    align-items: center;
    gap: 0.75rem; /* 이름과 뱃지 사이 간격 */
}

.main-info-name {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
}
.main-info-tags {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
    flex-shrink: 0;
}

.card-details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.5rem 1rem;
    font-size: 0.85rem;
    line-height: 1.5;
}
.detail-item {
    display: flex;
    flex-direction: column;
}
.detail-item span {
    color: var(--text-secondary);
}

.card-actions {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, margin-top 0.3s ease-in-out;
}

.mobile-student-card.active .card-actions {
    max-height: 100px;
    opacity: 1;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.card-actions .action-cell-buttons {
    justify-content: space-around;
}
.card-actions .status-changer-container {
    width: 100%;
    justify-content: space-around;
    flex-wrap: wrap;
    gap: 8px;
}
----- ./react/features/image-upload/ui/ImageManager.css -----
/* ===== 패널 전체 레이아웃 ===== */
.image-manager-panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background-color: transparent;
}

/* 1. 회색 제목 바 (외부 ProblemWorkbenchPage.css에서 스타일 정의) */
.image-manager-panel .panel-title {
    padding: 12px 16px;
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    flex-shrink: 0;
    background-color: none;
}

/* 2. 버튼 행 */
.button-row {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color-light, #e0e0e0);
    flex-shrink: 0;
}

/* 스크롤 가능한 테이블 영역 */
.table-content-area {
    flex-grow: 1;
    overflow: auto;
    scrollbar-gutter: stable;
}

/* ===== 테이블 스타일 ===== */
.image-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}
.image-table thead {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--main-content-bg-color);
}
/* 3. 테이블 헤더 행 */
.image-table th {
    padding: 10px 16px;
    text-align: left;
    font-weight: 500;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-color-light, #e0e0e0);
}
/* 4. 테이블 바디 행 */
.image-table td {
    padding: 10px 16px;
    text-align: left;
    vertical-align: middle;
    border-bottom: 1px solid var(--border-color-light, #e0e0e0);
}
.image-table tbody tr:last-child td {
    border-bottom: none;
}

/* 컬럼 너비 및 스타일 */
.image-table .tag-name {
    font-weight: 500;
}
.tag-content {
    padding: 6px;
    border-radius: 4px;
    transition: background-color 0.2s;
}
.tag-content.drag-over {
    background-color: rgba(var(--accent-color-rgb), 0.1);
    outline: 1px dashed var(--accent-color);
}
.image-table th.actions-header { text-align: right; }
.image-table td.preview-cell { width: 80px; text-align: center; }
.image-table td.actions-cell { width: 100px; text-align: right; }

/* 드래그 앤 드롭 스타일 */
.preview-cell.draggable { cursor: grab; }
.preview-cell.dragging { opacity: 0.4; }
.preview-box {
    width: 56px;
    height: 56px;
    border: 1px solid #ccc;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #888;
    background-color: #f7f7f7;
    overflow: hidden;
    margin: 0 auto;
    flex-shrink: 0;
}
.preview-box img { width: 100%; height: 100%; object-fit: cover; }

/* 버튼 디자인 */
.action-button {
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid transparent;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    white-space: nowrap;
}
.action-button.primary {
    background-color: var(--accent-color);
    color: var(--text-on-accent);
}
.action-button.primary:hover:not(:disabled) {
    background-color: var(--accent-color-darker);
}
.action-button.secondary {
    background-color: transparent;
    color: var(--text-secondary);
    border-color: var(--text-placeholder);
}
.action-button.secondary:hover:not(:disabled) {
    background-color: var(--menu-item-hover-bg);
    border-color: var(--accent-color);
    color: var(--accent-color-darker);
}
.action-button:disabled, .action-button.disabled-style {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: var(--text-placeholder);
    color: var(--text-on-accent);
    border-color: transparent;
}
.button-row .action-button {
    font-size: 12px;
    padding: 5px 10px;
}

.error-display {
    margin-top: 6px;
    font-size: 11px;
    text-align: right;
    color: #e74c3c;
}
.empty-content {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 16px;
    color: var(--text-color-secondary, #777);
    font-size: 14px;
}
.empty-content code { background-color: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px; margin: 0 4px; }

/* ===== 드래그앤드롭 UI 피드백 강화 ===== */
.image-table .tag-content { /* 이 클래스는 현재 사용되지 않으므로 삭제해도 무방 */
    padding: 6px;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.image-table-row {
    transition: background-color 0.2s ease-in-out;
}

.image-table-row.drag-over-row {
    background-color: rgba(var(--accent-color-rgb), 0.1);
}

.preview-cell.draggable { cursor: grab; }
.preview-cell.draggable:active { cursor: grabbing; }

.image-table-row.dragging-row {
    opacity: 0.4;
    background-color: #e0e0e0;
}
.preview-box {
    width: 56px;
    height: 56px;
    border: 1px solid #ccc;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #888;
    background-color: #f7f7f7;
    overflow: hidden;
    margin: 0 auto;
    flex-shrink: 0;
}
----- ./react/features/latex-help/ui/LatexHelpPanel.css -----
/* ./react/features/latex-help/ui/LatexHelpPanel.css */

.latex-help-panel {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    color: var(--text-secondary);
    padding: 0 15px;
    box-sizing: border-box;
    overflow: hidden;
}

.latex-help-title {
    color: var(--text-primary);
    margin: 0;
    padding-bottom: 16px;
    margin-bottom: 16px;
    font-size: 1.05em;
    font-weight: 600;
    border-bottom: 1px solid rgba(129, 127, 127, 0.1);
    flex-shrink: 0;
}

.latex-help-content {
    flex-grow: 1;
    min-height: 0;
    overflow-y: auto;
    padding-right: 10px;
    scrollbar-gutter: stable;
}

.help-section {
    margin-bottom: 24px;
}

.help-category-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.help-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
}

.help-table td {
    padding: 8px 10px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    vertical-align: middle;
}

.help-table tr:last-child td {
    border-bottom: none;
}

.syntax-cell {
    width: 45%;
}

.syntax-cell code {
    background-color: rgba(0, 0, 0, 0.07);
    padding: 3px 8px;
    border-radius: 6px;
    font-family: 'Courier New', Courier, monospace;
    color: var(--accent-color-darker);
    font-weight: 500;
}

.description-cell {
    width: 55%;
    line-height: 1.5;
}
----- ./react/features/problem-text-editing/ui/ProblemTextEditor.css -----
/* ./react/features/problem-text-editing/ui/ProblemTextEditor.css */

.problem-text-editor-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    color: var(--text-secondary);
    padding: 0 15px;
    box-sizing: border-box;
    overflow: hidden;
}

.editor-header {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    margin-bottom: 16px;
    border-bottom: 1px solid rgba(129, 127, 127, 0.1);
}

.editor-title {
    color: var(--text-primary);
    margin: 0;
    font-size: 1.05em;
    font-weight: 600;
}

.editor-actions {
    display: flex;
    gap: 8px;
}

.editor-body-wrapper {
    flex-grow: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding-right: 10px;
    scrollbar-gutter: stable;
}

/* [재활용] 이 클래스는 이제 문제 본문, 해설 모두에 사용됩니다. */
.editor-section {
    display: flex;
    flex-direction: column;
    min-height: 250px; /* 최소 높이 살짝 줄임 */
    max-height: 45vh; /* 화면 높이의 45% */
}

.editor-section-title {
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--text-primary);
}

.editor-wrapper-body {
    flex-grow: 1;
    min-height: 0;
    position: relative;
    border: 1px solid var(--border-color-light, #e0e0e0);
    border-radius: 8px;
    overflow: hidden;
}

.editor-wrapper-body .editor-wrapper,
.editor-wrapper-body .cm-editor {
    height: 100%;
}

.metadata-fields-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.metadata-field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.metadata-field-label {
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-weight: 500;
}

.metadata-field-input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--text-placeholder, #d1d5db);
    border-radius: 8px;
    font-size: 0.95rem;
    color: var(--text-primary);
    background-color: var(--app-bg-color);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.metadata-field-input:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.15);
}

.metadata-field-input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--text-placeholder, #d1d5db);
    border-radius: 8px;
    font-size: 0.95rem;
    color: var(--text-primary);
    background-color: var(--app-bg-color);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

/* [추가] 콤보박스 트리거 버튼 스타일 */
.metadata-field-combobox-trigger {
    /* .metadata-field-input 과 유사한 디자인으로 설정 */
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--text-placeholder, #d1d5db);
    border-radius: 8px;
    font-size: 0.95rem;
    color: var(--text-primary);
    background-color: var(--app-bg-color);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
}

.metadata-field-combobox-trigger:hover {
    border-color: var(--accent-color);
}

.metadata-field-combobox-trigger .chevron-icon {
    color: var(--text-placeholder);
    flex-shrink: 0;
}


.metadata-field-input:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.15);
}
----- ./react/features/prompt-collection/ui/PromptCollection.css -----
.prompt-collection-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    color: var(--text-secondary);
    padding: 0 15px;
    box-sizing: border-box;
    overflow: hidden;
}

.prompt-collection-header, .add-prompt-section {
    flex-shrink: 0;
}

.prompt-collection-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(129, 127, 127, 0.1);
}

.prompt-collection-title {
    color: var(--text-primary);
    margin: 0;
    font-size: 1.05em;
    font-weight: 600;
}

.add-prompt-section {
    padding-top: 16px;
}

.add-prompt-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid transparent;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    background-color: transparent;
    color: var(--accent-color);
    border: 1px solid var(--accent-color);
    transition: all 0.2s;
}

.add-prompt-button:hover {
    background-color: var(--accent-color);
    color: var(--text-on-accent);
}

.prompt-list {
    padding-top: 20px;
    padding-right: 10px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    flex-grow: 1;
    min-height: 0;
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.12) transparent;
}
.prompt-list::-webkit-scrollbar { width: 6px; }
.prompt-list::-webkit-scrollbar-track { background: transparent; }
.prompt-list::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.15); border-radius: 3px; }

.prompt-memo-card {
    background-color: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 8px;
    transition: box-shadow 0.2s, border-color 0.2s;
    overflow: hidden;
}

.prompt-memo-card.editing {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.15);
}

.prompt-memo-header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.04);
    cursor: pointer;
    gap: 8px;
}
.prompt-memo-header.non-clickable {
    cursor: default;
}

.header-top-row, .header-bottom-row {
    display: flex;
    align-items: center;
    width: 100%;
}
.header-top-row {
    gap: 4px;
}
.header-bottom-row {
    justify-content: flex-start;
}

.expand-toggle-button {
    background: none; border: none; padding: 4px; border-radius: 50%; display: flex;
    cursor: pointer;
}
.expand-toggle-button .chevron-icon {
    transition: transform 0.25s ease-in-out;
    color: var(--text-placeholder);
}
.prompt-memo-card.expanded .chevron-icon {
    transform: rotate(180deg);
}

.prompt-memo-title {
    margin: 0;
    font-size: 0.9em;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 4px 0;
}

.button-group {
    display: flex; align-items: center; gap: 4px; flex-shrink: 0;
}

/* [수정] 클래스명 변경 */
.prompt-action-button {
    background: none; border: none; cursor: pointer; padding: 6px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-secondary);
    transition: background-color 0.2s, color 0.2s;
}
.prompt-action-button:disabled { color: #dcdcdc; cursor: not-allowed; }
.prompt-action-button:hover:not(:disabled) { background-color: rgba(0, 0, 0, 0.1); }
.prompt-action-button.copy:hover, .prompt-action-button.reset:hover { color: var(--accent-color-darker); }
.prompt-action-button.edit:hover { color: #3498db; }
.prompt-action-button.delete:hover:not(:disabled) { color: #e74c3c; }
.prompt-action-button.save { color: #2ecc71; }
.prompt-action-button.save:hover { color: #27ae60; }
.prompt-action-button.cancel { color: #95a5a6; }
.prompt-action-button.cancel:hover { color: #7f8c8d; }

.prompt-memo-content {
    font-size: 0.85em;
    line-height: 1.6;
    overflow: hidden;
    padding: 0 12px;
    transition: max-height 0.35s ease-in-out, padding 0.35s ease-in-out;
}
.prompt-memo-card:not(.expanded) .prompt-memo-content {
    max-height: calc(1.6em * 2 + 24px);
    padding-top: 12px;
    padding-bottom: 12px;
}
.prompt-memo-card.expanded .prompt-memo-content {
    max-height: 800px;
    padding-top: 12px;
    padding-bottom: 12px;
}
.prompt-memo-card.editing .prompt-memo-content {
    padding: 12px;
    max-height: none;
    height: 300px;
    resize: vertical;
}

.prompt-memo-content pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: inherit;
    transition: -webkit-line-clamp 0.2s ease-in-out, line-clamp 0.2s ease-in-out;
}
.prompt-memo-card:not(.expanded) .prompt-memo-content pre {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
}

.title-input {
    width: 100%; font-size: 0.9em; font-weight: 600; color: var(--text-primary);
    border: none; background: transparent; outline: none; padding: 6px 4px; border-radius: 4px;
}
.title-input:focus { background-color: rgba(255,255,255,0.7); }

.content-textarea {
    width: 100%; height: 100%; resize: none; border: none; background: transparent;
    outline: none; font-size: 1em; font-family: inherit; line-height: 1.6; color: var(--text-secondary);
}

.empty-prompt-list {
    text-align: center; padding: 3rem 1rem; color: var(--text-placeholder); font-size: 0.9em;
}
.empty-prompt-list p { margin: 0.5em 0; }
----- ./react/features/student-actions/ui/StudentActionButtons.css -----
.action-cell-buttons {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    width: 100%;
}

.action-icon-button {
    background: none;
    border: none;
    padding: 4px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-color-secondary, #666);
    transition: background-color 0.2s, color 0.2s;
}

.action-icon-button:hover {
    background-color: rgba(0, 0, 0, 0.08);
    color: var(--text-color-primary, #333);
}

.action-icon-button.delete:hover {
    color: #e53e3e; /* 삭제 아이콘은 호버 시 붉은색으로 */
    background-color: rgba(229, 62, 62, 0.1);
}
----- ./react/features/student-registration/ui/CategoryInput.css -----
/* features/student-registration/ui/CategoryInput.css */
/* ProfileSetupPage.css 및 index.css의 스타일과 통일감 유지 */

.category-input-group {
    display: grid;
    gap: 8px;
}

/* form-label 클래스는 StudentRegistrationForm.css 에서 공통으로 정의 */

.category-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.suggestion-button {
    padding: 4px 12px;
    border: 1px solid var(--text-placeholder, #d1d5db);
    background-color: transparent;
    color: var(--text-secondary);
    border-radius: 16px; /* pill shape */
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
}

.suggestion-button:hover:not(.active) {
    border-color: var(--accent-color);
    color: var(--accent-color-darker);
    background-color: var(--menu-item-hover-bg);
}

.suggestion-button.active {
    background-color: var(--accent-color);
    color: var(--text-on-accent);
    border-color: var(--accent-color);
    font-weight: 600;
}

/* form-input 클래스는 StudentRegistrationForm.css 에서 공통으로 정의 */
----- ./react/features/student-registration/ui/StudentRegistrationForm.css -----
/* features/student-registration/ui/StudentRegistrationForm.css */

.student-registration-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    color: var(--text-secondary);
    padding: 0 15px; /* 🌟 컨테이너에 좌우 패딩 부여 */
    box-sizing: border-box;
}

.registration-form-title {
    color: var(--text-primary);
    margin: 0;
    padding: 0 0 16px 0; /* 좌우 패딩은 부모에서 처리 */
    font-size: 1.05em;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(129, 127, 127, 0.1);
}

.registration-form {
    padding-top: 20px;
    /* 🌟 오른쪽 패딩을 추가하여 스크롤바 공간과 콘텐츠 사이 간격 확보 */
    padding-right: 10px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
    flex-grow: 1;
    
    /* 🌟🌟🌟 [핵심 수정] 🌟🌟🌟 */
    scrollbar-gutter: stable; /* 항상 스크롤바 공간 확보 */

    /* 웹킷 기반 브라우저 스크롤바 스타일 */
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.12) transparent;
}
.registration-form::-webkit-scrollbar {
    width: 6px;
}
.registration-form::-webkit-scrollbar-track {
    background: transparent;
}
.registration-form::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.15);
    border-radius: 3px;
}

/* 공통 폼 요소 스타일 (ProfileSetupPage와 유사) */
.form-group {
    display: grid;
    gap: 8px;
}
.form-label {
    font-weight: 500;
    font-size: 0.9rem;
    color: var(--text-secondary);
}
.form-input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--text-placeholder, #d1d5db);
    border-radius: 8px;
    font-size: 0.95rem;
    color: var(--text-primary);
    background-color: var(--app-bg-color);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.form-input::placeholder {
    color: var(--text-placeholder);
}
.form-input:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.15);
}

/* 폼 하단 액션 버튼 영역 */
.form-actions {
    margin-top: auto;
    padding-top: 16px;
    border-top: 1px solid rgba(129, 127, 127, 0.1);
    flex-shrink: 0;
}
.submit-button {
    width: 100%;
    padding: 12px 20px;
    background-color: var(--accent-color);
    color: var(--text-on-accent);
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease, opacity 0.2s ease;
}
.submit-button:hover:not(:disabled) {
    background-color: var(--accent-color-darker);
}
.submit-button:disabled {
    background-color: var(--text-placeholder);
    opacity: 0.7;
    cursor: not-allowed;
}
.form-error-message {
    color: var(--notification-badge-bg);
    font-size: 0.875rem;
    font-weight: 500;
    text-align: center;
    margin-bottom: 12px;
}

@media (max-width: 768px) {
    .student-registration-container {
        padding: 0 20px; /* 모바일에서 좌우 패딩 조정 */
    }
}
----- ./react/features/student-status-changer/ui/StudentStatusChanger.css -----
.status-changer-container {
    display: flex;
    align-items: center;
    gap: 6px;
    animation: fadeIn 0.3s ease-in-out;
}

.clickable-badge {
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.clickable-badge:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.status-delete {
    background-color: #f56565; /* 붉은 계열 */
    color: white;
}
.status-delete:hover {
    background-color: #e53e3e;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.cancel-button {
    padding: 4px;
    border-radius: 50%;
    color: var(--text-color-secondary, #666);
    transition: background-color 0.2s, color 0.2s;
}

.cancel-button:hover {
    background-color: rgba(0, 0, 0, 0.08);
    color: var(--text-color-primary, #333);
}

/* [추가] 아이콘과 Badge 사이의 시각적 분리를 위한 선 (선택 사항) */
.cancel-button::after {
    content: '';
    display: block;
    width: 1px;
    height: 16px;
    background-color: var(--border-color-light, rgba(0, 0, 0, 0.1));
    margin-left: 8px; /* 아이콘과 선 사이 간격 */
}
----- ./react/features/table-column-toggler/ui/TableColumnToggler.css -----
/* react/features/table-column-toggler/ui/TableColumnToggler.css */

.column-toggler-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: var(--text-secondary);
  padding: 0 15px;
  box-sizing: border-box;
}

.toggler-title {
  color: var(--text-primary);
  margin: 0;
  padding: 0 0 16px 0;
  font-size: 1.05em;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(129, 127, 127, 0.1);
}

.toggler-list {
  padding-top: 20px;
  padding-right: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  flex-grow: 1;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.12) transparent;
}

.toggler-list::-webkit-scrollbar {
  width: 6px;
}
.toggler-list::-webkit-scrollbar-track {
  background: transparent;
}
.toggler-list::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

.toggler-button {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--text-placeholder, #d1d5db);
  background-color: transparent;
  color: var(--text-secondary);
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toggler-button:hover:not(.active) {
  border-color: var(--accent-color);
  color: var(--accent-color-darker);
  background-color: var(--menu-item-hover-bg);
}

.toggler-button.active {
  background-color: var(--accent-color);
  color: var(--text-on-accent);
  border-color: var(--accent-color);
  font-weight: 600;
}

.toggler-button .button-label {
  flex-grow: 1;
  text-align: left;
}

.toggler-button .button-icon {
  flex-shrink: 0;
  color: var(--text-on-accent);
}
----- ./react/features/table-search/ui/TableSearch.css -----
/* ./react/features/table-search/ui/TableSearch.css */

.table-search-panel {
    width: 100%;
    /* [수정] 최대 너비 제한을 제거하여 컨테이너에 꽉 차도록 합니다. */
    /* max-width: 960px; */
    background: var(--navbar-glass-bg);
    backdrop-filter: var(--glass-blur-effect);
    -webkit-backdrop-filter: var(--glass-blur-effect);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--main-content-border-radius);
    padding: 16px 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: all 0.3s ease-in-out;
    pointer-events: auto;
}

.search-input-wrapper {
    position: relative;
    width: 100%;
}
.search-input-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-placeholder);
    transition: color 0.2s ease-in-out;
}
.search-input {
    width: 100%;
    background-color: rgba(0, 0, 0, 0.07); 
    border: 1px solid transparent;
    border-radius: 14px;
    padding: 14px 18px 14px 50px;
    font-size: 1.05rem;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}
.search-input::placeholder {
    color: var(--text-placeholder);
}
.search-input:focus {
    background-color: transparent; 
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.2);
}
.search-input:focus + .search-input-icon {
    color: var(--accent-color);
}

/* 필터와 액션 영역을 감싸는 Flex 컨테이너 */
.filter-actions-container {
    display: flex;
    justify-content: space-between;
    align-items: flex-start; /* 상단 정렬 */
    gap: 20px;
}

/* 왼쪽 필터 칩 영역 */
.filter-chips-area {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-grow: 1; /* 남는 공간을 모두 차지 */
    min-width: 0; /* flex item이 줄어들 수 있도록 */
}

.suggestion-group {
    display: flex;
    align-items: center;
    gap: 10px;
}

.suggestion-buttons-wrapper {
    display: flex;
    flex-wrap: wrap; /* 버튼이 많아지면 줄바꿈 처리 */
    gap: 8px;
}

.suggestion-chip {
    padding: 5px 14px; /* 패딩 살짝 조정 */
    border: 1px solid var(--text-placeholder, #d1d5db);
    background-color: transparent;
    color: var(--text-secondary);
    border-radius: 18px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
}
.suggestion-chip:hover:not(.active) {
    border-color: var(--accent-color);
    color: var(--accent-color-darker);
    background-color: var(--menu-item-hover-bg);
}
.suggestion-chip.active {
    background-color: var(--accent-color);
    color: var(--text-on-accent);
    border-color: var(--accent-color);
    font-weight: 600;
}
.suggestion-chip-clear {
    margin-left: -2px;
    margin-right: -4px;
    opacity: 0.7;
    transition: opacity 0.2s;
}
.suggestion-chip.active:hover .suggestion-chip-clear {
    opacity: 1;
}

/* 오른쪽 액션 컨트롤 영역 */
.action-controls-area {
    display: flex;
    flex-direction: column; /* [핵심] 버튼을 항상 세로로 정렬 */
    gap: 8px;
    flex-shrink: 0; /* 너비가 줄어들지 않도록 고정 */
}

.control-button {
    display: inline-flex;
    align-items: center;
    justify-content: flex-start; /* 텍스트를 왼쪽 정렬 */
    gap: 8px;
    width: 100%;
    min-width: 160px; /* 버튼의 최소 너비 설정 */
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid rgba(0,0,0,0.1);
    background-color: rgba(0,0,0,0.05);
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
}

.control-button:hover:not(:disabled) {
    background-color: rgba(0,0,0,0.1);
    color: var(--text-primary);
}

.control-button.primary {
    background-color: var(--accent-color);
    color: var(--text-on-accent);
    border-color: transparent;
}

.control-button.primary:hover:not(:disabled) {
    background-color: var(--accent-color-darker);
}

.control-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

@media (max-width: 768px) {
    .table-search-panel { padding: 12px; gap: 10px; }
    .search-input { padding: 12px 16px 12px 45px; font-size: 1rem; }
    
    .filter-actions-container {
        flex-direction: row;
        align-items: flex-start; /* 세로 정렬을 start로 유지 */
        gap: 12px;
    }
    
    /* [수정] 모바일에서도 세로로 쌓이도록 별도의 flex-direction 변경을 하지 않습니다. */
    .action-controls-area {
        gap: 6px; /* 모바일에서 버튼 간격을 살짝 줄임 */
    }
    
    /* [수정] 버튼 스타일을 모바일에 맞게 조정하되, 가로/세로 길이는 유지 */
    .control-button {
        min-width: 120px; /* 모바일에서 버튼의 최소 너비를 살짝 줄임 */
        padding: 8px 10px;
        font-size: 13px;
        justify-content: center; /* 모바일에선 아이콘/텍스트 중앙 정렬 */
    }

    .control-button span {
        display: inline;
    }
}
----- ./react/index.css -----
/* client/src/index.css */
:root {
  /* --- 기본 설정 --- */
  --base-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  --app-bg-color: #fdfcfa;

  /* --- 텍스트 색상 --- */
  --text-primary: #2c3e50;
  --text-secondary: #576574;
  --text-placeholder: #a5b1c2;
  --text-on-accent: #ffffff;

  /* --- 악센트 컬러 --- */
  --accent-color: #e67e22;
  --accent-color-rgb: 230, 126, 34;
  --accent-color-darker: #d35400;

  /* --- Glassmorphism UI 공통 스타일 --- */
  --glass-base-bg-rgb: 255, 253, 250;
  /* 기본 유리 배경 RGB (약간 더 밝게) */
  --glass-bg-opacity-navbar: 0.5;
  /* 네비바 투명도 */
  --glass-bg-opacity-sidebar: 0.5;
  /* 사이드바 투명도 */
  --glass-bg-opacity-mobile-sidebar: 0.90;
  /* 모바일 사이드바는 더 불투명하게 */
  --glass-blur-effect: blur(10px) saturate(150%);

  /* Navbar, Sidebar Glass 배경 (공통 변수 사용) */
  --navbar-glass-bg: rgba(var(--glass-base-bg-rgb), var(--glass-bg-opacity-navbar));
  --sidebar-glass-bg: rgba(var(--glass-base-bg-rgb), var(--glass-bg-opacity-sidebar));
  --mobile-sidebar-glass-bg: rgba(var(--glass-base-bg-rgb), var(--glass-bg-opacity-mobile-sidebar));

  /* --- 레이아웃 크기 --- */
  --navbar-height: 45px;
  --navbar-height-mobile: 45px;
  --sidebar-width: 210px;
  --sidebar-collapsed-width: 65px;
  --sidebar-right-width: 60px;
  --sidebar-right-expanded-width: 280px;
   --sidebar-right-extra-expanded-width: 450px;
  --mobile-sidebar-width-ratio: 78vw;
  /* 화면 너비의 78% (약간 넓힘) */
  --mobile-sidebar-max-width: 330px;
  /* 최대 너비 제한 */
  --main-content-border-radius: 18px;
  --main-content-bg-color: #fefefe;

  /* --- 메뉴 아이템 색상 --- */
  --menu-item-hover-bg: rgba(0, 0, 0, 0.04);
  /* 호버 배경 약간 더 연하게 */
  --menu-item-active-bg: rgba(var(--accent-color-rgb), 0.12);
  /* 활성 배경 약간 더 연하게 */
  --menu-item-active-text: var(--accent-color-darker);
  --icon-color: var(--text-secondary);
  --icon-active-color: var(--accent-color-darker);

  /* --- 알림 뱃지 --- */
  --notification-badge-bg: #e74c3c;
  --notification-badge-text: white;

  /* --- 툴팁 스타일 변수 --- */
  --tooltip-bg-rgb: 35, 35, 45;
  /* 툴팁 배경 RGB (더 어둡게) */
  --tooltip-bg-opacity: 0.96;
  --tooltip-text-color: #e8e8e8;
  /* 툴팁 텍스트 약간 더 밝게 */
  --tooltip-border-radius: 6px;
  --tooltip-padding: 8px 12px;
  /* 툴팁 패딩 약간 넓힘 */
  --tooltip-font-size: 12px;
  --tooltip-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  --tooltip-arrow-size: 7px;
  --tooltip-backdrop-blur: 4px;

  /* --- 모바일 오버레이 --- */
  --mobile-overlay-bg-rgb: 255, 255, 255;
  --mobile-overlay-bg-opacity: 0.25;
  /* 이전 0.3에서 약간 더 투명하게 */
  --mobile-overlay-blur: 2.5px;
  /* 블러 강도 약간 줄임 */
}

body {
  margin: 0;
  font-family: var(--base-font-family);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--app-bg-color);
  color: var(--text-primary);
  overflow: hidden;
  /* 전역 스크롤 방지 */
  line-height: 1.5;
  /* 기본 줄 간격 */
}

*,
*::before,
*::after {
  box-sizing: border-box;
  /* 모든 요소에 box-sizing 적용 */
}

/* --- Tippy.js 커스텀 테마: custom-glass --- */
.tippy-box[data-theme~='custom-glass'] {
  font-family: var(--base-font-family);
  font-size: var(--tooltip-font-size);
  font-weight: 500;
  line-height: 1.4;
  background-color: rgba(var(--tooltip-bg-rgb), var(--tooltip-bg-opacity));
  color: var(--tooltip-text-color);
  border-radius: var(--tooltip-border-radius);
  padding: var(--tooltip-padding);
  box-shadow: var(--tooltip-shadow);
  backdrop-filter: blur(var(--tooltip-backdrop-blur)) saturate(110%);
  /* 채도 조정 */
  -webkit-backdrop-filter: blur(var(--tooltip-backdrop-blur)) saturate(110%);
}

.tippy-box[data-theme~='custom-glass'] .tippy-arrow {
  color: rgba(var(--tooltip-bg-rgb), var(--tooltip-bg-opacity));
  width: calc(var(--tooltip-arrow-size) * 2);
  height: calc(var(--tooltip-arrow-size) * 2);
}

/* 스크롤바 기본 스타일 (선택적) */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.18);
  border-radius: 4px;
  border: 2px solid transparent;
  /* 트랙과의 간격처럼 보이게 */
  background-clip: padding-box;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.28);
}

/* 파이어폭스용 스크롤바 */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.18) rgba(0, 0, 0, 0.03);
}

/* [추가] 콘텐츠 렌더링을 위한 전역 prose 클래스 */
.prose::after {
    content: "";
    display: table;
    clear: both;
}

/* 1. 기본 이미지 스타일 (가운데 정렬) */
.prose img:not([src*="#left"]):not([src*="#right"]):not([src*="#align"]) {
    display: block;
    margin-left: auto;
    margin-right: auto;
    max-width: 90%;
    border-radius: 8px;
    clear: both;
}

/* 2. 단순 왼쪽 정렬 (float 아님) */
.prose img[src*="#left"] {
    display: block;
    margin-right: auto;
    margin-left: 0;
    max-width: 90%;
    border-radius: 8px;
    clear: both;
}

/* 3. 단순 오른쪽 정렬 (float 아님) */
.prose img[src*="#right"] {
    display: block;
    margin-left: auto;
    margin-right: 0;
    max-width: 90%;
    border-radius: 8px;
    clear: both;
}

.prose img[src*="#inline-right"] {
    display: block;
    margin-left: auto;
    margin-right: 0;
    width: 50%;
    border-radius: 8px;
    clear: both;
    float: inline-end;
}
.prose img[src*="#inline-left"] {
    display: block;
    margin-left: 0;
    margin-right: auto;
    width: 50%;
    border-radius: 8px;
    clear: both;
    float: inline-start;
}
----- ./react/pages/JsonRendererPage.css -----
/* react/pages/JsonRendererPage.css */

/* ==========================================================================
   1. 페이지 및 위젯 레이아웃
   ========================================================================== */

.json-renderer-page {
    display: flex;
    height: 100%;
    width: 100%;
    padding: 0;
    box-sizing: border-box;
}

.json-importer-widget {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    width: 100%;
    height: 100%;
}

/* ==========================================================================
   2. 패널 공통 스타일 (헤더, 콘텐츠 영역)
   ========================================================================== */

.json-importer-widget .panel {
    display: flex;
    flex-direction: column;
    background-color: var(--glass-base-bg, rgba(255, 255, 255, 0.8));
    border: 1px solid var(--border-color-light, rgba(255, 255, 255, 0.2));
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    overflow: hidden;
}

.json-importer-widget .panel-header {
    padding: 12px 16px;
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    border-bottom: 1px solid #e0e0e0; 
    flex-shrink: 0;
    background-color: rgba(0, 0, 0, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.json-importer-widget .panel-content {
    padding: 1rem;
    flex-grow: 1;
    overflow: auto;
    display: flex;
    flex-direction: column;
}

/* ==========================================================================
   3. 왼쪽/오른쪽 패널 구조
   ========================================================================== */

.json-importer-widget .left-panel {
    flex: 2;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
.json-importer-widget .right-panel {
    flex: 3;
}

/* ==========================================================================
   4. 왼쪽 패널 내부 요소 (JSON 입력, 공통 정보)
   ========================================================================== */

.json-input-panel {
    flex-grow: 1;
}
.json-input-panel .panel-content {
    padding: 0.5rem;
}

.common-data-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
}
.common-data-form .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
.common-data-form label {
    font-weight: 500;
    font-size: 0.9rem;
    color: var(--text-secondary);
}
.common-data-form .action-button {
    margin-top: auto;
}

/* ==========================================================================
   5. 공통 Input / Textarea 스타일
   ========================================================================== */

.json-input-textarea,
.common-data-form input {
    width: 100%;
    background-color: rgba(0, 0, 0, 0.07); 
    border: 1px solid transparent;
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 0.95rem;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
    font-family: var(--base-font-family);
    box-sizing: border-box;
}

.json-input-textarea {
    font-family: monospace;
    resize: none;
    height: 100%;
}

.common-data-form input:focus,
.json-input-textarea:focus {
    background-color: transparent; 
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.2);
}

.error-display {
    margin-top: 0.5rem;
    padding: 0.5rem;
    border: 1px solid #e53e3e;
    background-color: rgba(229, 62, 62, 0.1);
    color: #e53e3e;
    border-radius: 4px;
    font-size: 0.8rem;
}
.error-display pre {
    white-space: pre-wrap;
    word-break: break-all;
}

/* ==========================================================================
   6. 오른쪽 패널 테이블 스타일
   ========================================================================== */

.table-wrapper {
    overflow: auto;
    height: 100%;
}
.problem-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}
.problem-table thead {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: var(--glass-base-bg, rgba(255, 255, 255, 0.8));
    backdrop-filter: blur(5px);
}

.problem-table th, .problem-table td {
    padding: 0.4rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
    vertical-align: middle;
}
.problem-table th {
    font-weight: 600;
}

.cell-edit-trigger {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    width: 100%;
    height: 100%;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 1.8rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s;
    font-size: inherit;
    color: inherit;
}
.cell-edit-trigger:not(:disabled):hover {
    background-color: var(--menu-item-hover-bg, rgba(0, 0, 0, 0.05));
}
.cell-edit-trigger[disabled] {
    cursor: default;
    color: var(--text-placeholder);
}
.cell-edit-trigger-content {
    white-space: pre;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1;
}
.cell-edit-trigger .chevron-icon {
    flex-shrink: 0;
    margin-left: 0.5rem;
    opacity: 0.5;
}

/* ==========================================================================
   7. Popover 및 내부 요소 스타일
   ========================================================================== */

.edit-popover-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: auto; 
    min-width: 320px;
    max-height: 80vh;
    overflow-y: auto;
    resize: none; 
}

/* Textarea가 포함된 Popover (large) */
.glass-popover.large .edit-popover-content {
    width: 600px;
    height: 400px;
    resize: both;
    overflow: hidden;
    padding-bottom: 0;
    /* [핵심 수정] 사용자가 조절할 수 있는 최소 크기를 지정합니다. */
    min-width: 600px;
    min-height: 300px;
}

/* Textarea와 버튼을 감싸는 컨테이너 */
.textarea-container {
    flex-grow: 1;
    position: relative;
    display: flex;
    min-height: 0;
    background-color: rgba(0, 0, 0, 0.07);
    border: 1px solid transparent;
    border-radius: 10px;
    transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}
.textarea-container:focus-within {
    background-color: transparent; 
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.2);
}

/* Textarea 자체 */
.popover-textarea {
    resize: none; 
    width: 100%;
    height: 100%;
    padding: 12px;
    padding-bottom: 50px;
    box-sizing: border-box;
    color: var(--text-primary);
    font-size: 0.95rem;
    font-family: var(--base-font-family);
    outline: none;
    border: none;
    background-color: transparent;
    min-width: 0; /* 부모 너비에 맞춰 줄어들 수 있도록 함 */
}

.edit-popover-content label {
    font-weight: 500;
    font-size: 0.9rem;
    color: var(--text-secondary);
    flex-shrink: 0;
}
.edit-popover-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.5rem;
    flex-shrink: 0;
}

.edit-popover-actions.on-textarea {
    position: absolute;
    bottom: 8px;
    right: 8px;
    margin-top: 0;
    z-index: 10;
}

.edit-popover-content.combobox-content {
    padding: 0.5rem;
    gap: 0.25rem;
    width: auto;
    min-width: 180px;
}
.combobox-label {
    padding: 0.5rem 0.5rem 0.25rem;
    font-weight: 600;
    color: var(--text-primary);
}
.combobox-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 8px 12px;
    border-radius: 6px;
    border: none;
    background-color: transparent;
    text-align: left;
    cursor: pointer;
    color: var(--text-secondary);
}
.combobox-option:hover {
    background-color: var(--menu-item-hover-bg);
    color: var(--text-primary);
}
.combobox-option[aria-selected="true"] {
    background-color: var(--menu-item-active-bg);
    color: var(--menu-item-active-text);
    font-weight: 500;
}
.combobox-option .check-icon {
    color: var(--menu-item-active-text);
    flex-shrink: 0;
}
.combobox-option .option-label {
    flex-grow: 1;
}

/* ==========================================================================
   8. 반응형 레이아웃
   ========================================================================== */

@media (max-width: 1024px) {
    .json-importer-widget {
        flex-direction: column;
        height: auto;
    }
    .json-importer-widget .left-panel,
    .json-importer-widget .right-panel {
        flex: none;
        width: 100%;
        min-height: 50vh;
    }
}
----- ./react/pages/LoginPage.css -----
/* filepath: react/pages/LoginPage.css */

.login-page-wrapper {
    position: relative;
    width: 100%;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
}

.login-background-blobs-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
}

.login-page-container {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
}

.login-form-card {
    background: var(--sidebar-glass-bg);
    backdrop-filter: var(--glass-blur-effect);
    -webkit-backdrop-filter: var(--glass-blur-effect);
    border-radius: var(--main-content-border-radius);
    padding: 40px 50px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(var(--glass-base-bg-rgb), 0.2);
    text-align: center;
    width: 100%;
    max-width: 420px;
    color: var(--text-primary);
}

.login-title {
    font-size: 2.2rem;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-primary);
}

.login-subtitle {
    font-size: 0.95rem;
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: 35px;
}

.social-login-buttons-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 100%;
}


/* 공통 소셜 로그인 버튼 스타일 */
.social-login-button {
    width: 100%;
    min-height: 48px;
    /* 버튼 최소 높이 설정 (카카오 버튼 이미지 높이에 맞춤) */
    padding: 0;
    /* 내부 콘텐츠(이미지)가 꽉 차도록 패딩 제거 */
    border-radius: 12px;
    /* 카카오 버튼 권장 라운드 값 (또는 --main-content-border-radius 와 유사하게) */
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
    /* Google 버튼 텍스트용 */
    font-weight: 500;
    /* Google 버튼 텍스트용 */
    transition: opacity 0.2s ease-in-out, filter 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    box-sizing: border-box;
    overflow: hidden;
    /* 내부 이미지가 둥근 모서리를 넘어가지 않도록 */
    line-height: 0;
    /* button 태그의 기본 line-height로 인해 이미지 하단에 여백 생기는 것 방지 */
}

/* 카카오 로그인 버튼 */
.kakao-login-button {
    background-color: #FEE500;
    /* 이미지 배경색과 동일하게 */
}

.kakao-login-button:hover {
    filter: brightness(0.96);
    /* 호버 시 약간 어둡게 */
}

.kakao-login-button img {
    display: block;
    /* 이미지 하단 여백 제거 */
    width: 100%;
    /* 버튼 너비에 맞춤 */
    height: auto;
    /* 이미지 비율 유지 */
    /* 
    카카오 로그인 버튼 이미지의 권장 크기가 있습니다.
    medium_wide: 300px (너비)
    medium_narrow: 183px (너비)
    이미지 자체에 높이값이 있으므로, width: 100% 로 하면 버튼 크기에 따라 이미지가 늘어날 수 있습니다.
    특정 크기를 원하면 width 값을 고정하거나, max-width를 설정합니다.
    예: max-width: 300px; margin: 0 auto; (이미지를 중앙에 두고, 버튼은 100% 너비)
    여기서는 버튼이 100% 너비를 가지고 이미지가 그 안에 꽉 차도록 합니다.
  */
}


/* 구글 로그인 버튼 */
.google-login-button {
    background-color: #fff;
    color: #3c4043;
    border: 1px solid #dadce0;
    box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
    /* 구글 버튼은 텍스트가 있으므로 패딩이 필요합니다. */
    padding: 12px 18px;
    /* 구글 버튼용 패딩 재정의 */
    min-height: initial;
    /* Google 버튼은 내용에 따라 높이 결정되도록 */
    line-height: normal;
    /* Google 버튼 텍스트를 위해 line-height 복원 */
}

.google-login-button:hover {
    background-color: #f8f9fa;
    border-color: #c6c6c6;
    box-shadow: 0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 2px 6px 2px rgba(60, 64, 67, 0.15);
}

.google-login-button .social-login-icon {
    margin-right: 10px;
    width: 18px;
    height: 18px;
}

.google-login-button .social-login-text {
    flex-grow: 1;
    text-align: center;
    margin-left: -18px;
    /* 아이콘 너비만큼 당겨서 텍스트가 버튼 중앙에 오도록 */
}


.login-terms {
    margin-top: 30px;
    font-size: 0.75rem;
    color: var(--text-secondary);
    line-height: 1.5;
}

.login-terms a {
    color: var(--accent-color);
    text-decoration: none;
    font-weight: 500;
}

.login-terms a:hover {
    color: var(--accent-color-darker);
    text-decoration: underline;
}

/* 반응형 디자인 */
@media (max-width: 480px) {
    .login-form-card {
        padding: 30px 25px;
        border-radius: var(--main-content-border-radius);
    }

    .login-title {
        font-size: 1.8rem;
    }

    .login-subtitle {
        font-size: 0.9rem;
        margin-bottom: 25px;
    }

    .social-login-button {
        /* 모바일에서 버튼 높이, 패딩 등 조정 가능 */
        min-height: 45px;
        /* 카카오 버튼 높이와 유사하게 */
    }

    .google-login-button {
        padding: 10px 15px;
        /* 모바일에서 구글 버튼 패딩 축소 */
    }
}
----- ./react/pages/ProblemPublishingPage.css -----
/* react/pages/ProblemPublishingPage.css */

/*
 * [수정] 페이지 최상위 컨테이너
 * height: 100%를 제거하여 내용만큼 높이가 늘어나도록 합니다.
 * 이제 이 컨테이너는 부모인 main-content의 스크롤에 따라 움직입니다.
 */
.problem-publishing-page {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 1.5rem;
}

/*
 * 상단 영역 (문제 선택 위젯 + 툴바).
 * 이 영역은 이제 페이지 스크롤과 함께 자연스럽게 움직입니다.
 */
.sticky-top-container {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/*
 * [스크롤 영역 1: 테이블]
 * 테이블 컨테이너는 기존과 동일하게 높이를 제한하여
 * 테이블 내용이 많을 때 자체 스크롤이 생기도록 합니다.
 */
.selection-widget-container {
    flex-shrink: 0;
    max-height: 40vh;
    min-height: 250px;
    display: flex;
    flex-direction: column;
    
}

/* 컨트롤 패널 스타일 (변경 없음) */
.publishing-controls-panel {
    flex-shrink: 0;
    padding: 1rem;
    background: var(--glass-base-bg);
    border: 1px solid var(--border-color-light);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.5rem;
}

.control-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.control-group label {
    font-size: 0.9rem;
    color: var(--text-secondary);
    font-weight: 500;
    white-space: nowrap;
}

.control-group input[type="text"],
.control-group input[type="number"] {
    width: 70px;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid var(--text-placeholder);
    background-color: var(--main-content-bg-color);
    font-size: 0.9rem;
    text-align: center;
}

.control-group input:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb), 0.1);
}


/*
 * [수정] 시험지 미리보기 영역.
 * flex-grow, overflow-y, min-height 속성을 모두 제거합니다.
 * 이제 이 영역은 스크롤을 가지지 않고, 내용만큼의 높이를 차지합니다.
 */


.status-message {
    padding: 3rem 1rem;
    text-align: center;
    color: var(--text-placeholder);
    font-size: 1.1rem;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
----- ./react/pages/ProblemWorkbenchPage.css -----
/* 페이지 전체를 감싸는 루트 컨테이너 */
.problem-workbench-page {
    height: 100%;
    display: flex;
}

/* 3개의 패널을 정렬하는 flex 레이아웃 컨테이너 */
.problem-workbench-layout {
    display: flex;
    flex-direction: row; /* 기본은 가로 배치 */
    gap: 16px;
    width: 100%;
    height: 100%;
}

/* 모든 패널에 적용되는 공통 스타일 (신규 컴포넌트들에서도 사용) */
.workbench-panel {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background-color: var(--glass-base-bg, rgba(255, 255, 255, 0.8));
    border: 1px solid var(--border-color-light, #e0e0e0);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    overflow: hidden; /* [중요] 이 속성이 패널의 둥근 모서리를 지켜줌 */
}

/* 패널 헤더의 공통 스타일 */
.panel-title-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color-light, #e0e0e0);
    flex-shrink: 0;
    background-color: rgba(0, 0, 0, 0.05);
}

.panel-title {
    padding: 0;
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
}

.panel-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.panel-header-button {
    background: none;
    border: none;
    padding: 4px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    transition: background-color 0.2s, color 0.2s;
}

.panel-header-button:hover {
    background-color: rgba(0, 0, 0, 0.1);
    color: var(--text-primary);
}

/* 개별 패널 특화 스타일 (ImageManager 패널만 남음) */
.image-manager-wrapper-panel { 
    padding: 0; 
}

/* 모바일 반응형 스타일 */
@media (max-width: 768px) {
    .problem-workbench-layout {
        flex-direction: column;
    }
    .workbench-panel {
        min-height: 300px;
    }
}
----- ./react/pages/ProfileSetupPage.css -----
/* filepath: react-hono\react\pages\ProfileSetupPage.css */

.profile-setup-page-wrapper {
    position: relative;
    width: 100%;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    padding: 20px;
    box-sizing: border-box;
}

.login-background-blobs-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
}

.profile-setup-container {
    /* [통일감] LoginPage와 동일한 glassmorphism 스타일 적용 */
    background: var(--sidebar-glass-bg);
    backdrop-filter: var(--glass-blur-effect);
    -webkit-backdrop-filter: var(--glass-blur-effect);
    border: 1px solid rgba(var(--glass-base-bg-rgb), 0.2);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03);

    padding: 40px 50px;
    border-radius: var(--main-content-border-radius, 18px);
    width: 100%;
    max-width: 480px; /* [수정] 너비를 다른 카드와 유사하게 조정 */
    text-align: center;
    position: relative;
    z-index: 1;
    color: var(--text-primary);
}

.profile-setup-title {
    font-size: 2rem;
    font-weight: 600; /* [수정] 폰트 두께 조정 */
    color: var(--text-primary);
    margin-bottom: 12px;
}

.profile-setup-subtitle {
    font-size: 0.95rem; /* [수정] 폰트 크기 조정 */
    color: var(--text-secondary);
    margin-bottom: 35px; /* [수정] 하단 마진 조정 */
    line-height: 1.6;
}

.profile-setup-form {
    display: grid;
    gap: 20px; /* [수정] 그룹 간 간격 조정 */
    text-align: left;
}

.form-group {
    display: grid;
    gap: 10px; /* [수정] 라벨과 요소 간 간격 조정 */
}

.form-label {
    font-weight: 500;
    font-size: 0.9rem;
    color: var(--text-secondary);
}

.position-buttons-group {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.position-button {
    flex: 1 1 auto;
    min-width: 90px;
    padding: 10px 12px;
    /* [디자인 개선] 버튼을 더 부드러운 형태로 변경 */
    border: 1px solid rgba(255, 255, 255, 0.2);
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--text-secondary);
    border-radius: 10px; /* [수정] border-radius 통일 */
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    font-weight: 500;
    text-align: center;
    font-size: 0.9rem;
}

.position-button.active {
    background-color: var(--accent-color);
    color: var(--text-on-accent);
    border-color: var(--accent-color);
    box-shadow: 0 2px 8px rgba(var(--accent-color-rgb), 0.3);
}

.position-button:not(.active):hover {
    border-color: rgba(255, 255, 255, 0.4);
    background-color: rgba(255, 255, 255, 0.1);
}

.form-input {
    width: 100%;
    padding: 12px 16px; /* [수정] 패딩 통일 */
    /* [통일감] 다른 입력 필드와 일관성을 위해 배경색 및 테두리 수정 */
    background-color: rgba(0, 0, 0, 0.07);
    border: 1px solid transparent;
    border-radius: 12px; /* [수정] border-radius 통일 */
    font-size: 0.95rem;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}

.form-input::placeholder {
    color: var(--text-placeholder);
}

.form-input:focus {
    background-color: transparent;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.2);
}

.submit-button {
    width: 100%;
    padding: 12px 20px;
    background-color: var(--accent-color);
    color: var(--text-on-accent);
    border: none;
    border-radius: 12px; /* [수정] border-radius 통일 */
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease, opacity 0.2s ease;
    margin-top: 10px;
}

.submit-button:hover:not(:disabled) {
    background-color: var(--accent-color-darker);
}

.submit-button:disabled {
    background-color: var(--text-placeholder);
    opacity: 0.7;
    cursor: not-allowed;
}

.error-message {
    margin-top: 4px; /* [수정] 에러 메시지는 폼 그룹 아래에 바로 붙도록 */
    color: var(--notification-badge-bg);
    font-size: 0.8rem; /* [수정] 폰트 크기 조정 */
    font-weight: 500;
    text-align: left; /* [수정] 왼쪽 정렬 */
}

.error-message.api-error {
    text-align: center;
    margin-top: 15px;
    font-size: 0.875rem;
}


@media (max-width: 480px) {
    .profile-setup-container {
        padding: 30px 25px;
    }

    .profile-setup-title {
        font-size: 1.8rem;
    }

    .profile-setup-subtitle {
        font-size: 0.9rem;
        margin-bottom: 25px;
    }

    .position-button {
        font-size: 0.85rem;
    }

    .form-input {
        padding: 10px 14px;
        font-size: 0.9rem;
    }

    .submit-button {
        padding: 10px 18px;
        font-size: 0.95rem;
    }
}
----- ./react/shared/components/GlassPopover.css -----
/* client/src/components/common/popover/GlassPopover.css */
.glass-popover {
    background: var(--sidebar-glass-bg);
    backdrop-filter: var(--glass-blur-effect);
    -webkit-backdrop-filter: var(--glass-blur-effect);
    border-radius: 12px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.22);
    padding: 0;
    z-index: 1100;
    min-width: 180px;
    max-width: 320px;
    box-sizing: border-box;
    overflow: hidden;

    /* [핵심 수정] 애니메이션 방식을 visibility 대신 opacity, transform, pointer-events로 변경 */
    opacity: 0;
    transform: scale(0.95) translateY(-5px); /* 작아졌다가 나타나는 효과 */
    pointer-events: none; /* 숨겨져 있을 때 클릭 이벤트 통과 */
    transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-popover.open {
    opacity: 1;
    transform: scale(1) translateY(0); /* 원래 크기로 복귀 */
    pointer-events: auto; /* 보이면서 클릭 가능하도록 변경 */
}

/* Textarea 등 넓은 콘텐츠를 위한 Popover 크기 확장 */
.glass-popover.large {
    min-width: 600px;
    max-width: calc(100vw - 40px);
}

.glass-popover .popover-content {
    color: var(--text-primary);
}

.glass-popover ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.glass-popover li a,
.glass-popover li button {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 9px 12px;
    text-decoration: none;
    color: var(--text-secondary);
    border-radius: 6px;
    transition: background-color 0.15s ease-out, color 0.15s ease-out;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
}

.glass-popover li a:hover,
.glass-popover li button:hover {
    background-color: var(--menu-item-hover-bg);
    color: var(--text-primary);
}

.glass-popover li svg {
    margin-right: 10px;
    color: var(--icon-color);
    flex-shrink: 0;
}

.glass-popover li a:hover svg,
.glass-popover li button:hover svg {
    color: var(--icon-active-color);
}
----- ./react/shared/components/workbench/CodeEditorPanel.css -----
/* ./react/shared/components/workbench/CodeEditorPanel.css */

/* workbench-panel, panel-title-container 등 공통 스타일은 ProblemWorkbenchPage.css에서 가져옵니다. */

.editor-panel .panel-content {
    padding: 0;
    overflow: hidden;
}

.editor-panel .cm-scroller {
    overflow-y: auto !important;
}
----- ./react/shared/components/workbench/PreviewPanel.css -----
/* ./react/shared/components/workbench/PreviewPanel.css */

/* workbench-panel, panel-title-container 등 공통 스타일은 ProblemWorkbenchPage.css에서 가져옵니다. */

.preview-content-wrapper {
    padding: 16px;
}
----- ./react/shared/ui/actionbutton/ActionButton.css -----
/* react/shared/ui/actionbutton/ActionButton.css */

/* [복원] 가장 기본적인 버튼 스타일로 되돌립니다. */
.action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px; /* 기본 패딩 */
    border-radius: 8px; /* 기본 둥근 모서리 */
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s ease-in-out;
    white-space: nowrap;
    background-color: var(--menu-item-hover-bg, rgba(0, 0, 0, 0.05));
    color: var(--text-secondary);
}

.action-button:hover:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.1);
    color: var(--text-primary);
}

/* [복원] Primary 버튼 스타일 (강조) */
.action-button.primary {
    background-color: var(--accent-color);
    color: var(--text-on-accent);
    border-color: transparent;
}

.action-button.primary:hover:not(:disabled) {
    background-color: var(--accent-color-darker);
}

/* [복원] Secondary (또는 outline) 버튼 스타일 */
.action-button.secondary {
    background-color: transparent;
    color: var(--text-secondary);
    border-color: var(--text-placeholder);
}

.action-button.secondary:hover:not(:disabled) {
    background-color: var(--menu-item-hover-bg);
    border-color: var(--accent-color);
    color: var(--accent-color-darker);
}

.action-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: var(--text-placeholder);
    color: var(--text-on-accent);
    border-color: transparent;
}
----- ./react/shared/ui/Badge/Badge.css -----
/* shared/ui/Badge/Badge.css */
.badge {
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 0.85em;
    font-weight: 500;
    display: inline-block;
    line-height: 1.2;
    text-align: center;
    white-space: nowrap;
    /* 기본 배경색이나 글자색은 여기서 정의하지 않거나, 매우 중립적인 색으로 정의 */
    /* background-color: #e9ecef; */
    /* color: #495057; */
}
----- ./react/shared/ui/glasstable/GlassTable.css -----
/* ./react/shared/ui/glasstable/GlassTable.css */

.glass-table-wrapper {
    width: 100%;
    box-sizing: border-box;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px) saturate(150%);
    -webkit-backdrop-filter: blur(10px) saturate(150%);
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    display: flex;
}

.glass-table-caption {
    display: block;
    font-size: 1.1em;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 15px;
    padding-left: 5px;
    text-align: left;
}

.glass-table-scroll-container {
    width: 100%;
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
    cursor: grab;
}

.glass-table-scroll-container.dragging {
    cursor: grabbing;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.glass-table-scroll-container::-webkit-scrollbar {
    height: 8px;
    background: transparent;
}

.glass-table-scroll-container::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
}

.glass-table-scroll-container::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.3);
}

.glass-table {
    width: 100%;
    min-width: max-content;
    border-collapse: collapse;
    color: var(--text-secondary);
    font-size: 0.9em;
}

.glass-table th,
.glass-table td {
    padding: 0;
    vertical-align: middle;
    border-bottom: 1px solid rgba(129, 127, 127, 0.1);
    white-space: nowrap;
}

.glass-table td:first-child .cell-content {
    justify-content: center;
}

.glass-table thead {
    background: rgba(0, 0, 0, 0.05);
}

.glass-table th {
    font-size: 0.9em;
    font-weight: 400;
    color: var(--text-primary);
    position: sticky;
    top: 0;
    z-index: 1;
}

.glass-table tbody tr:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.loading-cell,
.empty-cell {
    text-align: center !important;
    padding: 40px 15px !important;
    color: var(--text-placeholder);
    font-style: italic;
}

.loading-cell .spinner {
    border: 3px solid rgba(255, 255, 255, 0.2);
    border-top: 3px solid var(--accent-color);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    animation: spin 1s linear infinite;
    margin: 0 auto 10px auto;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.glass-table th.sortable {
  cursor: pointer;
}

.glass-table .sort-header-button {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 100%;
  justify-content: flex-start;
}

.glass-table .sort-header-button:hover {
  color: var(--text-color-primary-strong, #000);
}

.glass-table .sort-arrow {
  flex-shrink: 0;
  transition: opacity 0.2s;
}

.cell-content {
    padding: 12px 15px;
    height: 100%;
    display: flex;
    align-items: center;
}

/* ===== 고정 컬럼(Sticky Column) 스타일 ===== */
.glass-table th.sticky-col,
.glass-table td.sticky-col {
  position: -webkit-sticky;
  position: sticky;
  background: none;
}

.glass-table td.sticky-col .cell-content,
.glass-table th.sticky-col .cell-content {
  background: rgba(var(--glass-base-bg-rgb), 0.85);
  backdrop-filter: var(--glass-blur-effect);
  -webkit-backdrop-filter: var(--glass-blur-effect);
  /* [수정] 배경 요소가 클릭 이벤트를 통과시킴 */
  pointer-events: none;
}

/* 
[최종 수정]
직계 자식 선택자(>) 대신 자손 선택자(공백)를 사용하여
.cell-content 내부의 모든 중첩된 요소들이 클릭 이벤트를 받을 수 있도록 복원합니다.
*/
.glass-table .sticky-col .cell-content * {
    pointer-events: auto;
}

.glass-table tbody tr:hover td.sticky-col .cell-content {
    background: linear-gradient(rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.04)),
                rgba(var(--glass-base-bg-rgb), 0.85);
}

.glass-table th.sticky-col {
  z-index: 3; 
}
.glass-table td.sticky-col {
  z-index: 2;
}

.glass-table th.sticky-col .cell-content {
    background: linear-gradient(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05)),
                rgba(var(--glass-base-bg-rgb), 0.85);
}

.glass-table .first-sticky-col {
  left: 0;
  box-shadow: 4px 0 8px -4px rgba(0, 0, 0, 0.15);
}

.glass-table .last-sticky-col {
  right: 0;
  box-shadow: -4px 0 8px -4px rgba(0, 0, 0, 0.15);
}
----- ./react/shared/ui/popover-content/PopoverContent.css -----
/* react-hono\react\shared\ui\popover-content\PopoverContent.css */

/* Popover 내용물의 기본 컨테이너 스타일 */
.edit-popover-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: auto; 
    min-width: 320px; /* 기본 최소 너비 */
    max-height: 80vh; /* 화면을 넘지 않도록 최대 높이 제한 */
    overflow-y: auto; /* 내용이 많아지면 스크롤 */
    resize: none; 
}

/* Popover 내부의 폼 그룹 (라벨 + 입력 필드) */
.edit-popover-content .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

/* Popover 내부 라벨 */
.edit-popover-content label {
    font-weight: 500;
    font-size: 0.9rem;
    color: var(--text-secondary);
    flex-shrink: 0;
}

/* Popover 내부 입력 필드 공통 스타일 */
.popover-input {
    width: 100%;
    background-color: rgba(0, 0, 0, 0.07); 
    border: 1px solid transparent;
    border-radius: 10px;
    padding: 12px 16px; /* [핵심 수정] input 자체의 내부 좌우 패딩을 다시 적용합니다. */
    font-size: 0.95rem;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
    font-family: var(--base-font-family);
    box-sizing: border-box;
}

.popover-input:focus {
    background-color: transparent; 
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.2);
}

/* Popover 하단 액션 버튼 그룹 */
.edit-popover-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.5rem;
    flex-shrink: 0;
}

/* --- Textarea 전용 스타일 --- */

/* Textarea가 포함된 큰 Popover를 위한 스타일 */
.glass-popover.large .edit-popover-content {
    width: 600px;
    height: 400px;
    resize: both; /* 사용자가 크기 조절 가능하게 */
    overflow: hidden; /* 내부에서 스크롤을 관리하므로 popover 자체는 숨김 */
    padding-bottom: 0;
    min-width: 450px; /* 사용자가 조절할 수 있는 최소 크기 */
    min-height: 300px;
}

/* Textarea와 버튼을 감싸는 컨테이너 */
.textarea-container {
    flex-grow: 1;
    position: relative;
    display: flex;
    min-height: 0;
    background-color: rgba(0, 0, 0, 0.07);
    border: 1px solid transparent;
    border-radius: 10px;
    transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}

.textarea-container:focus-within {
    background-color: transparent; 
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.2);
}

/* Textarea 자체 스타일 */
.popover-textarea {
    resize: none; 
    width: 100%;
    height: 100%;
    padding: 12px;
    padding-bottom: 50px; /* 하단 버튼 공간 확보 */
    box-sizing: border-box;
    color: var(--text-primary);
    font-size: 0.95rem;
    font-family: var(--base-font-family);
    line-height: 1.6;
    outline: none;
    border: none;
    background-color: transparent;
    min-width: 0;
}

/* Textarea 위의 액션 버튼 위치 조정 */
.edit-popover-actions.on-textarea {
    position: absolute;
    bottom: 8px;
    right: 8px;
    margin-top: 0;
    z-index: 10;
}

/* --- Combobox(선택) 전용 스타일 --- */
.edit-popover-content.combobox-content {
    padding: 0.5rem;
    gap: 0.25rem;
    width: auto;
    min-width: 180px;
}

.combobox-label {
    padding: 0.5rem 0.5rem 0.25rem;
    font-weight: 600;
    color: var(--text-primary);
}

.combobox-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 8px 12px;
    border-radius: 6px;
    border: none;
    background-color: transparent;
    text-align: left;
    cursor: pointer;
    color: var(--text-secondary);
}

.combobox-option:hover {
    background-color: var(--menu-item-hover-bg);
    color: var(--text-primary);
}

.combobox-option[aria-selected="true"] {
    background-color: var(--menu-item-active-bg);
    color: var(--menu-item-active-text);
    font-weight: 500;
}

.combobox-option .check-icon {
    color: var(--menu-item-active-text);
    flex-shrink: 0;
}

.combobox-option .option-label {
    flex-grow: 1;
}
----- ./react/widgets/ExamPreviewWidget.css -----
/* react/widgets/ExamPreviewWidget.css */

.exam-preview-widget {
    width: 100%;
}

.exam-preview-widget .page-container {
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 1.5rem;
}
.exam-preview-widget .page-container:last-child {
    margin-bottom: 0;
}
----- ./react/widgets/ProblemSelectionWidget.css -----
/* ./react/widgets/ProblemSelectionWidget.css */

.problem-selection-widget {
    /* [핵심] 위젯 자체를 Flexbox 컨테이너로 설정 */
    display: flex;
    flex-direction: column; /* 자식 요소(헤더, 테이블)를 세로로 쌓음 */
    
    /* [핵심] 부모(.selection-widget-container)의 높이를 100% 채움 */
    height: 100%;
    
    /* 나머지 디자인 스타일 */
    overflow: hidden; /* 위젯 자체의 스크롤은 방지 */
    background-color: var(--glass-base-bg);
    border: 1px solid var(--border-color-light);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.selection-header {
    padding: 12px 16px;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color-light);
    flex-shrink: 0; /* 헤더는 높이가 줄어들지 않도록 고정 */
}

/* 
 * [핵심] 테이블을 감싸는 컨테이너
 * 이 컨테이너가 헤더를 제외한 모든 남는 공간을 차지하고,
 * 내부에서 GlassTable이 스크롤되도록 만듭니다.
 */
.selection-table-container {
    flex-grow: 1;  /* 부모(.problem-selection-widget)의 남는 공간을 모두 차지 */
    min-height: 0; /* flex item이 부모보다 작아질 수 있도록 하는 필수 속성 */
    overflow: hidden; /* 이 컨테이너 자체는 스크롤되지 않음 (중요) */
    display: flex; /* 자식인 GlassTable이 높이를 100% 채울 수 있도록 */
    flex-direction: column; /* 자식을 세로로 쌓기 위함 */
}

/* 
 * [핵심] GlassTable 컴포넌트를 직접 감싸는 래퍼
 * (GlassTable.tsx 내부의 .glass-table-wrapper)
 * 이 래퍼가 높이를 100% 채우고, 내부의 스크롤 컨테이너를 제어합니다.
 */
.selection-table-container .glass-table-wrapper {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
}

/* 
 * [핵심] GlassTable의 실제 스크롤 영역
 * (GlassTable.tsx 내부의 .glass-table-scroll-container)
 * 이 영역이 남는 공간을 채우고, 가로/세로 스크롤을 모두 담당합니다.
 * 이 영역은 이제 세로 스크롤도 담당해야 합니다.
 */
.selection-table-container .glass-table-scroll-container {
    flex-grow: 1;
    overflow: auto; /* 가로/세로 스크롤 모두 자동 처리 */
}

/* --- 기존 기타 스타일 (유지) --- */
.keyword-badge {
    display: inline-block;
    background-color: rgba(var(--accent-color-rgb), 0.1);
    color: var(--accent-color-darker);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.8rem;
    margin: 2px;
}
----- ./react/widgets/rootlayout/BackgroundBlobs.css -----
.blobs-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  overflow: hidden;
}

.blob-item {
  position: absolute;
  opacity: 0.28;
  /* 이전(0.20)보다 opacity를 높여서 더 잘 보이도록 */
  pointer-events: none;
  border-radius: 50%;
  left: 0;
}

/* 연한 갈색/베이지/샌드 계열로 색상 변경 */
.blob-item.blob-1 {
  width: 28vw;
  /* 크기 약간 조정 */
  height: 28vw;
  /* 연한 베이지/샌드 */
  background: radial-gradient(circle, rgba(220, 200, 180, 0.6), rgba(200, 180, 160, 0.35));
  top: -10%;
  /* 위치 미세 조정 */
  transform: translateX(-28vw) rotate(0deg);
  animation: flowAcrossCircle1 13s linear infinite;
  /* 속도 미세 조정 */
}

.blob-item.blob-2 {
  width: 38vw;
  /* 크기 약간 조정 */
  height: 38vw;
  /* 부드러운 카라멜/라떼 */
  background: radial-gradient(circle, rgba(210, 180, 150, 0.55), rgba(190, 160, 130, 0.3));
  top: 35%;
  /* 위치 미세 조정 */
  transform: translateX(-38vw) rotate(0deg);
  animation: flowAcrossCircle2 16s linear infinite;
  animation-delay: -4s;
}

.blob-item.blob-3 {
  width: 22vw;
  /* 크기 약간 조정 */
  height: 22vw;
  /* 따뜻한 모카/옅은 황토색 */
  background: radial-gradient(circle, rgba(200, 170, 140, 0.65), rgba(180, 150, 120, 0.4));
  top: 60%;
  /* 위치 미세 조정 */
  transform: translateX(-22vw) rotate(0deg);
  animation: flowAcrossCircle3 11s linear infinite;
  animation-delay: -7s;
}

.blob-item.blob-4 {
  width: 32vw;
  /* 크기 약간 조정 */
  height: 32vw;
  /* 차분한 토프/그레이지 (회색빛이 도는 갈색) */
  background: radial-gradient(circle, rgba(190, 180, 170, 0.5), rgba(170, 160, 150, 0.28));
  top: 20%;
  /* 위치 미세 조정 */
  transform: translateX(-32vw) rotate(0deg);
  animation: flowAcrossCircle1 15s linear infinite;
  /* 애니메이션 재활용 */
  animation-delay: -9s;
}

/* 애니메이션 키프레임 (이전과 동일 또는 필요시 미세 조정) */
@keyframes flowAcrossCircle1 {
  0% {
    transform: translateX(-28vw) translateY(-6vh) scale(0.92);
    /* 이동 범위 및 스케일 미세 조정 */
  }

  50% {
    transform: translateX(36vw) translateY(4vh) scale(1.03);
    /* 이동 범위 및 스케일 미세 조정 */
  }

  100% {
    transform: translateX(100vw) translateY(-3vh) scale(0.98);
    /* 이동 범위 및 스케일 미세 조정 */
  }
}

@keyframes flowAcrossCircle2 {
  0% {
    transform: translateX(-38vw) translateY(4vh) scale(0.98);
  }

  50% {
    transform: translateX(31vw) translateY(-8vh) scale(0.88);
  }

  100% {
    transform: translateX(100vw) translateY(1vh) scale(1.01);
  }
}

@keyframes flowAcrossCircle3 {
  0% {
    transform: translateX(-22vw) translateY(1vh) scale(1.01);
  }

  50% {
    transform: translateX(39vw) translateY(9vh) scale(1.08);
  }

  100% {
    transform: translateX(100vw) translateY(3vh) scale(0.95);
  }
}
----- ./react/widgets/rootlayout/GlassNavbar.css -----
/* client/src/components/rootlayout/GlassNavbar.css */
.glass-navbar {
    width: 100%;
    height: var(--navbar-height);
    padding: 0 13px;
    box-sizing: border-box;
    background: var(--navbar-glass-bg);
    backdrop-filter: var(--glass-blur-effect);
    -webkit-backdrop-filter: var(--glass-blur-effect);
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    z-index: 100;
    color: var(--text-primary);

    position: fixed;
    top: 0;
    left: 0;
}

.navbar-left,
.navbar-right {
    display: flex;
    align-items: center;
    gap: 8px; /* [수정] 아이콘들 사이의 기본 간격 */
}

.navbar-logo-link {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: var(--text-primary);
    padding: 5px;
    border-radius: 6px;
    transition: background-color 0.2s ease;
}

.navbar-logo-link:hover {
    background-color: var(--menu-item-hover-bg);
}

.navbar-logo-icon {
    color: var(--accent-color);
}


.navbar-icon-button {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    transition: background-color 0.2s ease-out, color 0.2s ease-out;
}

.navbar-icon-button:hover {
    background-color: var(--menu-item-hover-bg);
    color: var(--text-primary);
}

.navbar-icon-button.active {
    background-color: rgba(var(--accent-color-rgb), 0.1);
    color: var(--accent-color-darker);
}

.hamburger-button {
    display: none;
}

/* [추가] 모바일 오른쪽 액션 버튼 그룹 스타일 */
.mobile-right-actions {
    display: flex;
    align-items: center;
    gap: 8px; /* 액션 버튼들 사이의 간격 */
}

.profile-button svg {
    color: var(--text-secondary);
}

.profile-button:hover svg {
    color: var(--text-primary);
}

@media (max-width: 1024px) and (min-width: 769px) {
    .glass-navbar {
        padding: 0 20px;
    }

    .profile-button {
        margin-left: auto;
    }
}

/* 모바일 반응형 스타일 (768px 이하) */
@media (max-width: 768px) {
    .glass-navbar {
        padding: 0 10px;
        height: var(--navbar-height-mobile);
    }

    .hamburger-button {
        display: flex;
    }

    .navbar-logo-link {
        margin-left: 6px;
    }

    .profile-button {
        display: flex;
    }
}
----- ./react/widgets/rootlayout/GlassSidebar.css -----
/* filepath: c:\Users\nicew\Desktop\fullstack\monorepo\client\src\components\rootlayout\GlassSidebar.css */
.glass-sidebar {
    width: var(--sidebar-width);
    height: 100%;
    padding: 15px 0;
    box-sizing: border-box;
    background: var(--sidebar-glass-bg);
    backdrop-filter: var(--glass-blur-effect);
    -webkit-backdrop-filter: var(--glass-blur-effect);
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 90;
    color: var(--text-secondary);
    font-weight: 500;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.12) transparent;
    transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
}

/* ... (기존 .glass-sidebar::-webkit-scrollbar 등 스타일 유지) ... */
.glass-sidebar::-webkit-scrollbar {
    width: 6px;
}

.glass-sidebar::-webkit-scrollbar-track {
    background: transparent;
}

.glass-sidebar::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.15);
    border-radius: 3px;
}

.glass-sidebar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.25);
}

.sidebar-header.lgs-header {
    font-size: 11px;
    color: var(--text-placeholder);
    padding: 0 15px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    min-height: 32px;
}

.glass-sidebar:not(.collapsed):not(.mobile-sidebar) .sidebar-header.lgs-header {
    justify-content: center;
    margin-bottom: 18px;
}

/* .glass-sidebar.mobile-sidebar .sidebar-header.lgs-header 는 @media 규칙 안으로 이동 */

.sidebar-header-text {
    font-weight: 600;
}

.glass-sidebar.collapsed .sidebar-header.lgs-header {
    justify-content: center;
    padding: 0 5px;
    min-height: 40px;
    margin-bottom: 10px;
}

.tablet-toggle-button-wrapper {
    display: flex;
    justify-content: center;
    padding: 5px 0;
    margin-bottom: 10px;
}

.glass-sidebar:not(.collapsed) .tablet-toggle-button-wrapper {
    justify-content: flex-end;
    padding-right: 15px;
}

.sidebar-toggle-button.left-sidebar-toggle.tablet-control {
    position: static;
    display: flex;
    align-items: center;
    justify-content: center;
    width: auto;
    min-width: 44px;
    height: 36px;
    padding: 0 10px;
    border-radius: 7px;
    background-color: rgba(var(--accent-color-rgb), 0.08);
    color: var(--accent-color-darker);
    border: 1px solid rgba(var(--accent-color-rgb), 0.2);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    transition: background-color 0.15s ease-out, box-shadow 0.15s ease-out;
    outline: none;
}

.sidebar-toggle-button.left-sidebar-toggle.tablet-control:hover {
    background-color: rgba(var(--accent-color-rgb), 0.15);
    box-shadow: 0 2px 5px rgba(var(--accent-color-rgb), 0.2);
}

.sidebar-toggle-button.left-sidebar-toggle.tablet-control:focus-visible {
    box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb), 0.5);
}

.sidebar-nav.lgs-nav {
    flex-grow: 1;
    padding: 0 10px;
}

.sidebar-nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.sidebar-nav li {
    margin-bottom: 2px;
}

.menu-item-link {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 10px 12px;
    border-radius: 7px;
    text-decoration: none;
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.15s ease-out, color 0.15s ease-out, box-shadow 0.15s ease-out;
    position: relative;
    overflow: hidden;
    white-space: nowrap;
}

.menu-item-link:hover {
    background-color: var(--menu-item-hover-bg);
    color: var(--text-primary);
}

.menu-item-link.active {
    background-color: var(--menu-item-active-bg);
    color: var(--menu-item-active-text);
    font-weight: 600;
}

.menu-icon-wrapper {
    margin-right: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    color: var(--icon-color);
    transition: color 0.15s ease-out;
}

.menu-item-link:hover .menu-icon-wrapper,
.menu-item-link.active .menu-icon-wrapper {
    color: var(--icon-active-color);
}

.menu-item-name {
    flex-grow: 1;
    line-height: 1.35;
}

.sub-menu-item-link .menu-icon-wrapper {
    margin-left: 18px;
}

.notification-badge {
    background-color: var(--notification-badge-bg);
    color: var(--notification-badge-text);
    font-size: 10px;
    font-weight: bold;
    padding: 2.5px 6.5px;
    border-radius: 10px;
    margin-left: auto;
    line-height: 1;
    flex-shrink: 0;
}

.glass-sidebar.collapsed {
    width: var(--sidebar-collapsed-width);
    padding: 15px 0;
}

.glass-sidebar.collapsed .sidebar-nav.lgs-nav {
    padding: 0 5px;
}

.glass-sidebar.collapsed .menu-item-link {
    justify-content: center;
    padding: 12px 8px;
}

.glass-sidebar.collapsed .menu-icon-wrapper {
    margin-right: 0;
}

.glass-sidebar.collapsed .menu-item-name,
.glass-sidebar.collapsed .notification-badge {
    display: none;
}

.glass-sidebar.collapsed .sub-menu-item-link .menu-icon-wrapper {
    margin-left: 0;
}

/* 모바일 닫기 버튼 (공통 스타일로 분리 가능) */
.sidebar-close-button.mobile-only {
    display: none;
    /* 기본적으로 숨김, 모바일에서 .lgs-close-btn 등으로 display: flex; */
    background: transparent;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    transition: background-color 0.15s ease-out;
}

.sidebar-close-button.mobile-only:hover {
    background-color: var(--menu-item-hover-bg);
}


@media (max-width: 768px) {

    /* .mobile-sidebar 클래스는 App.css에서 공통 레이아웃을 제공 */
    .glass-sidebar.mobile-sidebar.left-mobile-sidebar {
        /* App.css의 .mobile-sidebar 스타일 상속 (position, top, height, z-index, box-shadow, overflow-y) */
        width: var(--mobile-sidebar-width-ratio);
        max-width: var(--mobile-sidebar-max-width);
        background: var(--mobile-sidebar-glass-bg);
        backdrop-filter: var(--glass-blur-effect);
        -webkit-backdrop-filter: var(--glass-blur-effect);
        border-top-right-radius: 16px;
        border-bottom-right-radius: 16px;
        padding: 20px 0;
        /* 수직 패딩, 수평은 내부 요소에서 */

        left: 0;
        transform: translateX(-100%);
        /* 초기 상태: 왼쪽 화면 바깥 */
        opacity: 0;
        pointer-events: none;
        /* 초기에는 클릭/터치 불가 */
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
            opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    .glass-sidebar.mobile-sidebar.left-mobile-sidebar.open {
        transform: translateX(0);
        /* 열린 상태: 제자리 */
        opacity: 1;
        pointer-events: auto;
        /* 열리면 상호작용 가능 */
    }

    .glass-sidebar.mobile-sidebar .sidebar-header.lgs-header {
        justify-content: space-between;
        /* 모바일에서 헤더 정렬 */
        margin-bottom: 15px;
        padding: 0 20px;
        /* 모바일 헤더 내부 패딩 */
        min-height: 40px;
    }

    .glass-sidebar.mobile-sidebar .sidebar-header-text {
        font-size: 0.95em;
        color: var(--text-primary);
    }

    .glass-sidebar.mobile-sidebar .tablet-toggle-button-wrapper {
        display: none;
    }

    .glass-sidebar.mobile-sidebar .sidebar-nav.lgs-nav {
        padding: 0 15px;
    }

    .glass-sidebar.mobile-sidebar .menu-item-link {
        font-size: 14.5px;
        padding: 12px 15px;
    }

    .glass-sidebar.mobile-sidebar .menu-icon-wrapper {
        margin-right: 15px;
    }

    .glass-sidebar.mobile-sidebar .menu-item-name,
    .glass-sidebar.mobile-sidebar .notification-badge {
        display: inline-block;
    }

    .sidebar-close-button.mobile-only.lgs-close-btn {
        display: flex;
        /* 모바일에서 닫기 버튼 표시 */
    }
}
----- ./react/widgets/rootlayout/GlassSidebarRight.css -----
/* filepath: ./react/widgets/rootlayout/GlassSidebarRight.css */
.glass-sidebar-right {
    width: var(--sidebar-right-width);
    height: 100%;
    padding: 15px 0;
    box-sizing: border-box;
    background: var(--sidebar-glass-bg);
    backdrop-filter: var(--glass-blur-effect);
    -webkit-backdrop-filter: var(--glass-blur-effect);
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 90;
    flex-shrink: 0;
    transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
}

.glass-sidebar-right.expanded {
    width: var(--sidebar-right-expanded-width);
    align-items: flex-start;
}

/* 
  [핵심 수정]
  부모인 .app-container에 .right-sidebar-extra-wide 클래스가 있을 때,
  자식인 .glass-sidebar-right.expanded의 너비를 재정의하도록 선택자를 수정합니다.
*/
.app-container.right-sidebar-extra-wide .glass-sidebar-right.expanded {
    width: var(--sidebar-right-extra-expanded-width); /* 450px 변수가 적용됨 */
}


/* --- 데스크탑 헤더 (토글 버튼) --- */
.rgs-header-desktop {
    width: 100%;
    padding: 0 10px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}
.glass-sidebar-right.expanded .rgs-header-desktop {
    justify-content: flex-start;
    align-items: flex-start;
}

.settings-toggle-button {
    background: transparent;
    border: none;
    color: var(--icon-color);
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 8px;
    transition: background-color 0.15s ease-out, color 0.15s ease-out;
    outline: none;
}
.settings-toggle-button:hover:not(:disabled) {
    background-color: var(--menu-item-hover-bg);
    color: var(--icon-active-color);
}
.settings-toggle-button:focus-visible {
    box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb), 0.5);
}
.settings-toggle-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background-color: transparent;
    color: var(--icon-color);
}
.settings-toggle-button:disabled:hover {
    background-color: transparent;
    color: var(--icon-color);
}


/* --- 확장된 콘텐츠 영역 --- */
.expanded-content-area.rgs-content {
    flex-grow: 1;
    width: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    /* 애니메이션 */
    opacity: 0;
    transform: translateY(8px);
    animation: fadeInContentRight 0.3s 0.05s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.glass-sidebar-right:not(.expanded) .expanded-content-area.rgs-content {
    display: none;
}

@keyframes fadeInContentRight {
    to {
        opacity: 1;
        transform: translateY(0);
    }
}


/* --- 모바일 관련 스타일 --- */
.sidebar-header.rgs-mobile-header {
    width: 100%;
    margin-bottom: 15px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    min-height: 40px;
    padding: 0 5px;
    box-sizing: border-box;
}

.sidebar-close-button.mobile-only {
    display: none;
    background: transparent;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    transition: background-color 0.15s ease-out;
}
.sidebar-close-button.mobile-only:hover {
    background-color: var(--menu-item-hover-bg);
}

@media (max-width: 768px) {
    .glass-sidebar-right.mobile-sidebar.right-mobile-sidebar {
        width: var(--mobile-sidebar-width-ratio);
        max-width: var(--mobile-sidebar-max-width);
        background: var(--mobile-sidebar-glass-bg);
        backdrop-filter: var(--glass-blur-effect);
        -webkit-backdrop-filter: var(--glass-blur-effect);
        border-top-left-radius: 16px;
        border-bottom-left-radius: 16px;
        padding: 15px 0;

        right: 0;
        left: auto;
        transform: translateX(100%);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
            opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    .glass-sidebar-right.mobile-sidebar.right-mobile-sidebar.open {
        transform: translateX(0);
        opacity: 1;
        pointer-events: auto;
    }
    .glass-sidebar-right.mobile-sidebar .rgs-header-desktop {
        display: none;
    }
    .sidebar-close-button.mobile-only.rgs-close-btn {
        display: flex;
    }
    .glass-sidebar-right.mobile-sidebar .expanded-content-area.rgs-content {
        opacity: 1;
        transform: none;
        animation: none;
    }
}
----- ./react/widgets/rootlayout/RootLayout.css -----
/* ./react/widgets/rootlayout/RootLayout.css */

.main-content {
  flex-grow: 1;
  background-color: var(--main-content-bg-color);
  padding: 25px;
  padding-bottom: 25px; 
  overflow-y: auto;
  position: relative;
  z-index: 5;
  height: 100%;
  box-sizing: border-box;
  border-top-left-radius: var(--main-content-border-radius);
  border-top-right-radius: var(--main-content-border-radius);
  box-shadow: inset 0 6px 12px -6px rgba(0,0,0,.07), inset 5px 0 10px -5px rgba(0,0,0,.05), inset -5px 0 10px -5px rgba(0,0,0,.045);
  scrollbar-gutter: stable;
}

.main-content.main-content--compact-padding {
  padding-bottom: 25px; 
}

.clickable-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 105;
  background-color: rgba(var(--mobile-overlay-bg-rgb), var(--mobile-overlay-bg-opacity));
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease-in-out, visibility 0s 0.3s linear;
  cursor: pointer;
  backdrop-filter: blur(var(--mobile-overlay-blur)) saturate(100%);
  -webkit-backdrop-filter: blur(var(--mobile-overlay-blur)) saturate(100%);
}
.app-container.mobile-sidebar-active .clickable-overlay {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.3s ease-in-out, visibility 0s 0s linear;
}

.bottom-content-area {
  position: fixed;
  bottom: 0;
  z-index: 95;
  /* [수정] 좌우 패딩을 25px로 변경하여 .main-content와 맞춥니다. */
  padding: 0 25px 20px 30px;
  box-sizing: border-box;
  pointer-events: none;
  transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  /* [수정] 중앙 정렬을 제거합니다. 이제 자식 요소(.table-search-panel)가 width: 100%로 컨테이너를 채웁니다. */
  /* justify-content: center; */
  height: auto;
}

/* --- 사이드바 상태에 따른 너비 계산 --- */
/* 1. 왼쪽 확장 / 오른쪽 축소 */
.app-container.left-sidebar-expanded.right-sidebar-collapsed .bottom-content-area {
  left: var(--sidebar-width);
  width: calc(100% - var(--sidebar-width) - var(--sidebar-right-width));
}
/* 2. 왼쪽 확장 / 오른쪽 확장 */
.app-container.left-sidebar-expanded.right-sidebar-expanded .bottom-content-area {
  left: var(--sidebar-width);
  width: calc(100% - var(--sidebar-width) - var(--sidebar-right-expanded-width));
}
/* 3. 왼쪽 축소 / 오른쪽 축소 */
.app-container.left-sidebar-collapsed.right-sidebar-collapsed .bottom-content-area {
  left: var(--sidebar-collapsed-width);
  width: calc(100% - var(--sidebar-collapsed-width) - var(--sidebar-right-width));
}
/* 4. 왼쪽 축소 / 오른쪽 확장 */
.app-container.left-sidebar-collapsed.right-sidebar-expanded .bottom-content-area {
  left: var(--sidebar-collapsed-width);
  width: calc(100% - var(--sidebar-collapsed-width) - var(--sidebar-right-expanded-width));
}
/* 5. 왼쪽 확장 / 오른쪽 추가 확장 */
.app-container.left-sidebar-expanded.right-sidebar-expanded.right-sidebar-extra-wide .bottom-content-area {
    left: var(--sidebar-width);
    width: calc(100% - var(--sidebar-width) - var(--sidebar-right-extra-expanded-width));
}
/* 6. 왼쪽 축소 / 오른쪽 추가 확장 */
.app-container.left-sidebar-collapsed.right-sidebar-expanded.right-sidebar-extra-wide .bottom-content-area {
    left: var(--sidebar-collapsed-width);
    width: calc(100% - var(--sidebar-collapsed-width) - var(--sidebar-right-extra-expanded-width));
}

@media (max-width: 1024px) and (min-width: 769px) {
  .main-content {
    padding: 20px;
    padding-bottom: 20px;
  }
}
@media (max-width: 768px) {
  .main-content { padding: 15px; padding-bottom: 150px; }
  .bottom-content-area {
    left: 0 !important;
    width: 100% !important;
    padding: 0 10px 10px;
  }
}
