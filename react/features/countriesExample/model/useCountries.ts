// react-hono/react/features/countriesExample/model/useCountries.ts
import { useState, useCallback, useEffect } from 'react';
import type { User } from '../../kakaologin/model/kakaologin'; // User 타입 import

export interface CountriesState {
  data: string | null;
  error: string | null;
  isLoading: boolean;
}

export interface UseCountriesReturn extends CountriesState {
  fetchCountries: () => Promise<void>;
  clearCountriesData: () => void; // 데이터 초기화 함수 추가
}

export function useCountries(user: User | null): UseCountriesReturn {
  const [data, setData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCountries = useCallback(async () => {
    setData(null);
    setError(null);

    if (!user) {
      setError("Please log in to fetch countries.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/countries');

      if (!response.ok) {
        let errorMsg = `Error: ${response.status} ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData.error || errData.message) errorMsg = errData.error || errData.message;
        } catch (e) { /* json 파싱 실패 무시 */ }
        throw new Error(errorMsg);
      }

      const responseData = await response.json();
      setData(JSON.stringify(responseData, null, 2));
    } catch (err: any) {
      console.error("Error fetching countries:", err);
      setError(err.message || "Failed to fetch countries.");
    } finally {
      setIsLoading(false);
    }
  }, [user]); // user가 변경되면 함수를 재생성

  const clearCountriesData = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  // 사용자가 로그아웃하면 국가 데이터 초기화
  useEffect(() => {
    if (!user) {
        clearCountriesData();
    }
  }, [user, clearCountriesData]);


  return { data, error, isLoading, fetchCountries, clearCountriesData };
}