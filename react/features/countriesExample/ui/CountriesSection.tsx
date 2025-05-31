// react-hono/react/features/countriesExample/ui/CountriesSection.tsx
import React from 'react';
import { useCountries } from '../model/useCountries';
import type { User } from '../../kakaologin/model/kakaologin';

interface CountriesSectionProps {
  user: User | null; // App.tsx로부터 user 상태를 받습니다.
}

export const CountriesSection: React.FC<CountriesSectionProps> = ({ user }) => {
  const { data, error, isLoading, fetchCountries } = useCountries(user);

  // 이 컴포넌트는 user가 있을 때만 App.tsx에서 렌더링되므로,
  // 내부에서 user 존재 여부를 다시 확인할 필요는 없을 수 있습니다.
  // useCountries 훅이 user prop을 받아서 내부적으로 로그인 필요 에러를 처리합니다.

  return (
    <div> {/* 하나의 루트 요소로 감싸기 */}
      <h2>Example of database read (Standard Fetch)</h2>
      <p>
        Note that only authenticated users are able to read from the database!
      </p>
      <button type="button" onClick={fetchCountries} disabled={isLoading || !user}>
        {isLoading ? 'Loading...' : 'Get Countries (Fetch)'}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {data && (
        <pre style={{ background: '#f0f0f0', padding: '10px', marginTop: '10px' }}>
          {data}
        </pre>
      )}
    </div>
  );
};