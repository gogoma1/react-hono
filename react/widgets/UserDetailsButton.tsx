// react-hono/react/widgets/UserDetailsButton.tsx
import React, { useState } from "react";
import { honoClient } from "../shared/api/honoclient";

export const UserDetailsButton: React.FC = () => {
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleClick = async () => {
    setResponse(null);
    setError(null);
    setIsLoading(true);
    try {
      const res = await honoClient.user.$get();

      if (!res.ok) {
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
        } catch (e) { /* json parsing 실패 무시 */ }
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
    } catch (err: any) {
      console.error("Error in UserDetailsButton:", err);
      setError(err.message || "Failed to fetch user details.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Loading Details...' : 'Get My User Details'}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {response && <pre>{response}</pre>}
    </div>
  );
};