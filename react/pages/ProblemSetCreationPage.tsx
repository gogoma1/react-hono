import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import JsonProblemImporterWidget from '../widgets/json-problem-importer/JsonProblemImporterWidget';
import { ProblemSetSaveModal } from '../entities/problem-set/ui/ProblemSetSaveModal';
import { useLayoutStore, type RegisteredPageActions } from '../shared/store/layoutStore';
import { useCreateEntitlementMutation } from '../entities/problem-set/model/useProblemSetMutations';
import { useUploadProblemsMutation } from '../entities/problem/model/useProblemMutations';
import type { UploadResponse } from '../entities/problem/api/problemApi';
import type { Problem } from '../entities/problem/model/types';
import type { ProblemSetFinalPayload, CreateEntitlementPayload } from '../entities/problem-set/model/types';
import { useToast } from '../shared/store/toastStore';
import MyLibrary from '../entities/problem-set/ui/MyLibrary';
import './ProblemSetCreationPage.css';

interface UploadProblemsAndCreateSetPayload {
    problemSetName: string;
    description: string | null;
    problems: Problem[];
    type: "PUBLIC_ADMIN" | "PRIVATE_USER";
    status: "published" | "private" | "deleted";
    copyright_type: "ORIGINAL_CREATION" | "COPYRIGHTED_MATERIAL";
    copyright_source: string | null;
}

const ProblemSetCreationPage: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { registerPageActions, unregisterPageActions, setRightSidebarContent, closeRightSidebar } = useLayoutStore.getState();

    const { mutateAsync: uploadProblemsAndCreateSet, isPending: isProcessingD1 } = useUploadProblemsMutation();
    const { mutateAsync: createEntitlement, isPending: isProcessingPg } = useCreateEntitlementMutation();
    
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    
    const [stagedProblems, setStagedProblems] = useState<Problem[]>([]);
    const [stagedProblemSetName, setStagedProblemSetName] = useState('');
    const [stagedDescription, setStagedDescription] = useState<string | null>(null);

    const isProcessing = isProcessingD1 || isProcessingPg;

    const handleStageForSave = useCallback((problems: Problem[], problemSetName: string, description: string | null) => {
        if (!problemSetName.trim()) {
            toast.error('새로운 문제집의 이름을 먼저 입력해주세요.');
            return;
        }
        if (!problems || problems.length === 0) {
            toast.error('업로드할 문제가 없습니다. JSON 데이터에 유효한 문제가 있는지 확인해주세요.');
            return;
        }

        setStagedProblems(problems);
        setStagedProblemSetName(problemSetName);
        setStagedDescription(description);
        setIsSaveModalOpen(true);
    }, []);

    const handleConfirmSave = useCallback(async (modalPayload: ProblemSetFinalPayload) => {
        setIsSaveModalOpen(false);
        
        const d1Payload: UploadProblemsAndCreateSetPayload = {
            problemSetName: stagedProblemSetName,
            description: stagedDescription,
            problems: stagedProblems,
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
            setTimeout(() => navigate('/problem-publishing'), 1500);

        } catch (error: any) {
            console.error("문제집 생성 전체 프로세스 실패:", error);
            toast.error(`작업 실패: ${error.message}`);
        }
    }, [stagedProblems, stagedProblemSetName, stagedDescription, uploadProblemsAndCreateSet, createEntitlement, navigate, toast]);

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
                        onProblemSetSelect={() => toast.info("이 페이지에서는 새로 만들기만 가능합니다.")} 
                        selectedId={'new'} 
                        onInitiateNew={() => {}}
                    />
                </div>
                <div className="creation-page-right-panel">
                    <JsonProblemImporterWidget
                        isCreatingNew={true}
                        initialProblemSetName={''}
                        onUpload={handleStageForSave}
                        isProcessing={isProcessing}
                        selectedProblemSetId={'new'}
                    />
                </div>
            </div>

            <ProblemSetSaveModal 
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onConfirm={handleConfirmSave}
                isConfirming={isProcessing}
                problemSetName={stagedProblemSetName}
                problemSetDescription={stagedDescription || undefined}
            />
        </div>
    );
};

export default ProblemSetCreationPage;