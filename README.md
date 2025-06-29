
```
react-hono
├─ api
│  ├─ db
│  │  └─ schema.pg.ts
│  ├─ index.ts
│  └─ routes
│     ├─ manage
│     │  ├─ problems.ts
│     │  └─ student.ts
│     ├─ middleware
│     │  └─ auth.middleware.ts
│     ├─ profiles
│     │  └─ profiles.ts
│     └─ r2
│        └─ image.ts
├─ drizzle
│  ├─ 0000_robust_mandroid.sql
│  ├─ 0001_elite_outlaw_kid.sql
│  └─ meta
│     ├─ 0000_snapshot.json
│     ├─ 0001_snapshot.json
│     └─ _journal.json
├─ drizzle.config.ts
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
│  │  ├─ exam
│  │  │  └─ ui
│  │  │     ├─ ExamHeader.tsx
│  │  │     ├─ ExamPage.css
│  │  │     ├─ ExamPage.tsx
│  │  │     ├─ QuickAnswerPage.tsx
│  │  │     └─ SolutionPage.tsx
│  │  ├─ problem
│  │  │  ├─ api
│  │  │  │  └─ problemApi.ts
│  │  │  └─ model
│  │  │     ├─ types.ts
│  │  │     ├─ useProblemMutations.ts
│  │  │     └─ useProblemsQuery.ts
│  │  └─ student
│  │     ├─ api
│  │     │  └─ studentApi.ts
│  │     ├─ model
│  │     │  └─ useStudentDataWithRQ.ts
│  │     └─ ui
│  │        ├─ StudentDisplay.tsx
│  │        ├─ StudentDisplayDesktop.css
│  │        ├─ StudentDisplayDesktop.tsx
│  │        ├─ StudentDisplayMobile.css
│  │        └─ StudentDisplayMobile.tsx
│  ├─ features
│  │  ├─ exam-header-editing
│  │  │  └─ ui
│  │  │     └─ ExamHeaderEditPopover.tsx
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
│  │  ├─ popovermenu
│  │  │  └─ ProfileMenuContent.tsx
│  │  ├─ problem-publishing
│  │  │  ├─ hooks
│  │  │  │  └─ useHeightMeasurer.ts
│  │  │  ├─ index.ts
│  │  │  └─ model
│  │  │     ├─ examLayoutEngine.ts
│  │  │     ├─ examLayoutStore.ts
│  │  │     ├─ problemPublishingStore.ts
│  │  │     ├─ useExamLayoutManager.ts
│  │  │     ├─ useProblemPublishing.ts
│  │  │     └─ useProblemPublishingPage.ts
│  │  ├─ problem-text-editing
│  │  │  └─ ui
│  │  │     ├─ ProblemMetadataEditor.tsx
│  │  │     ├─ ProblemTextEditor.css
│  │  │     └─ ProblemTextEditor.tsx
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
│  │  ├─ DashBoard.tsx
│  │  ├─ HomePage.tsx
│  │  ├─ JsonRendererPage.css
│  │  ├─ JsonRendererPage.tsx
│  │  ├─ LoginPage.css
│  │  ├─ LoginPage.tsx
│  │  ├─ LoginPageWithErrorDisplay.tsx
│  │  ├─ ProblemPublishingPage.css
│  │  ├─ ProblemPublishingPage.tsx
│  │  ├─ ProblemWorkbenchPage.css
│  │  ├─ ProblemWorkbenchPage.tsx
│  │  ├─ ProfileSetupPage.css
│  │  ├─ ProfileSetupPage.tsx
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
│  │  │  └─ useVisibleColumns.ts
│  │  ├─ lib
│  │  │  ├─ AuthInitializer.tsx
│  │  │  ├─ axiosInstance.ts
│  │  │  ├─ ProtectedRoute.tsx
│  │  │  └─ supabase.ts
│  │  ├─ store
│  │  │  ├─ authStore.ts
│  │  │  ├─ layout.config.ts
│  │  │  ├─ layoutStore.ts
│  │  │  └─ uiStore.ts
│  │  └─ ui
│  │     ├─ actionbutton
│  │     │  ├─ ActionButton.css
│  │     │  └─ ActionButton.tsx
│  │     ├─ Badge
│  │     │  ├─ Badge.css
│  │     │  └─ Badge.tsx
│  │     ├─ codemirror-editor
│  │     │  ├─ codemirror-setup
│  │     │  │  ├─ auto-complete
│  │     │  │  │  ├─ auto-completions.ts
│  │     │  │  │  ├─ configure.ts
│  │     │  │  │  └─ dictionary.ts
│  │     │  │  ├─ basic-setup.ts
│  │     │  │  ├─ decorations
│  │     │  │  │  ├─ index.ts
│  │     │  │  │  ├─ mark-text.ts
│  │     │  │  │  └─ math-decorations.ts
│  │     │  │  ├─ helpers.ts
│  │     │  │  ├─ interfaces.ts
│  │     │  │  ├─ markdown-parser
│  │     │  │  │  ├─ block-math-config.ts
│  │     │  │  │  ├─ block-multiMath-config.ts
│  │     │  │  │  ├─ block-yaml-config.ts
│  │     │  │  │  ├─ consts.ts
│  │     │  │  │  ├─ index.ts
│  │     │  │  │  ├─ inline-image-config.ts
│  │     │  │  │  ├─ inline-latex-config.ts
│  │     │  │  │  ├─ inline-latex-footnotes.ts
│  │     │  │  │  ├─ inline-math-config.ts
│  │     │  │  │  ├─ inline-multiMath-config.ts
│  │     │  │  │  ├─ markdown.ts
│  │     │  │  │  └─ wrapped-TeXParser.ts
│  │     │  │  └─ theme
│  │     │  │     └─ index.ts
│  │     │  ├─ editor-style.scss
│  │     │  └─ Editor.tsx
│  │     ├─ glasstable
│  │     │  ├─ GlassTable.css
│  │     │  └─ GlassTable.tsx
│  │     ├─ loadingbutton
│  │     │  ├─ LoadingButton.css
│  │     │  └─ LoadingButton.tsx
│  │     ├─ MathpixRenderer.tsx
│  │     ├─ modal
│  │     │  ├─ Modal.css
│  │     │  └─ Modal.tsx
│  │     ├─ popover-content
│  │     │  └─ PopoverContent.css
│  │     └─ TableCellCheckbox
│  │        └─ TableCellCheckbox.tsx
│  └─ widgets
│     ├─ ExamPreviewWidget.css
│     ├─ ExamPreviewWidget.tsx
│     ├─ json-problem-importer
│     │  └─ JsonProblemImporterWidget.tsx
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
│     ├─ student-table
│     │  └─ StudentTableWidget.tsx
│     └─ UserDetailsButton.tsx
├─ tsconfig.app.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ tsconfig.worker.json
├─ vite.config.js
└─ worker-configuration.d.ts

```