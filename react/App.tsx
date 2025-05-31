// file: react-hono/react/App.tsx
// (원래 UserDetailsButton의 client.api.user.$get() 호출 방식을 유지한다고 가정)

import  { useEffect, useState } from "react"; // React import 추가
import { createBrowserClient } from "@supabase/ssr";
import { hc } from "hono/client";
import type { AppType } from "../api"; // AppType이 client.api.user.$get()을 가능하게 하는 타입이라고 가정

const client = hc<AppType>("/"); // Hono 클라이언트 (원래대로)

const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);


function App() {
  const [user, setUser] = useState<null | { id: string }>(null);
  const [countriesData, setCountriesData] = useState<string | null>(null); // countries 데이터를 JSON 문자열로 저장
  const [countriesError, setCountriesError] = useState<string | null>(null); // 에러 메시지

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);
      if (event === "SIGNED_OUT") {
        setUser(null);
        setCountriesData(null); // 로그아웃 시 데이터 초기화
        setCountriesError(null);
      } else {
        setUser(session?.user!);
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // countries 데이터를 가져오는 함수 (일반 fetch 사용)
  const handleFetchCountries = async () => {
    setCountriesData(null); // 이전 데이터 초기화
    setCountriesError(null); // 이전 에러 초기화

    if (!user) {
      setCountriesError("Please log in to fetch countries.");
      return;
    }

    try {
      // 일반 fetch API를 사용하여 /countries 엔드포인트 호출
      const response = await fetch('/countries'); // API 서버의 상대 경로

      if (!response.ok) {
        let errorMsg = `Error: ${response.status} ${response.statusText}`;
        try {
            const errData = await response.json();
            if(errData.error || errData.message) errorMsg = errData.error || errData.message;
        } catch(e) {/* json 파싱 실패 무시 */}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setCountriesData(JSON.stringify(data, null, 2)); // JSON 문자열로 저장
    } catch (error: any) {
      console.error("Error fetching countries:", error);
      setCountriesError(error.message || "Failed to fetch countries.");
    }
  };

  return (
    <>
      <h1>Hono Supabase Auth Example!</h1>
      <h2>Sign in</h2>
      {!user ? (
        <SignIn />
      ) : (
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/signout";
          }}
        >
          Sign out!
        </button>
      )}
      <h2>Example of API fetch()</h2>
      <UserDetailsButton /> {/* 이 컴포넌트는 client.api.user.$get() 사용 */}
      <h2>Example of database read</h2>
      <p>
        Note that only authenticated users are able to read from the database!
      </p>
      {/* <a href="/countries">Get countries</a>  -> 버튼으로 변경 */}
      {user && ( // 로그인 시에만 버튼 표시
        <button type="button" onClick={handleFetchCountries}>
          Get Countries (Fetch)
        </button>
      )}
      {/* 에러 메시지 표시 */}
      {countriesError && <p style={{ color: "red" }}>{countriesError}</p>}
      {/* countries 데이터 표시 (JSON 형태) */}
      {countriesData && (
        <pre style={{ background: '#f0f0f0', padding: '10px', marginTop: '10px' }}>
          {countriesData}
        </pre>
      )}
    </>
  );
}

function SignIn() {
  // ... (제공해주신 SignIn 컴포넌트 코드 그대로)
  return (
    <>
      <p>
        Read about and enable{" "}
        <a
          href="https://supabase.com/docs/guides/auth/auth-anonymous"
          target="_blank"
          rel="noopener noreferrer"
        >
          anonymous signins here!
        </a>
      </p>
      <div>
        <button
          type="button"
          onClick={async () => {
            const { data, error } = await supabase.auth.signInAnonymously();
            if (error) return console.error("Error signing in:", error.message);
            console.log("Signed in client-side!");
            alert("Signed in anonymously! User id: " + data?.user?.id);
          }}
        >
          Anonymous sign in
        </button>
        <button
          type="button"
          onClick={async () => {
            // 클라이언트에서 직접 OAuth 시작
            const { error } = await supabase.auth.signInWithOAuth({
              provider: 'kakao',
              options: {
                redirectTo: window.location.origin,
              },
            });
            if (error) console.error("Kakao OAuth error:", error);
          }}
        >
          Sign in with Kakao
        </button>
      </div>
    </>
  );
}

const UserDetailsButton = () => {
  // ... (제공해주신 UserDetailsButton 컴포넌트 코드 그대로)
  const [response, setResponse] = useState<string | null>(null);

  const handleClick = async () => {
    try {
        // 이 부분은 원래 코드의 호출 방식을 유지합니다.
        // AppType이 이 호출을 가능하게 하는 타입이라고 가정합니다.
        const res = await client.api.user.$get();

        if(!res.ok) {
            let errorMsg = `Error: ${res.status} ${res.statusText}`;
            try {
                const errData = await res.json();
                if (typeof errData === "object" && errData !== null) {
                    if ("error" in errData && typeof errData.error === "string") {
                        errorMsg = errData.error;
                    } else if ("message" in errData && typeof errData.message === "string") {
                        errorMsg = errData.message;
                    }
                }
            } catch(e) {/* json 파싱 실패 무시 */}
            throw new Error(errorMsg);
        }
        const data = await res.json();
        const headers = Array.from(res.headers.entries()).reduce<
            Record<string, string>
        >((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});
        const fullResponse = {
            url: res.url,
            status: res.status,
            headers,
            body: data,
        };
        setResponse(JSON.stringify(fullResponse, null, 2));
    } catch (error: any) {
        console.error("Error in UserDetailsButton:", error);
        // 에러를 사용자에게 보여주기 위해 상태에 저장 (선택적)
        setResponse(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <button type="button" onClick={handleClick}>
        Get My User Details
      </button>
      {response && <pre>{response}</pre>}
    </div>
  );
};

export default App;