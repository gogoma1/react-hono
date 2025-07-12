// ./react/entities/problem-set/model/types.ts

// D1 스키마의 DbProblemSet 타입과 거의 유사하지만, API 응답에 추가된 필드를 포함합니다.
export interface MyProblemSet {
    problem_set_id: string;
    name: string;
    creator_id: string;
    type: 'PUBLIC_ADMIN' | 'PRIVATE_USER';
    status: 'published' | 'private' | 'deleted';
    copyright_type: 'ORIGINAL_CREATION' | 'COPYRIGHTED_MATERIAL';
    copyright_source: string | null;
    description: string | null;
    cover_image: string | null;
    published_year: number | null;
    grade: string | null;
    semester: string | null;
    avg_difficulty: string | null;
    created_at: string;
    updated_at: string;
    
    // GET /my API에서 추가로 반환되는 필드들
    problem_count: number;
    marketplace_status: 'draft' | 'in_review' | 'active' | 'inactive' | 'deleted' | 'not_listed';
}

// 문제집 생성을 위한 Payload 타입. API의 Zod 스키마와 일치시킵니다.
export interface CreateProblemSetPayload {
    name: string;
    description?: string;
    copyright_type: 'ORIGINAL_CREATION' | 'COPYRIGHTED_MATERIAL';
    copyright_source?: string;
    // type, status 등은 서버에서 기본값으로 처리하거나, Modal 로직에 따라 결정됩니다.
}