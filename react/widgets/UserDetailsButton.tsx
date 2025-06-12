// filepath: react-hono/react/widgets/UserDetailsButton.tsx
import React, { useState } from "react";
// authStore에서 필요한 상태와 셀렉터, User 타입을 가져옵니다.
import {
  useAuthStore,
  selectUser,
  selectIsAuthenticated,
  selectIsLoadingAuth,
  selectAuthError, // API 호출이 없으므로 이 에러는 직접 관련 없을 수 있지만, 참고용으로 추가
} from "../shared/store/authStore";

export const UserDetailsButton: React.FC = () => {
  // authStore에서 상태 가져오기
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoadingAuth = useAuthStore(selectIsLoadingAuth);
  // const authStoreError = useAuthStore(selectAuthError); // 스토어의 일반 인증 에러

  // 로컬 상태: 사용자 상세 정보를 문자열로 저장
  const [userDetailsString, setUserDetailsString] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null); // 이 컴포넌트 내 작업 관련 에러

  const handleShowDetails = () => {
    setLocalError(null); // 이전 에러 클리어
    setUserDetailsString(null); // 이전 상세정보 클리어

    if (isLoadingAuth) {
      setLocalError("아직 인증 정보를 확인 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (!isAuthenticated || !user) {
      setLocalError("사용자 정보를 표시하려면 먼저 로그인해야 합니다.");
      return;
    }

    // authStore에 있는 user 객체를 직접 사용합니다.
    // User 객체 전체 또는 필요한 부분만 문자열로 변환하여 표시
    try {
      const displayUserInfo = {
        id: user.id,
        email: user.email,
        // role: user.role, // Supabase User 객체에 role이 기본으로 있다면
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
        created_at: user.created_at,
        // 필요한 다른 정보들을 추가할 수 있습니다.
        // 주의: 민감한 정보는 직접 노출하지 않도록 합니다.
      };
      setUserDetailsString(JSON.stringify(displayUserInfo, null, 2));
    } catch (e: any) {
      console.error("Error processing user details:", e);
      setLocalError("사용자 정보를 처리하는 중 오류가 발생했습니다.");
    }
  };

  // API 호출 방식 (만약 /user 엔드포인트가 authStore.user에 없는 추가 정보를 준다면)
  /*
  const { honoClient } = await import("../shared/api/honoClient"); // 동적 import 예시

  const handleFetchDetailsFromApi = async () => {
    setLocalError(null);
    setUserDetailsString(null);

    if (isLoadingAuth) {
      setLocalError("아직 인증 정보를 확인 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (!isAuthenticated) {
      setLocalError("API를 호출하려면 먼저 로그인해야 합니다.");
      return;
    }

    // API 호출 로딩 상태를 위한 별도 상태가 필요할 수 있음 (예: isFetchingApi)
    // setIsFetchingApi(true);
    try {
      const res = await honoClient.user.$get(); // honoClient import 필요

      if (!res.ok) {
        let errorMsg = `Error: ${res.status} ${res.statusText}`;
        try {
          const errData = await res.json();
          if (typeof errData === "object" && errData !== null) {
            if ("error" in errData && typeof errData.error === "string") errorMsg = errData.error;
            else if ("message" in errData && typeof errData.message === "string") errorMsg = errData.message;
          }
        } catch (e) {  } // json parsing 실패 무시
        throw new Error(errorMsg);
      }
      const data = await res.json();
      setUserDetailsString(JSON.stringify(data, null, 2));
    } catch (err: any) {
      console.error("Error fetching user details from API:", err);
      setLocalError(err.message || "API에서 사용자 정보를 가져오는 데 실패했습니다.");
    } finally {
      // setIsFetchingApi(false);
    }
  };
  */

  return (
    <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '4px' }}>
      <h3 style={{ marginTop: '0' }}>내 사용자 정보 확인</h3>
      <button
        type="button"
        onClick={handleShowDetails} // API 호출이 필요하면 handleFetchDetailsFromApi로 변경
        disabled={isLoadingAuth} // API 호출 시에는 isFetchingApi도 고려
        style={{ padding: '8px 12px', marginBottom: '10px' }}
      >
        {isLoadingAuth ? '인증 확인 중...' : '내 정보 보기 (Store)'}
        {/* API 호출 시: {isFetchingApi ? '정보 가져오는 중...' : '내 정보 보기 (API)'} */}
      </button>

      {localError && <p style={{ color: "red" }}>{localError}</p>}
      {/* authStoreError도 필요하다면 여기에 표시할 수 있습니다. */}
      {/* authStoreError && <p style={{ color: "orange" }}>인증 시스템 에러: {authStoreError}</p> */}

      {userDetailsString && (
        <pre style={{ background: '#f7f7f7', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {userDetailsString}
        </pre>
      )}
      {!userDetailsString && !localError && !isLoadingAuth && isAuthenticated && (
        <p>버튼을 클릭하여 사용자 정보를 확인하세요.</p>
      )}
      {!isAuthenticated && !isLoadingAuth && (
        <p>로그인 후 사용자 정보를 확인할 수 있습니다.</p>
      )}
    </div>
  );
};

// export default UserDetailsButton; // export const 라면 default 불필요