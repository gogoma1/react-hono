import React, { useCallback, useState, useEffect } from 'react';
import JsonProblemImporterWidget from '../widgets/json-problem-importer/JsonProblemImporterWidget';
import { ProblemSetSaveModal } from '../entities/problem-set/ui/ProblemSetSaveModal';
import { useLayoutStore, type RegisteredPageActions } from '../shared/store/layoutStore';
import { useCreateEntitlementMutation, useAddProblemsToSetMutation } from '../entities/problem-set/model/useProblemSetMutations';
import { useUploadProblemsMutation } from '../entities/problem/model/useProblemMutations';
import type { UploadResponse } from '../entities/problem/api/problemApi';
import type { Problem } from '../entities/problem/model/types';
import type { ProblemSetFinalPayload, CreateEntitlementPayload, AddProblemsToSetPayload, LibrarySelection } from '../entities/problem-set/model/types';
import { useToast } from '../shared/store/toastStore';
import MyLibrary from '../entities/problem-set/ui/MyLibrary';
import './ProblemSetCreationPage.css';
import type { OnUploadPayload } from '../features/json-problem-importer/model/useJsonProblemImporter';
import { useQueryClient } from '@tanstack/react-query';
import { GROUPED_PROBLEM_SETS_QUERY_KEY } from '../entities/problem-set/model/useProblemSetQuery';

interface UploadProblemsAndCreateSetPayload {
    problemSetName: string;
    description: string | null;
    problems: Problem[];
    grade: string | null;
    type: "PUBLIC_ADMIN" | "PRIVATE_USER";
    status: "published" | "private" | "deleted";
    copyright_type: "ORIGINAL_CREATION" | "COPYRIGHTED_MATERIAL";
    copyright_source: string | null;
}

const ProblemSetCreationPage: React.FC = () => {
    const toast = useToast();
    const queryClient = useQueryClient();
    const { registerPageActions, unregisterPageActions, setRightSidebarContent, closeRightSidebar } = useLayoutStore.getState();

    const { mutateAsync: uploadProblemsAndCreateSet, isPending: isProcessingD1 } = useUploadProblemsMutation();
    const { mutateAsync: createEntitlement, isPending: isProcessingPg } = useCreateEntitlementMutation();
    const { mutateAsync: addProblemsToSet, isPending: isAddingProblems } = useAddProblemsToSetMutation();

    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [selectedLibraryItem, setSelectedLibraryItem] = useState<LibrarySelection | null>({ key: 'new', type: 'new' });
    
    const [stagedUploadData, setStagedUploadData] = useState<OnUploadPayload | null>(null);

    const isProcessing = isProcessingD1 || isProcessingPg || isAddingProblems;

    const handleSelectionChange = useCallback((selection: LibrarySelection) => {
        setSelectedLibraryItem(selection);
    }, []);

    const handleUpload = useCallback((payload: OnUploadPayload, isNew: boolean, subtitleNameFromHook?: string) => {
        if (!selectedLibraryItem) {
            toast.error('작업 대상을 선택해주세요 (새 문제집 또는 기존 문제집).');
            return;
        }

        if (isNew) {
            if (!payload.problemSetBrand?.trim()) {
                toast.error('새로운 문제집의 브랜드를 입력해주세요.');
                return;
             }
             setStagedUploadData(payload);
             setIsSaveModalOpen(true);
        } else {
             // [핵심 수정] 기존 문제집의 '폴더' 또는 '소제목'에 문제 추가
             const targetProblemSetId = selectedLibraryItem.problemSetId;
             if (!targetProblemSetId) {
                 toast.error('문제를 추가할 문제집을 찾을 수 없습니다.');
                 return;
             }
             if (!subtitleNameFromHook) {
                 toast.error('소제목을 입력해주세요.');
                 return;
             }

            const addProblemsPayload: AddProblemsToSetPayload = {
                problems: payload.problems.map(p => ({ ...p, subtitle: subtitleNameFromHook })),
                subtitleName: subtitleNameFromHook,
                folderId: selectedLibraryItem.type === 'folder' ? selectedLibraryItem.folderId : undefined,
            };
            
            toast.info(`'${selectedLibraryItem.problemSetName}' 문제집에 '${subtitleNameFromHook}' 소제목으로 문제 ${payload.problems.length}개를 추가합니다...`);
            
            addProblemsToSet({ problemSetId: targetProblemSetId, payload: addProblemsPayload }, {
                onSuccess: () => {
                    toast.success('문제가 성공적으로 추가되었습니다.');
                    queryClient.invalidateQueries({ queryKey: [GROUPED_PROBLEM_SETS_QUERY_KEY] });
                },
                onError: (error) => {
                    toast.error(`문제 추가 실패: ${error.message}`);
                }
            });

        }
    }, [selectedLibraryItem, toast, addProblemsToSet, queryClient]);

    const handleConfirmSave = useCallback(async (modalPayload: ProblemSetFinalPayload) => {
        if (!stagedUploadData) {
            toast.error('업로드할 데이터가 없습니다. 다시 시도해주세요.');
            return;
        }

        setIsSaveModalOpen(false);
        
        const d1Payload: UploadProblemsAndCreateSetPayload = {
            problemSetName: stagedUploadData.problemSetBrand,
            description: stagedUploadData.description,
            problems: stagedUploadData.problems,
            grade: stagedUploadData.grade,
            ...modalPayload,
        };
        
        try {
            toast.info('문제집 데이터를 D1 서버에 저장합니다...');
            const d1Response: UploadResponse = await uploadProblemsAndCreateSet(d1Payload);
            
            if (!d1Response.success || !d1Response.problemSet) {
                 throw new Error(d1Response.message || "D1에 문제집 생성 실패");
            }
            toast.success(d1Response.message);

            const pgPayload: CreateEntitlementPayload = {
                problem_set_id: d1Response.problemSet.problem_set_id,
            };
            toast.info('문제집에 대한 접근 권한을 설정합니다...');
            await createEntitlement(pgPayload);
            
            toast.success('모든 작업이 성공적으로 완료되었습니다!');
            await queryClient.invalidateQueries({ queryKey: [GROUPED_PROBLEM_SETS_QUERY_KEY] });
            setStagedUploadData(null);
            
            setSelectedLibraryItem({ 
                type: 'problemSet', 
                key: `ps-${pgPayload.problem_set_id}`, 
                problemSetId: pgPayload.problem_set_id, 
                problemSetName: d1Payload.problemSetName,
            });

        } catch (error: any) {
            console.error("문제집 생성 전체 프로세스 실패:", error);
            toast.error(`작업 실패: ${error.message}`);
        }
    }, [stagedUploadData, uploadProblemsAndCreateSet, createEntitlement, toast, queryClient]);

    const handleOpenPromptSidebar = useCallback(() => setRightSidebarContent({ type: 'prompt' }), [setRightSidebarContent]);
    const handleOpenSettingsSidebar = useCallback(() => setRightSidebarContent({ type: 'settings' }), [setRightSidebarContent]);
    const handleCloseSidebar = useCallback(() => closeRightSidebar(), [closeRightSidebar]);

    useEffect(() => {
        const pageActionsToRegister: Partial<RegisteredPageActions> = {
            openPromptSidebar: handleOpenPromptSidebar,
            openSettingsSidebar: handleOpenSettingsSidebar,
            onClose: handleCloseSidebar,
        };
        registerPageActions(pageActionsToRegister);
        return () => unregisterPageActions(Object.keys(pageActionsToRegister) as (keyof RegisteredPageActions)[]);
    }, [registerPageActions, unregisterPageActions, handleOpenPromptSidebar, handleOpenSettingsSidebar, handleCloseSidebar]);

    return (
        <div className="problem-set-creation-page">
            <div className="creation-page-main-content">
                <div className="creation-page-left-panel">
                    <MyLibrary 
                        onSelectionChange={handleSelectionChange}
                        selectedKey={selectedLibraryItem?.key || null}
                    />
                </div>
                <div className="creation-page-right-panel">
                    <JsonProblemImporterWidget
                        selectedItem={selectedLibraryItem}
                        onUpload={handleUpload}
                        isProcessing={isProcessing}
                    />
                </div>
            </div>

            <ProblemSetSaveModal 
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onConfirm={handleConfirmSave}
                isConfirming={isProcessing}
                problemSetName={stagedUploadData?.problemSetBrand || ''}
                problemSetDescription={stagedUploadData?.description || undefined}
            />
        </div>
    );
};

export default ProblemSetCreationPage;