import React from 'react';
import MobileExamView from '../widgets/mobile-exam-view/MobileExamView';
import './MobileExamPage.css';

const MobileExamPage: React.FC = () => {
    return (
        // [핵심 수정] RootLayout에 통합되므로 불필요한 헤더와 컨테이너를 제거하고, 
        // 페이지 식별을 위한 최소한의 div만 남깁니다.
        <div className="mobile-exam-page">
            <MobileExamView />
        </div>
    );
};

export default MobileExamPage;