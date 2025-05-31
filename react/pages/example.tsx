// filepath: react/pages/example.tsx
import { useState } from 'react';

// API 응답 데이터의 타입을 정의합니다. (pg_tables의 각 row가 어떤 필드를 가질지 정확히 알면 더 구체적으로 정의 가능)
interface TableInfo {
  // 예시: pg_tables의 일반적인 컬럼들
  schemaname: string;
  tablename: string;
  tableowner: string;
  tablespace: string | null;
  hasindexes: boolean;
  hasrules: boolean;
  hastriggers: boolean;
  rowsecurity: boolean;
  // 실제 컬럼에 맞게 추가/수정하세요.
  [key: string]: any; // 그 외 다른 컬럼들을 위해
}

interface ApiResponse {
  success: boolean;
  result?: TableInfo[];
  error?: string;
}

const ExamplePage: React.FC = () => {
  const [data, setData] = useState<TableInfo[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Vite 프록시를 통해 Hono API 호출
      // Hono 라우트가 '/example/pg-tables' 이고 Vite proxy가 /api -> http://localhost:8787 이라면,
      // Hono에서 app.route('/api/example', exampleRoute) 로 설정했다면
      // fetch('/api/example/pg-tables') 가 됩니다.
      // Hono에서 app.route('/example', exampleRoute) 로 설정했고, Vite proxy에서
      // '/example': { target: 'http://localhost:8787' } 로 설정했다면
      // fetch('/example/pg-tables') 가 됩니다.
      // 여기서는 Hono가 /api/example/pg-tables 를 직접 처리한다고 가정합니다.
      // (즉, wrangler.jsonc의 main이 api/index.ts이고, api/index.ts에서 app.route("/api/example", ...) 로 라우팅)
      const response = await fetch('/example/pg-tables');

      if (!response.ok) {
        // HTTP 에러 상태 처리 (4xx, 5xx)
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const jsonData: ApiResponse = await response.json();

      if (jsonData.success && jsonData.result) {
        setData(jsonData.result);
      } else {
        setError(jsonData.error || 'Failed to fetch data.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>PostgreSQL pg_tables 데이터 조회 예제</h1>
      <button onClick={fetchData} disabled={loading}>
        {loading ? '데이터 로딩 중...' : 'pg_tables 데이터 가져오기'}
      </button>

      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          <p>에러 발생:</p>
          <pre>{error}</pre>
        </div>
      )}

      {data && (
        <div style={{ marginTop: '20px' }}>
          <h2>조회된 데이터:</h2>
          {data.length > 0 ? (
            <pre style={{ background: '#f4f4f4', padding: '10px', borderRadius: '5px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : (
            <p>데이터가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ExamplePage;