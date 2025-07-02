// ----- ./react/pages/MobileExamPage.tsx -----
import React, { useEffect } from 'react';
import MobileExamView from '../widgets/mobile-exam-view/MobileExamView';
import './MobileExamPage.css';

const MobileExamPage: React.FC = () => {

    // [핵심 수정] 페이지가 마운트/언마운트 될 때 <html> 태그의 클래스를 제어하는 useEffect
    useEffect(() => {
        // 페이지가 나타날 때, <html> 태그에 클래스를 추가하여 스크롤을 활성화합니다.
        document.documentElement.classList.add('mobile-exam-layout-active');

        // 컴포넌트가 사라질 때(언마운트) 실행되는 클린업 함수
        return () => {
            // 페이지를 벗어날 때, 추가했던 클래스를 제거하여 원래의 overflow: hidden 상태로 복원합니다.
            document.documentElement.classList.remove('mobile-exam-layout-active');
        };
    }, []); // 빈 의존성 배열을 사용하여 컴포넌트가 마운트될 때 한 번만 실행되도록 합니다.


    return (
        <div className="mobile-exam-page">
            <MobileExamView />
        </div>
    );
};

export default MobileExamPage;