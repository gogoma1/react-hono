// filepath: react-hono/react/shared/lib/axiosInstance.ts (새 파일 또는 기존 api 관련 파일)
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8787'; // 환경 변수로 설정 가능, 예: process.env.REACT_APP_API_BASE_URL

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 요청 타임아웃 10초
  headers: {
    'Content-Type': 'application/json',
    // 필요에 따라 다른 공통 헤더 추가
  },
  withCredentials: true, // Supabase 쿠키 인증을 위해 필요할 수 있음 (CORS 설정과 함께 확인)
});


// 응답 인터셉터 (예: 공통 에러 처리)
axiosInstance.interceptors.response.use(
  (response) => {
    return response; // 성공적인 응답은 그대로 반환
  },
  (error) => {
    // 여기서 공통적인 에러 처리를 할 수 있습니다.
    // 예를 들어, 401 Unauthorized 에러 시 로그인 페이지로 리다이렉트 등
    if (error.response && error.response.status === 401) {
      // console.error('Unauthorized! Redirecting to login...');
      // window.location.href = '/login'; // 예시
    }
    return Promise.reject(error); // 에러를 계속 전파하여 React Query가 처리하도록 함
  }
);

export default axiosInstance;