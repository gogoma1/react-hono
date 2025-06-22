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

/* [핵심 수정] 오른쪽 사이드바 너비를 계산에 포함 */
/* 데스크탑/태블릿 - 사이드바 확장 시 */
.app-container.sidebar-expanded .bottom-content-area {
  left: var(--sidebar-width);
  width: calc(100% - var(--sidebar-width) - var(--sidebar-right-width));
}

/* [핵심 수정] 오른쪽 사이드바 너비를 계산에 포함 */
/* 데스크탑/태블릿 - 사이드바 축소 시 */
.app-container.sidebar-collapsed .bottom-content-area {
  left: var(--sidebar-collapsed-width);
  width: calc(100% - var(--sidebar-collapsed-width) - var(--sidebar-right-width));
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
    transition: box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out;
    -webkit-tap-highlight-color: transparent;
}
.mobile-student-card:hover,
.mobile-student-card.active {
    border-color: rgba(var(--accent-color-rgb), 0.5);
    box-shadow: 0 4px 12px rgba(var(--accent-color-rgb), 0.15);
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
/* ===== [수정됨] 패널 전체 레이아웃 ===== */
.image-manager-panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%; /* 부모(.workbench-panel)의 높이를 100% 채움 */
    background-color: transparent; /* 배경은 부모 패널이 담당 */
    border: none; /* 테두리도 부모 패널이 담당 */
    box-shadow: none; /* 그림자도 부모 패널이 담당 */
    border-radius: 0; /* 둥근 모서리도 부모 패널이 담당 */
}

.panel-title {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color-light, #e0e0e0);
    font-size: 15px;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary);
    flex-shrink: 0; /* 높이가 줄어들지 않도록 고정 */
}

/* ===== [수정됨] 스크롤 및 테이블 레이아웃 ===== */
.panel-content {
    flex-grow: 1; /* 제목을 제외한 나머지 공간을 모두 차지 */
    overflow: auto; /* 내용이 넘칠 경우 세로/가로 스크롤 자동 생성 */
    padding: 0; /* 테이블이 꽉 차도록 패딩 제거 */
    scrollbar-gutter: stable;
}

.image-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    table-layout: fixed; /* [핵심] 셀 너비를 고정하여 가로 스크롤 문제 방지 */
}

.image-table thead {
    position: sticky; /* [핵심] 테이블 헤더 고정 */
    top: 0;
    z-index: 1;
    /* 헤더 배경은 부모 패널의 유리 효과가 비치도록 약간의 투명도 추가 */
    background-color: rgba(var(--glass-base-bg-rgb), 0.85);
    backdrop-filter: blur(4px);
}

.image-table th, .image-table td {
    padding: 10px 12px; /* 패딩 살짝 조정 */
    text-align: left;
    vertical-align: middle; /* 수직 정렬을 중앙으로 */
    border-bottom: 1px solid var(--border-color-light, #e0e0e0);
    /* [핵심] 긴 내용이 셀을 벗어나지 않도록 설정 */
    word-break: break-all; 
    overflow-wrap: break-word;
}

/* ===== [수정됨] 각 컬럼 너비 지정 ===== */
.image-table .tag-name { width: 25%; }
.image-table .preview-cell { width: 88px; } /* 미리보기는 고정 너비 */
/* 나머지 공간은 Actions 컬럼이 차지하도록 남겨둠 */


/* ... 나머지 스타일은 거의 동일 ... */

.empty-content {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 16px;
    color: var(--text-color-secondary, #777);
    font-size: 14px;
}
.empty-content code {
    background-color: rgba(0,0,0,0.05);
    padding: 2px 6px;
    border-radius: 4px;
    margin: 0 4px;
}

.image-table-row:last-child td {
    border-bottom: none;
}
.image-table-row.drag-over {
    outline: 2px dashed var(--accent-color, #3498db);
    outline-offset: -2px;
    background-color: rgba(52, 152, 219, 0.1);
}

.tag-name {
    font-weight: 500;
}

.preview-cell.draggable {
    cursor: grab;
}
.preview-cell.dragging {
    opacity: 0.4;
}

.preview-box {
    width: 64px;
    height: 64px;
    border: 1px solid #ccc;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #888;
    background-color: #f7f7f7;
    overflow: hidden;
    margin: 0 auto; /* 셀 안에서 중앙 정렬 */
}
.preview-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.actions-header { text-align: right !important; }
.actions-cell { text-align: right !important; }

.header-buttons, .actions-cell {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
}
.header-buttons {
    flex-direction: row;
    justify-content: flex-end;
}

.action-button {
    padding: 6px 12px;
    font-size: 13px;
    border: 1px solid #ccc;
    background-color: white;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
    white-space: nowrap; /* 버튼 텍스트 줄바꿈 방지 */
}
.action-button:hover:not(:disabled) {
    background-color: #f0f0f0;
}
.action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.url-display a {
    font-size: 12px;
    color: #3498db;
    text-decoration: none;
}
.url-display a:hover {
    text-decoration: underline;
}

.error-display {
    font-size: 12px;
    color: #e74c3c;
    margin-top: 4px;
}
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
    max-width: 960px;
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
    flex-direction: column; /* 버튼을 세로로 정렬 */
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
    
    /* 모바일에서는 필터와 액션 영역을 세로로 배치 */
    .filter-actions-container {
        flex-direction: column;
        align-items: stretch; /* 아이템들을 꽉 채우도록 */
        gap: 12px;
    }
    .action-controls-area {
        flex-direction: row; /* 모바일에서는 액션 버튼을 가로로 배치 */
    }
    .control-button {
        flex-grow: 1; /* 버튼들이 가로 공간을 균등하게 차지 */
        justify-content: center; /* 아이콘과 텍스트 중앙 정렬 */
    }
    .control-button span {
        font-size: 13px;
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
  --sidebar-right-expanded-width: 250px;
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
----- ./react/pages/ProblemWorkbenchPage.css -----
/* 페이지 전체를 감싸는 루트 컨테이너 */
.problem-workbench-page {
    height: 100%; /* RootLayout의 .main-content 높이를 채움 */
    display: flex; /* 내부 레이아웃 컨테이너를 정렬하기 위해 */
}

/* 3개의 패널을 정렬하는 flex 레이아웃 컨테이너 */
.problem-workbench-layout {
    display: flex;
    flex-direction: row;
    gap: 16px;
    width: 100%;
    height: 100%;
}

/* 모든 패널에 적용되는 공통 스타일 (카드/패널 UI) */
.workbench-panel {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    /* 앱의 디자인 시스템 변수를 사용하여 스타일 통일 */
    background-color: var(--glass-base-bg, rgba(255, 255, 255, 0.8));
    border: 1px solid var(--border-color-light, #e0e0e0);
    border-radius: 12px; /* 다른 패널들과 유사한 값으로 조정 */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    overflow: hidden; /* 내부 콘텐츠가 둥근 모서리를 넘지 않도록 */
}

.panel-title {
    padding: 12px 16px;
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color-light, #e0e0e0);
    flex-shrink: 0;
    background-color: rgba(0, 0, 0, 0.05);
}

/* 패널 내부의 스크롤 가능한 콘텐츠 영역 */
.panel-content {
    flex-grow: 1;
    overflow-y: auto;
    padding: 16px;
    scrollbar-gutter: stable;
}


/* === 개별 패널 특화 스타일 === */

/* 에디터 패널: CodeMirror가 자체 스크롤을 가지므로 패딩/스크롤 조정 */
.editor-panel .panel-content {
    padding: 0;
    overflow: hidden;
}

/* CodeMirror의 실제 스크롤러를 타겟팅 */
.editor-panel .cm-scroller {
    overflow-y: auto !important;
}

/* 이미지 관리 패널: ImageManager 컴포넌트가 자체 패딩을 가지므로 조정 */
.image-manager-wrapper-panel {
    /* ImageManager 컴포넌트가 자체 패널 UI를 가지므로, 래퍼의 패딩은 제거 */
    padding: 0;
}


/* === 미리보기(MathpixRenderer) 내부 스타일 (기존 코드 유지) === */

/* .prose 클래스 내부의 모든 img 태그에 적용됩니다. */
/* --- 1. 기본/가운데 정렬 (수정: #align 제외) --- */
.prose img:not([src*="#left"]):not([src*="#right"]):not([src*="#align"]) {
  display: block;
  margin-left: auto;
  margin-right: auto;
  max-width: 90%;
  border-radius: 8px;
  clear: both; 
}

/* --- 2. 왼쪽/오른쪽 Float (기존과 동일) --- */
.prose img[src*="#left"] {
  float: left;
  width: 45%;
  max-width: 350px;
  margin: 0.5em 1.5em 1em 0;
  border-radius: 8px;
}
.prose img[src*="#right"] {
  float: right;
  width: 45%;
  max-width: 350px;
  margin: 0.5em 0 1em 1.5em;
  border-radius: 8px;
}

/* --- ✅ 3. #align 을 위한 새로운 "나란히 놓기" 스타일 --- */
.prose div:has(+ div > img[src*="#align"]) {
  float: left;
  width: 55%;
  padding-right: 20px;
  box-sizing: border-box;
}

.prose div:has(> img[src*="#align"]) {
  float: right;
  width: 45%;
}

.prose div:has(> img[src*="#align"]) img {
  width: 100%;
  margin: 0;
}

/* --- 4. Float 효과 정리 (Clearfix) --- */
.prose div:has(> img[src*="#align"]) + * {
  clear: both;
}

.prose h1, .prose h2, .prose h3, .prose hr {
  clear: both;
}
----- ./react/pages/ProfileSetupPage.css -----
/* filepath: client/src/pages/ProfileSetupPage.css */

.profile-setup-page-wrapper {
    display: flex;
    min-height: 100vh;
    /* 전체 화면 높이 */
    align-items: center;
    /* 수직 중앙 정렬 */
    justify-content: center;
    /* 수평 중앙 정렬 */
    background-color: var(--app-bg-color, #fdfcfa);
    /* index.css의 앱 배경색 */
    padding: 20px;
    /* 화면 가장자리 여백 */
    box-sizing: border-box;
    position: relative;
    /* 블롭 배경을 위한 기준점 */
    overflow: hidden;
    /* 블롭이 넘치지 않도록 */
}

/* LoginPage와 동일한 블롭 배경 래퍼 스타일 재활용 */
/* LoginPage.css에 이미 정의되어 있다면, 이 부분은 중복될 수 있습니다. 
   App.css 같은 곳에 공통으로 정의하는 것이 더 좋을 수 있습니다. */
.login-background-blobs-wrapper {
    /* ProfileSetupPage.tsx 에서 이 클래스명 사용 가정 */
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    /* 콘텐츠 뒤에 위치 */
}


.profile-setup-container {
    background-color: var(--main-content-bg-color, #fefefe);
    /* 메인 콘텐츠 배경색 */
    padding: 35px 45px;
    /* 내부 패딩 (Svelte의 p-10과 유사하게) */
    border-radius: var(--main-content-border-radius, 18px);
    /* 메인 콘텐츠와 동일한 둥근 모서리 */
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05), 0 1px 4px rgba(0, 0, 0, 0.03);
    /* 부드러운 그림자 */
    width: 100%;
    max-width: 550px;
    /* Svelte 코드와 유사한 최대 너비 (sm:w-[550px]) */
    text-align: center;
    /* 내부 텍스트 기본 중앙 정렬 */
    position: relative;
    /* 블롭 배경 위에 오도록 */
    z-index: 1;
}

.profile-setup-title {
    font-size: 2rem;
    /* Svelte의 text-3xl과 유사하게 조정 */
    font-weight: 700;
    /* font-bold */
    color: var(--text-primary);
    margin-bottom: 12px;
    /* Svelte의 gap-2 와 유사 */
}

.profile-setup-subtitle {
    font-size: 1rem;
    /* Svelte의 text-lg 와 유사하게 조정 */
    color: var(--text-secondary);
    /* Svelte의 text-muted-foreground 와 유사 */
    margin-bottom: 30px;
    /* Svelte의 gap-6 중 일부 */
    line-height: 1.6;
}

.profile-setup-form {
    display: grid;
    /* Svelte의 grid */
    gap: 24px;
    /* Svelte의 gap-4 와 유사 */
    text-align: left;
    /* 폼 내부 요소는 왼쪽 정렬 */
}

.form-group {
    display: grid;
    gap: 8px;
    /* Svelte의 gap-2 (라벨과 입력 요소 사이) */
}

.form-label {
    font-weight: 500;
    font-size: 0.9rem;
    color: var(--text-secondary);
    /* Label 컴포넌트의 기본 색상과 유사하게 */
}

.position-buttons-group {
    display: flex;
    flex-wrap: wrap;
    /* 버튼이 많을 경우 줄바꿈 */
    gap: 10px;
    /* Svelte의 gap-2 */
}

.position-button {
    flex: 1 1 auto;
    /* 버튼이 유연하게 너비 차지 (Svelte의 flex-1) */
    min-width: 90px;
    /* 버튼 최소 너비 */
    padding: 10px 12px;
    /* 버튼 패딩 */
    border: 1px solid var(--text-placeholder, #d1d5db);
    /* 기본 테두리 (Input과 유사하게) */
    background-color: var(--main-content-bg-color, #fff);
    /* 기본 배경 */
    color: var(--text-secondary);
    border-radius: 8px;
    /* 둥근 모서리 */
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    font-weight: 500;
    text-align: center;
    font-size: 0.9rem;
}

.position-button.active {
    background-color: var(--accent-color, #e67e22);
    color: var(--text-on-accent, #fff);
    border-color: var(--accent-color, #e67e22);
    box-shadow: 0 2px 4px rgba(var(--accent-color-rgb), 0.2);
}

.position-button:not(.active):hover {
    border-color: var(--accent-color-darker, #d35400);
    color: var(--accent-color-darker, #d35400);
    /* background-color: rgba(var(--accent-color-rgb), 0.05); */
}

.form-input {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid var(--text-placeholder, #d1d5db);
    /* Input 컴포넌트 테두리 */
    border-radius: 8px;
    /* Input 컴포넌트 둥근 모서리 */
    font-size: 0.95rem;
    color: var(--text-primary);
    background-color: var(--app-bg-color);
    /* 입력 필드 배경 약간 다르게 */
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input::placeholder {
    color: var(--text-placeholder);
}

.form-input:focus {
    outline: none;
    border-color: var(--accent-color, #e67e22);
    box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.15);
    /* 포커스 시 강조 */
}

.submit-button {
    width: 100%;
    padding: 12px 20px;
    background-color: var(--accent-color, #e67e22);
    color: var(--text-on-accent, #fff);
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease, opacity 0.2s ease;
    margin-top: 10px;
    /* 위 요소와의 간격 */
}

.submit-button:hover:not(:disabled) {
    background-color: var(--accent-color-darker, #d35400);
}

.submit-button:disabled {
    background-color: var(--text-placeholder, #a5b1c2);
    opacity: 0.7;
    cursor: not-allowed;
}

.error-message {
    margin-top: 15px;
    /* Svelte의 mt-4 */
    color: var(--notification-badge-bg, #e74c3c);
    /* index.css의 알림 색상 또는 직접 지정 */
    font-size: 0.875rem;
    font-weight: 500;
    text-align: center;
    /* Svelte의 text-center */
}


@media (max-width: 480px) {

    /* 더 작은 화면을 위한 추가 조정 */
    .profile-setup-container {
        padding: 25px 20px;
        /* 모바일에서 패딩 축소 */
    }

    .profile-setup-title {
        font-size: 1.75rem;
        /* 모바일에서 타이틀 크기 축소 */
    }

    .profile-setup-subtitle {
        font-size: 0.9rem;
        margin-bottom: 25px;
    }

    .position-buttons-group {
        flex-direction: column;
        /* 필요시 세로 정렬 */
    }

    .position-button {
        font-size: 0.85rem;
    }

    .form-input {
        padding: 10px 12px;
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
    /* ... (기존 배경, 그림자, 패딩, z-index, 너비 등 스타일 유지) ... */
    background: var(--sidebar-glass-bg);
    backdrop-filter: var(--glass-blur-effect);
    -webkit-backdrop-filter: var(--glass-blur-effect);
    border-radius: 8px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.22);
    padding: 12px;
    z-index: 1100;
    min-width: 180px;
    max-width: 300px;
    box-sizing: border-box;

    /* 초기 상태 (나타날 때 애니메이션 기준) */
    opacity: 0;
    visibility: hidden;
    transform: translateY(0) scale(1);
    /* ★★★ 사라질 때 이 위치/크기를 기준으로 opacity만 변경 ★★★ */

    /* 트랜지션 정의 */
    transition-property: opacity, visibility;
    /* transform 애니메이션은 열릴 때만 */
    transition-duration: 0.22s, 0s;
    /* visibility는 duration 0 */
    transition-timing-function: cubic-bezier(0.32, 0.72, 0, 1), linear;
    /* 사라질 때: opacity 애니메이션(0.22s) 후 visibility 변경 */
    transition-delay: 0s, 0.22s;
}

.glass-popover.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
    /* 열렸을 때 최종 위치/크기 */

    /* 열릴 때의 transform 애니메이션 (선택적) */
    /* 만약 열릴 때도 transform 애니메이션을 주고 싶다면 아래 주석 해제 */
    /* transform: translateY(0) scale(1); */
    /* transition-property: opacity, transform, visibility; */
    /* transition-duration: 0.25s, 0.25s, 0s; */
    /* transition-timing-function: cubic-bezier(0.32, 0.72, 0, 1), cubic-bezier(0.32, 0.72, 0, 1), linear; */

    /* 열릴 때: 모든 애니메이션 지연 0s (visibility는 즉시) */
    transition-delay: 0s, 0s;
    /* transform 애니메이션 없다면 visibility 지연도 0s */
}

/* Popover 내부 콘텐츠 스타일링 (예시) */
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
    /* 아이콘과 텍스트 정렬 위해 flex 사용 */
    align-items: center;
    /* 수직 중앙 정렬 */
    width: 100%;
    padding: 9px 12px;
    /* 패딩 약간 조정 */
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
    /* 메뉴 아이템 폰트 두께 */
    line-height: 1.4;
    /* 줄 간격 */
}

.glass-popover li a:hover,
.glass-popover li button:hover {
    background-color: var(--menu-item-hover-bg);
    color: var(--text-primary);
}

/* Popover 내부 아이콘 스타일 (ProfileMenuContent.tsx 에서 사용 시) */
.glass-popover li svg {
    /* 아이콘의 일반적인 스타일 */
    margin-right: 10px;
    /* vertical-align: bottom; /* flex 사용 시 불필요 */
    color: var(--icon-color);
    /* 아이콘 색상 변수 사용 */
    flex-shrink: 0;
    /* 아이콘 크기 유지 */
}

.glass-popover li a:hover svg,
.glass-popover li button:hover svg {
    color: var(--icon-active-color);
    /* 호버 시 아이콘 색상 */
}
----- ./react/shared/ui/actionbutton/ActionButton.css -----
/* react/shared/ui/actionbutton/ActionButton.css */
.action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;

    /* 원형 버튼 크기 및 모양 */
    width: 56px;
    height: 56px;
    border-radius: 50%; /* 요청하신 원형 스타일 */

    /* 주조색(Accent Color)을 사용한 배경 */
    background: linear-gradient(145deg, var(--accent-color), var(--accent-color-darker));
    color: var(--text-on-accent); /* 배경색 위의 텍스트/아이콘 색상 */
    
    /* 입체감을 위한 그림자 */
    box-shadow: 0 4px 12px rgba(var(--accent-color-rgb), 0.3), 
                0 1px 3px rgba(0, 0, 0, 0.1);

    /* 부드러운 전환 효과 */
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-button svg {
    /* 내부 아이콘 크기는 버튼 크기에 맞춰 조정 */
    width: 24px;
    height: 24px;
}

/* 호버 시 인터랙션 효과 */
.action-button:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 20px rgba(var(--accent-color-rgb), 0.35),
                0 2px 6px rgba(0, 0, 0, 0.1);
}

/* 클릭 시 인터랙션 효과 */
.action-button:active:not(:disabled) {
    transform: translateY(0) scale(1);
    box-shadow: 0 2px 6px rgba(var(--accent-color-rgb), 0.3);
}

/* 비활성화 상태 */
.action-button:disabled {
    background: var(--text-placeholder); /* 비활성화 색상 */
    color: rgba(255, 255, 255, 0.7);
    box-shadow: none;
    cursor: not-allowed;
    transform: none;
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
/* filepath: c:\Users\nicew\Desktop\fullstack\monorepo\client\src\components\rootlayout\GlassSidebarRight.css */
.glass-sidebar-right {
    width: var(--sidebar-right-width);
    height: 100%;
    padding: 15px 0; /* 🌟 좌우 패딩 제거, 상하 패딩 유지 */
    box-sizing: border-box;
    background: var(--sidebar-glass-bg);
    backdrop-filter: var(--glass-blur-effect);
    -webkit-backdrop-filter: var(--glass-blur-effect);
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 90;
    flex-shrink: 0;
    transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1); /* padding 전환 제거 */
    overflow: hidden;
}

.glass-sidebar-right.expanded {
    width: var(--sidebar-right-expanded-width);
    align-items: flex-start;
    /* 🌟 padding: 15px; 제거됨. 각 내부 요소가 패딩을 관리. */
}

/* --- 데스크탑 헤더 (토글 버튼) --- */
.rgs-header-desktop {
    width: 100%;
    padding: 0 10px; /* 🌟 좌우 패딩 유지 */
    box-sizing: border-box;
    display: flex;
    /* [수정] flex 방향을 세로로 변경 */
    flex-direction: column;
    /* [수정] 아이콘들을 가운데 정렬 (축소 상태) */
    align-items: center;
    /* [신규] 아이콘 사이의 간격 추가 */
    gap: 10px;
}
.glass-sidebar-right.expanded .rgs-header-desktop {
    justify-content: flex-start;
    /* [핵심 수정] flex-direction: column 이므로, align-items로 수평 정렬. flex-start는 왼쪽 정렬을 의미합니다. */
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
    overflow: hidden; /* 🌟 이 컨테이너 자체는 스크롤하지 않음 */
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


/* 
  🌟🌟🌟 [핵심 수정] 🌟🌟🌟
  내부 스크롤이 필요한 컴포넌트(예: StudentRegistrationForm의 최상위 div)가
  이 클래스를 가지도록 하여 스크롤과 패딩을 제어합니다.
  하지만 이미 StudentRegistrationForm.css에서 .registration-form 이 이 역할을 하고 있으므로
  해당 파일에서 직접 수정하는 것이 더 좋습니다.
*/


/* --- 모바일 관련 스타일 --- */
.sidebar-header.rgs-mobile-header {
    width: 100%;
    margin-bottom: 15px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    min-height: 40px;
    padding: 0 5px; /* 모바일 헤더 패딩 */
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
        padding: 15px 0; /* 🌟 좌우 패딩 제거 */

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
  /* [핵심] 검색바가 fixed이므로, 스크롤을 맨 아래로 내렸을 때 콘텐츠가 가려지지 않도록 하단 패딩 확보 */
  padding-bottom: 150px; 
  overflow-y: auto;
  position: relative;
  z-index: 5;
  height: 100%;
  box-sizing: border-box;
  border-top-left-radius: var(--main-content-border-radius);
  border-top-right-radius: var(--main-content-border-radius);
  box-shadow: inset 0 6px 12px -6px rgba(0,0,0,.07), inset 5px 0 10px -5px rgba(0,0,0,.05), inset -5px 0 10px -5px rgba(0,0,0,.045);
  scrollbar-gutter: stable;
  /* flex 관련 속성 제거 */
}

/* ProblemWorkbenchPage에만 적용되는 특별 스타일 재정의 */
.main-content.main-content--compact-padding {
  padding-bottom: 25px; /* ProblemWorkbenchPage에서는 하단 패딩을 기본값으로 줄임 */
}

/* ... 오버레이 스타일은 동일하게 유지 ... */
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

/* [핵심] 화면 하단 고정 오버레이 래퍼 */
.bottom-content-area {
  position: fixed;
  bottom: 0;
  z-index: 95;
  padding: 0 20px 20px; /* 패널의 좌우, 하단 간격 */
  box-sizing: border-box;
  pointer-events: none; /* 래퍼 자체는 클릭되지 않도록 */
  transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex; /* 내부 패널 중앙 정렬을 위해 */
  justify-content: center; /* 내부 패널 중앙 정렬 */

  /* [수정] 이 한 줄이 모든 문제를 해결합니다! */
  /* 이제 이 div는 내용물의 높이만큼만 차지하여 더 이상 테이블을 덮지 않습니다. */
  height: auto;
}

/* --- 사이드바 상태에 따른 4가지 케이스의 위치/너비 계산 --- */
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

/* ... 반응형 스타일 ... */
@media (max-width: 1024px) and (min-width: 769px) {
  .main-content {
    padding: 20px;
    padding-bottom: 150px;
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
