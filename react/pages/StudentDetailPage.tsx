import React from 'react';
import { useParams } from 'react-router';
import './StudentDetailPage.css';

const StudentDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    return (
        <div className="student-detail-page">
            <h1>학생 상세 정보</h1>
            <p>선택된 학생의 ID는 <strong>{id}</strong> 입니다.</p>
            <br />
            <p>이곳에 해당 학생의 모든 정보를 표시하고, 수정/관리하는 UI를 구성할 수 있습니다.</p>
        </div>
    );
};

export default StudentDetailPage;