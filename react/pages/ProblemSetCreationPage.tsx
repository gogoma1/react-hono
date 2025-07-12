import React, { useCallback, useEffect, useState, useMemo } from 'react';
import JsonProblemImporterWidget from '../widgets/json-problem-importer/JsonProblemImporterWidget';
import './ProblemSetCreationPage.css';
import { useLayoutStore, type RegisteredPageActions } from '../shared/store/layoutStore';
import { useMyProblemSetsQuery } from '../entities/problem-set/model/useProblemSetQuery';

const ProblemSetCreationPage: React.FC = () => { 
    const { registerPageActions, unregisterPageActions, setRightSidebarContent, closeRightSidebar } = useLayoutStore.getState();
    
    const { data: myProblemSets, isLoading, isError } = useMyProblemSetsQuery();
    const [selectedProblemSetId, setSelectedProblemSetId] = useState<string>('new');

    const isCreatingNew = useMemo(() => selectedProblemSetId === 'new', [selectedProblemSetId]);
    
    const selectedProblemSetInfo = useMemo(() => {
        if (isCreatingNew || !myProblemSets) return null;
        return myProblemSets.find(p => p.problem_set_id === selectedProblemSetId);
    }, [isCreatingNew, myProblemSets, selectedProblemSetId]);

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
            <div className="problem-set-selector-container">
                <h2>1. 작업 대상 선택</h2>
                <p>새로운 문제집을 만들거나, 기존 문제집에 문제를 추가할 수 있습니다.</p>
                
                <div className="radio-group">
                    <label className={`radio-label ${selectedProblemSetId === 'new' ? 'checked' : ''}`}>
                        <input
                            type="radio"
                            name="problemSet"
                            value="new"
                            checked={selectedProblemSetId === 'new'}
                            onChange={() => setSelectedProblemSetId('new')}
                        />
                        <span className="radio-button"></span>
                        <span className="radio-text">새로운 문제집 만들기</span>
                    </label>

                    {isLoading && <p>문제집 목록을 불러오는 중...</p>}
                    {isError && <p style={{color: 'red'}}>문제집 목록을 불러오는데 실패했습니다.</p>}
                    
                    {myProblemSets && myProblemSets.map((problemSet) => (
                         <label key={problemSet.problem_set_id} className={`radio-label ${selectedProblemSetId === problemSet.problem_set_id ? 'checked' : ''}`}>
                             <input
                                 type="radio"
                                 name="problemSet"
                                 value={problemSet.problem_set_id}
                                 checked={selectedProblemSetId === problemSet.problem_set_id}
                                 onChange={() => setSelectedProblemSetId(problemSet.problem_set_id)}
                             />
                             <span className="radio-button"></span>
                             <span className="radio-text">{problemSet.name} ({problemSet.problem_count}문제)</span>
                         </label>
                    ))}
                </div>
            </div>

            {/* --- [핵심 수정] ---
                JsonProblemImporterWidget에 전달하는 prop의 이름을 
                'problemSetName'에서 'initialProblemSetName'으로 변경하여 
                위젯의 props 타입 정의와 일치시킵니다.
                onProblemSetNameChange prop은 더 이상 필요 없으므로 삭제합니다.
            */}
            <JsonProblemImporterWidget
                key={selectedProblemSetId}
                isCreatingNew={isCreatingNew}
                initialProblemSetName={selectedProblemSetInfo?.name || ''}
                selectedProblemSetId={selectedProblemSetId} 
            />
        </div>
    );
};

export default ProblemSetCreationPage;