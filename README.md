
```
react-hono
├─ api
│  ├─ db
│  │  ├─ schema.d1.ts
│  │  ├─ schema.marketplace.d1.ts
│  │  └─ schema.pg.ts
│  ├─ index.ts
│  ├─ manage
│  │  └─ teacher
│  └─ routes
│     ├─ account
│     │  └─ settings.ts
│     ├─ exam
│     │  ├─ assignments.ts
│     │  ├─ index.ts
│     │  └─ submissions.ts
│     ├─ manage
│     │  ├─ academies.ts
│     │  ├─ permissions.ts
│     │  ├─ problem-sets.ts
│     │  ├─ problems.ts
│     │  ├─ student.ts
│     │  └─ teacher.ts
│     ├─ middleware
│     │  ├─ auth.middleware.ts
│     │  └─ permission.ts
│     ├─ profiles
│     │  ├─ profiles.ts
│     │  └─ settings.ts
│     └─ r2
│        └─ image.ts
├─ drizzle
│  ├─ 0000_mixed_doctor_strange.sql
│  ├─ 0001_unique_raza.sql
│  ├─ 0002_melodic_zeigeist.sql
│  └─ meta
│     ├─ 0000_snapshot.json
│     ├─ 0001_snapshot.json
│     ├─ 0002_snapshot.json
│     └─ _journal.json
├─ drizzle.config.d1.ts
├─ drizzle.config.marketplace.d1.ts
├─ drizzle.config.pg.ts
├─ drizzle_d1
│  ├─ 0000_long_moon_knight.sql
│  ├─ 0001_thin_blue_marvel.sql
│  ├─ 0002_spooky_tenebrous.sql
│  ├─ 0003_glorious_expediter.sql
│  └─ meta
│     ├─ 0000_snapshot.json
│     ├─ 0001_snapshot.json
│     ├─ 0002_snapshot.json
│     ├─ 0003_snapshot.json
│     └─ _journal.json
├─ drizzle_d1_log
│  ├─ 0000_daffy_thena.sql
│  ├─ 0001_nostalgic_thaddeus_ross.sql
│  └─ meta
│     ├─ 0000_snapshot.json
│     ├─ 0001_snapshot.json
│     └─ _journal.json
├─ drizzle_d1_marketplace
│  ├─ 0000_next_abomination.sql
│  └─ meta
│     ├─ 0000_snapshot.json
│     └─ _journal.json
├─ env-example.txt
├─ eslint.config.js
├─ index.html
├─ package-lock.json
├─ package.json
├─ public
│  ├─ cursors
│  │  ├─ grab.svg
│  │  └─ grabbing.svg
│  └─ mathpix-markdown-it.bundle.js
├─ react
│  ├─ App.css
│  ├─ App.tsx
│  ├─ entities
│  │  ├─ academy
│  │  │  ├─ api
│  │  │  │  └─ academyApi.ts
│  │  │  └─ model
│  │  │     ├─ types.ts
│  │  │     └─ useAcademiesQuery.ts
│  │  ├─ exam
│  │  │  └─ ui
│  │  │     ├─ ExamHeader.tsx
│  │  │     ├─ ExamPage.css
│  │  │     ├─ ExamPage.tsx
│  │  │     ├─ MobileExamProblem.css
│  │  │     ├─ MobileExamProblem.tsx
│  │  │     ├─ QuickAnswerPage.tsx
│  │  │     └─ SolutionPage.tsx
│  │  ├─ exam-assignment
│  │  │  ├─ api
│  │  │  │  └─ examAssignmentApi.ts
│  │  │  └─ model
│  │  │     └─ useMyAssignmentQuery.ts
│  │  ├─ exam-report
│  │  │  ├─ api
│  │  │  │  └─ examReportApi.ts
│  │  │  ├─ model
│  │  │  │  ├─ analyzer.ts
│  │  │  │  ├─ types.ts
│  │  │  │  └─ useExamReportQuery.ts
│  │  │  └─ ui
│  │  │     ├─ DifficultyAnalysisCard.css
│  │  │     ├─ DifficultyAnalysisCard.tsx
│  │  │     ├─ MetacognitionAnalysisCard.css
│  │  │     ├─ MetacognitionAnalysisCard.tsx
│  │  │     ├─ MetacognitionBadge.css
│  │  │     ├─ MetacognitionBadge.tsx
│  │  │     ├─ ReportProblemItem.css
│  │  │     ├─ ReportProblemItem.tsx
│  │  │     ├─ TimeAnalysisCard.css
│  │  │     └─ TimeAnalysisCard.tsx
│  │  ├─ exam-set
│  │  │  ├─ api
│  │  │  │  └─ examSetApi.ts
│  │  │  └─ model
│  │  │     └─ useExamSetMutations.ts
│  │  ├─ problem
│  │  │  ├─ api
│  │  │  │  └─ problemApi.ts
│  │  │  └─ model
│  │  │     ├─ types.ts
│  │  │     ├─ useProblemMutations.ts
│  │  │     └─ useProblemsQuery.ts
│  │  ├─ profile
│  │  │  ├─ api
│  │  │  │  └─ profileApi.ts
│  │  │  ├─ model
│  │  │  │  ├─ role-groups.ts
│  │  │  │  ├─ types.ts
│  │  │  │  ├─ useProfileQuery.ts
│  │  │  │  └─ useProfileSetup.ts
│  │  │  └─ ui
│  │  │     ├─ ProfileSetupForm.css
│  │  │     ├─ ProfileSetupForm.tsx
│  │  │     ├─ ProfileSetupInput.css
│  │  │     ├─ ProfileSetupInput.tsx
│  │  │     └─ regionData.ts
│  │  ├─ staff
│  │  │  ├─ api
│  │  │  │  └─ staffApi.ts
│  │  │  └─ model
│  │  │     ├─ types.ts
│  │  │     └─ useStaffData.ts
│  │  └─ student
│  │     ├─ api
│  │     │  └─ studentApi.ts
│  │     ├─ model
│  │     │  ├─ types.ts
│  │     │  └─ useStudentDataWithRQ.ts
│  │     └─ ui
│  │        ├─ StudentDisplay.tsx
│  │        ├─ StudentDisplayDesktop.css
│  │        ├─ StudentDisplayDesktop.tsx
│  │        ├─ StudentDisplayMobile.css
│  │        └─ StudentDisplayMobile.tsx
│  ├─ features
│  │  ├─ academy-search
│  │  │  └─ ui
│  │  │     ├─ AcademySearch.css
│  │  │     └─ AcademySearch.tsx
│  │  ├─ account-settings
│  │  │  ├─ model
│  │  │  │  └─ useAccountSettings.ts
│  │  │  └─ ui
│  │  │     ├─ AccountDeactivationPanel.tsx
│  │  │     ├─ AccountSettingsModal.css
│  │  │     ├─ AccountSettingsModal.tsx
│  │  │     ├─ AccountSettingsPanels.css
│  │  │     ├─ FormPanels.css
│  │  │     └─ ProfileInfoPanel.tsx
│  │  ├─ conditional-nav
│  │  │  └─ ui
│  │  │     └─ MobileExamsNavLink.tsx
│  │  ├─ exam-header-editing
│  │  │  └─ ui
│  │  │     └─ ExamHeaderEditPopover.tsx
│  │  ├─ exam-timer-display
│  │  │  └─ ui
│  │  │     ├─ ExamTimerDisplay.css
│  │  │     └─ ExamTimerDisplay.tsx
│  │  ├─ image-upload
│  │  │  ├─ api
│  │  │  │  └─ imageApi.ts
│  │  │  ├─ model
│  │  │  │  ├─ useImageUploadManager.ts
│  │  │  │  └─ useImageUploadWithRQ.ts
│  │  │  └─ ui
│  │  │     ├─ ImageManager.css
│  │  │     └─ ImageManager.tsx
│  │  ├─ json-problem-importer
│  │  │  ├─ model
│  │  │  │  └─ useJsonProblemImporter.ts
│  │  │  └─ ui
│  │  │     └─ EditPopoverContent.tsx
│  │  ├─ json-viewer
│  │  │  └─ ui
│  │  │     ├─ JsonViewerPanel.css
│  │  │     └─ JsonViewerPanel.tsx
│  │  ├─ kakaologin
│  │  │  └─ ui
│  │  │     ├─ SignInPanel.tsx
│  │  │     └─ SignOutButton.tsx
│  │  ├─ latex-help
│  │  │  ├─ model
│  │  │  │  └─ useLatexHelpManager.ts
│  │  │  └─ ui
│  │  │     ├─ LatexHelpPanel.css
│  │  │     └─ LatexHelpPanel.tsx
│  │  ├─ mobile-exam-session
│  │  │  ├─ model
│  │  │  │  ├─ mobileExamAnswerStore.ts
│  │  │  │  ├─ mobileExamSessionStore.ts
│  │  │  │  ├─ mobileExamTimeStore.ts
│  │  │  │  └─ useExamSubmit.ts
│  │  │  ├─ ui
│  │  │  │  └─ MboileProblemNavBar.tsx
│  │  │  └─ utils
│  │  │     └─ examResultAnalyzer.ts
│  │  ├─ omr-marking
│  │  │  ├─ index.ts
│  │  │  └─ ui
│  │  │     ├─ mobileOmrMarkingCard.css
│  │  │     └─ mobileOmrMarkingCard.tsx
│  │  ├─ popovermenu
│  │  │  ├─ ProfileMenuContent.css
│  │  │  └─ ProfileMenuContent.tsx
│  │  ├─ problem-publishing
│  │  │  ├─ hooks
│  │  │  │  ├─ useExamHeaderState.ts
│  │  │  │  ├─ useExamPreviewManager.ts
│  │  │  │  ├─ useHeightMeasurer.ts
│  │  │  │  ├─ usePdfGenerator.ts
│  │  │  │  ├─ useProblemEditor.ts
│  │  │  │  └─ usePublishingPageSetup.ts
│  │  │  ├─ index.ts
│  │  │  └─ model
│  │  │     ├─ examLayoutEngine.ts
│  │  │     ├─ examLayoutStore.ts
│  │  │     ├─ problemPublishingSelectionStore.ts
│  │  │     ├─ problemPublishingStore.ts
│  │  │     ├─ useExamLayoutManager.ts
│  │  │     ├─ useProblemPublishing.ts
│  │  │     ├─ useProblemPublishingPage.ts
│  │  │     └─ useProblemSelection.ts
│  │  ├─ problem-text-editing
│  │  │  └─ ui
│  │  │     ├─ ProblemMetadataEditor.tsx
│  │  │     ├─ ProblemTextEditor.css
│  │  │     └─ ProblemTextEditor.tsx
│  │  ├─ profile-role-management
│  │  │  ├─ model
│  │  │  │  └─ useAddRole.ts
│  │  │  └─ ui
│  │  │     ├─ AddRolePanel.css
│  │  │     ├─ AddRolePanel.tsx
│  │  │     └─ RoleAcademyForm.tsx
│  │  ├─ prompt-collection
│  │  │  ├─ model
│  │  │  │  └─ usePromptManager.ts
│  │  │  └─ ui
│  │  │     ├─ PromptCollection.css
│  │  │     ├─ PromptCollection.tsx
│  │  │     └─ PromptMemo.tsx
│  │  ├─ row-selection
│  │  │  └─ model
│  │  │     └─ useRowSelection.ts
│  │  ├─ selected-students-viewer
│  │  │  └─ ui
│  │  │     ├─ SelectedStudentsPanel.css
│  │  │     └─ SelectedStudentsPanel.tsx
│  │  ├─ staff-registration
│  │  │  ├─ model
│  │  │  │  └─ useStaffRegistration.ts
│  │  │  └─ ui
│  │  │     └─ StaffRegistrationForm.tsx
│  │  ├─ student-actions
│  │  │  └─ ui
│  │  │     ├─ StudentActionButtons.css
│  │  │     └─ StudentActionButtons.tsx
│  │  ├─ student-dashboard
│  │  │  ├─ index.ts
│  │  │  └─ model
│  │  │     └─ useStudentDashboard.ts
│  │  ├─ student-editing
│  │  │  └─ ui
│  │  │     └─ StudentEditForm.tsx
│  │  ├─ student-registration
│  │  │  └─ ui
│  │  │     ├─ CategoryInput.css
│  │  │     ├─ CategoryInput.tsx
│  │  │     ├─ StudentRegistrationForm.css
│  │  │     └─ StudentRegistrationForm.tsx
│  │  ├─ student-status-changer
│  │  │  └─ ui
│  │  │     ├─ StudentStatusChanger.css
│  │  │     └─ StudentStatusChanger.tsx
│  │  ├─ table-column-toggler
│  │  │  └─ ui
│  │  │     ├─ TableColumnToggler.css
│  │  │     └─ TableColumnToggler.tsx
│  │  └─ table-search
│  │     ├─ model
│  │     │  └─ useTableSearch.ts
│  │     └─ ui
│  │        ├─ TableSearch.css
│  │        └─ TableSearch.tsx
│  ├─ index.css
│  ├─ main.tsx
│  ├─ pages
│  │  ├─ DashBoard.css
│  │  ├─ DashBoard.tsx
│  │  ├─ ExamReportPage.css
│  │  ├─ ExamReportPage.tsx
│  │  ├─ HomePage.css
│  │  ├─ HomePage.tsx
│  │  ├─ LoginPage.css
│  │  ├─ LoginPage.tsx
│  │  ├─ LoginPageWithErrorDisplay.css
│  │  ├─ LoginPageWithErrorDisplay.tsx
│  │  ├─ MobileExamPage.css
│  │  ├─ MobileExamPage.tsx
│  │  ├─ PdfOptionsModal.css
│  │  ├─ ProblemPublishingPage.css
│  │  ├─ ProblemPublishingPage.tsx
│  │  ├─ ProblemSetManagerPage.css
│  │  ├─ ProblemSetManagerPage.tsx
│  │  ├─ ProblemWorkbenchPage.css
│  │  ├─ ProblemWorkbenchPage.tsx
│  │  ├─ ProfileSetupPage.tsx
│  │  ├─ PublishedExamsPage.css
│  │  ├─ PublishedExamsPage.tsx
│  │  ├─ StudentDetailPage.css
│  │  └─ StudentDetailPage.tsx
│  ├─ shared
│  │  ├─ api
│  │  │  └─ api.utils.ts
│  │  ├─ components
│  │  │  ├─ GlassPopover.css
│  │  │  ├─ GlassPopover.tsx
│  │  │  └─ workbench
│  │  │     ├─ CodeEditorPanel.css
│  │  │     ├─ CodeEditorPanel.tsx
│  │  │     ├─ PreviewPanel.css
│  │  │     └─ PreviewPanel.tsx
│  │  ├─ hooks
│  │  │  ├─ useColumnPermissions.ts
│  │  │  ├─ useContinuousChange.ts
│  │  │  ├─ useDragToScroll.ts
│  │  │  ├─ useFuseSearch.ts
│  │  │  └─ useVisibleColumns.ts
│  │  ├─ lib
│  │  │  ├─ AuthInitializer.tsx
│  │  │  ├─ ProtectedRoute.tsx
│  │  │  └─ supabase.ts
│  │  ├─ store
│  │  │  ├─ authStore.ts
│  │  │  ├─ columnSettingsStore.ts
│  │  │  ├─ layout.config.ts
│  │  │  ├─ layoutStore.ts
│  │  │  ├─ modalStore.ts
│  │  │  ├─ problemSetStudentStore.ts
│  │  │  ├─ toastStore.ts
│  │  │  └─ uiStore.ts
│  │  ├─ ui
│  │  │  ├─ actionbutton
│  │  │  │  ├─ ActionButton.css
│  │  │  │  └─ ActionButton.tsx
│  │  │  ├─ Badge
│  │  │  │  ├─ Badge.css
│  │  │  │  └─ Badge.tsx
│  │  │  ├─ card
│  │  │  │  ├─ Card.css
│  │  │  │  └─ Card.tsx
│  │  │  ├─ charts
│  │  │  │  ├─ LineChart.tsx
│  │  │  │  ├─ SimpleBarChart.css
│  │  │  │  └─ SimpleBarChart.tsx
│  │  │  ├─ codemirror-editor
│  │  │  │  ├─ codemirror-setup
│  │  │  │  │  ├─ auto-complete
│  │  │  │  │  │  ├─ auto-completions.ts
│  │  │  │  │  │  ├─ configure.ts
│  │  │  │  │  │  └─ dictionary.ts
│  │  │  │  │  ├─ basic-setup.ts
│  │  │  │  │  ├─ decorations
│  │  │  │  │  │  ├─ index.ts
│  │  │  │  │  │  ├─ mark-text.ts
│  │  │  │  │  │  └─ math-decorations.ts
│  │  │  │  │  ├─ helpers.ts
│  │  │  │  │  ├─ interfaces.ts
│  │  │  │  │  ├─ markdown-parser
│  │  │  │  │  │  ├─ block-math-config.ts
│  │  │  │  │  │  ├─ block-multiMath-config.ts
│  │  │  │  │  │  ├─ block-yaml-config.ts
│  │  │  │  │  │  ├─ consts.ts
│  │  │  │  │  │  ├─ index.ts
│  │  │  │  │  │  ├─ inline-image-config.ts
│  │  │  │  │  │  ├─ inline-latex-config.ts
│  │  │  │  │  │  ├─ inline-latex-footnotes.ts
│  │  │  │  │  │  ├─ inline-math-config.ts
│  │  │  │  │  │  ├─ inline-multiMath-config.ts
│  │  │  │  │  │  ├─ markdown.ts
│  │  │  │  │  │  └─ wrapped-TeXParser.ts
│  │  │  │  │  └─ theme
│  │  │  │  │     └─ index.ts
│  │  │  │  ├─ editor-style.scss
│  │  │  │  └─ Editor.tsx
│  │  │  ├─ glasstable
│  │  │  │  ├─ GlassTable.css
│  │  │  │  └─ GlassTable.tsx
│  │  │  ├─ loadingbutton
│  │  │  │  ├─ LoadingButton.css
│  │  │  │  └─ LoadingButton.tsx
│  │  │  ├─ MathpixRenderer.tsx
│  │  │  ├─ modal
│  │  │  │  ├─ Modal.css
│  │  │  │  └─ Modal.tsx
│  │  │  ├─ popover-content
│  │  │  │  └─ PopoverContent.css
│  │  │  ├─ ratings
│  │  │  │  ├─ StarRating.css
│  │  │  │  └─ StarRating.tsx
│  │  │  ├─ TableCellCheckbox
│  │  │  │  └─ TableCellCheckbox.tsx
│  │  │  └─ toast
│  │  │     ├─ Toast.css
│  │  │     └─ Toast.tsx
│  │  └─ utils
│  │     └─ problem.utils.ts
│  └─ widgets
│     ├─ exam-report
│     │  ├─ index.ts
│     │  ├─ styles.css
│     │  └─ ui
│     │     └─ ExamReportProblemListWidget.tsx
│     ├─ ExamPreviewWidget.css
│     ├─ ExamPreviewWidget.tsx
│     ├─ FilteredProblemHeader
│     │  ├─ FilteredProblemHeader.css
│     │  └─ FilteredProblemHeader.tsx
│     ├─ json-problem-importer
│     │  └─ JsonProblemImporterWidget.tsx
│     ├─ mobile-exam-loader
│     │  └─ ui
│     │     ├─ AssignmentList.css
│     │     └─ AssignmentList.tsx
│     ├─ mobile-exam-view
│     │  ├─ MobileExamView.css
│     │  ├─ MobileExamView.tsx
│     │  └─ useMobileExamSync.ts
│     ├─ ProblemSelectionContainer.tsx
│     ├─ ProblemSelectionWidget.css
│     ├─ ProblemSelectionWidget.tsx
│     ├─ PublishingToolbarWidget.css
│     ├─ PublishingToolbarWidget.tsx
│     ├─ rootlayout
│     │  ├─ BackgroundBlobs.css
│     │  ├─ BackgroundBlobs.tsx
│     │  ├─ GlassNavbar.css
│     │  ├─ GlassNavbar.tsx
│     │  ├─ GlassSidebar.css
│     │  ├─ GlassSidebar.tsx
│     │  ├─ GlassSidebarRight.css
│     │  ├─ GlassSidebarRight.tsx
│     │  ├─ RootLayout.css
│     │  └─ RootLayout.tsx
│     ├─ staff-management
│     │  ├─ StaffManagementWidget.css
│     │  └─ StaffManagementWidget.tsx
│     ├─ student-table
│     │  ├─ StudentTableWidget.css
│     │  └─ StudentTableWidget.tsx
│     ├─ toast-container
│     │  └─ ToastContainer.tsx
│     └─ UserDetailsButton.tsx
├─ touch
├─ tsconfig.app.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ tsconfig.worker.json
├─ vite.config.js
└─ worker-configuration.d.ts

```