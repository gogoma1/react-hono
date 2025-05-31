// react-hono/react/shared/api/honoClient.ts
import { hc } from "hono/client";
// AppType의 실제 경로는 프로젝트 구조에 따라 정확히 지정해야 합니다.
// 여기서는 react/shared/api/ 에서 세 단계 위인 api/index.ts 를 가정합니다.
import type { AppType } from ".../../../api/routes/auth/auth";

export const honoClient = hc<AppType>("/");