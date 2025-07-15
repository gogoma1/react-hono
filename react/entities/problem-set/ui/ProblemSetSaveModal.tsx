// ./react/entities/problem-set/ui/ProblemSetSaveModal.tsx

import React, { useState, useEffect } from 'react';
import GlassCard from '../../../shared/ui/glasscard/GlassCard';
import ActionButton from '../../../shared/ui/actionbutton/ActionButton';
import LoadingButton from '../../../shared/ui/loadingbutton/LoadingButton';
import type { ProblemSetFinalPayload } from '../model/types'; // [수정] 타입 import
import './ProblemSetSaveModal.css';

interface ProblemSetSaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (payload: ProblemSetFinalPayload) => void; // [수정] 타입 명시
    isConfirming: boolean;
    problemSetName: string;
    problemSetDescription?: string;
}

type Step = 'publicationType' | 'copyrightType' | 'confirmSale';
type PublicationType = 'private' | 'forSale' | 'scheduled';
type CopyrightType = 'ORIGINAL_CREATION' | 'COPYRIGHTED_MATERIAL';

export const ProblemSetSaveModal: React.FC<ProblemSetSaveModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isConfirming,
}) => {
    const [step, setStep] = useState<Step>('publicationType');
    const [publicationType, setPublicationType] = useState<PublicationType | null>(null);
    const [copyrightType, setCopyrightType] = useState<CopyrightType | null>(null);
    const [copyrightSource, setCopyrightSource] = useState('');
    const [isCopyrightConfirmed, setIsCopyrightConfirmed] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep('publicationType');
                setPublicationType(null);
                setCopyrightType(null);
                setCopyrightSource('');
                setIsCopyrightConfirmed(false);
            }, 300);
        }
    }, [isOpen]);

    const handlePublicationTypeSelect = (type: PublicationType) => {
        setPublicationType(type);
        if (type === 'private') {
            setStep('copyrightType');
        } else {
            setStep('confirmSale');
        }
    };

    const handleCopyrightTypeSelect = (type: CopyrightType) => {
        setCopyrightType(type);
    };

    const handleConfirm = () => {
        if (!publicationType) return;

        // 최종 저장 데이터 생성
        const payload: ProblemSetFinalPayload = {
            type: (publicationType === 'forSale' || publicationType === 'scheduled') ? 'PUBLIC_ADMIN' : 'PRIVATE_USER',
            status: publicationType === 'forSale' ? 'published' : 'private',
            copyright_type: publicationType === 'private' ? copyrightType! : 'ORIGINAL_CREATION',
            copyright_source: copyrightType === 'COPYRIGHTED_MATERIAL' ? copyrightSource : null,
        };
        onConfirm(payload);
    };

    const renderStepContent = () => {
        switch (step) {
            case 'publicationType':
                return (
                    <>
                        <p className="modal-step-description">이 문제집을 어떻게 사용하실 건가요?</p>
                        <div className="selection-group">
                             <button className={`selection-button ${publicationType === 'private' ? 'active' : ''}`} onClick={() => handlePublicationTypeSelect('private')}>
                                <span className="title">개인용</span>
                                <span className="description">나 또는 내가 가르치는 학생들만 사용합니다.</span>
                            </button>
                            <button className={`selection-button ${publicationType === 'forSale' ? 'active' : ''}`} onClick={() => handlePublicationTypeSelect('forSale')}>
                                <span className="title">판매용</span>
                                <span className="description">마켓플레이스에 즉시 등록하여 판매를 시작합니다. (창작물만 가능)</span>
                            </button>
                            <button className={`selection-button ${publicationType === 'scheduled' ? 'active' : ''}`} onClick={() => handlePublicationTypeSelect('scheduled')}>
                                <span className="title">판매 예정</span>
                                <span className="description">나중에 판매할 수 있도록 비공개로 저장합니다. (창작물만 가능)</span>
                            </button>
                        </div>
                    </>
                );
            case 'copyrightType':
                return (
                     <>
                        <p className="modal-step-description">문제의 저작권 유형을 선택해주세요.</p>
                        <div className="selection-group">
                            <button className={`selection-button ${copyrightType === 'ORIGINAL_CREATION' ? 'active' : ''}`} onClick={() => handleCopyrightTypeSelect('ORIGINAL_CREATION')}>
                                <span className="title">창작물</span>
                                <span className="description">모든 문제가 내가 직접 창작한 고유한 저작물입니다.</span>
                            </button>
                            <button className={`selection-button ${copyrightType === 'COPYRIGHTED_MATERIAL' ? 'active' : ''}`} onClick={() => handleCopyrightTypeSelect('COPYRIGHTED_MATERIAL')}>
                                <span className="title">시중 자료</span>
                                <span className="description">교과서, 참고서 등 저작권이 있는 자료를 사용했습니다.</span>
                            </button>
                        </div>
                        {copyrightType === 'COPYRIGHTED_MATERIAL' && (
                            <input
                                type="text"
                                className="copyright-source-input"
                                placeholder="자료의 출처를 반드시 입력해주세요. (예: 쎈 수학)"
                                value={copyrightSource}
                                onChange={(e) => setCopyrightSource(e.target.value)}
                            />
                        )}
                    </>
                );
            case 'confirmSale':
                return (
                    <>
                        <p className="modal-step-description">판매용 문제집은 반드시 본인의 순수 창작물이어야 합니다.</p>
                        <div className="copyright-warning">
                            <p><strong>저작권 침해 경고</strong></p>
                            <p>타인의 저작물을 무단으로 복제하여 판매하는 것은 저작권법에 위배되는 행위입니다. 모든 법적 책임은 판매자 본인에게 있습니다.</p>
                        </div>
                        <div className="copyright-confirmation">
                            <input type="checkbox" id="copyright-confirm-checkbox" checked={isCopyrightConfirmed} onChange={(e) => setIsCopyrightConfirmed(e.target.checked)} />
                            <label htmlFor="copyright-confirm-checkbox">위 내용을 확인했으며, 모든 문제는 저의 순수 창작물임을 확인합니다.</label>
                        </div>
                    </>
                );
        }
    };
    
    const isNextDisabled = 
        (step === 'publicationType' && !publicationType) ||
        (step === 'copyrightType' && (!copyrightType || (copyrightType === 'COPYRIGHTED_MATERIAL' && !copyrightSource.trim()))) ||
        (step === 'confirmSale' && !isCopyrightConfirmed);


    return (
        <GlassCard isOpen={isOpen} onClose={onClose} title="문제집 저장 옵션" hideFooter={true}>
            <div className="problem-set-save-modal-content">
                {renderStepContent()}
                <div className="modal-actions">
                    {step !== 'publicationType' && (
                        <ActionButton onClick={() => setStep('publicationType')}>뒤로</ActionButton>
                    )}
                    <LoadingButton
                        onClick={handleConfirm}
                        isLoading={isConfirming}
                        className="primary"
                        disabled={isNextDisabled || isConfirming}
                        loadingText="저장 중..."
                    >
                        저장하기
                    </LoadingButton>
                </div>
            </div>
        </GlassCard>
    );
};