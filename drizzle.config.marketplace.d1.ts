import 'dotenv/config';
import type { Config } from 'drizzle-kit';
// env 객체를 사용한다면, hono/adapter 나 다른 환경 변수 관리 라이브러리에서 가져와야 합니다.
// 여기서는 process.env를 사용한다고 가정하겠습니다.
const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_MARKET_ID, CLOUDFLARE_API_TOKEN } = process.env;

console.log("--- Drizzle D1 Config Environment Variables ---");
console.log("CLOUDFLARE_ACCOUNT_ID:", CLOUDFLARE_ACCOUNT_ID ? '✅ Loaded' : '❌ Not Loaded');
// 실제 토큰 값은 보안상 출력하지 않는 것이 좋습니다. 로드 여부만 확인합니다.
console.log("CLOUDFLARE_API_TOKEN:", CLOUDFLARE_API_TOKEN ? '✅ Loaded' : '❌ Not Loaded');
console.log("CLOUDFLARE_D1_DATABASE_ID:", CLOUDFLARE_D1_DATABASE_MARKET_ID ? '✅ Loaded' : '❌ Not Loaded');
console.log("-------------------------------------------");

export default {
    schema: './api/db/schema.marketplace.d1.ts', // D1용 스키마 경로
    out: './drizzle_d1_marketplace',
    dialect: 'sqlite',
    driver: 'd1-http', // HTTP API를 통해 D1에 연결
    dbCredentials: {
        accountId: CLOUDFLARE_ACCOUNT_ID!,
        databaseId: CLOUDFLARE_D1_DATABASE_MARKET_ID!,
        token: CLOUDFLARE_API_TOKEN!, // D1에 접근 권한이 있는 API 토큰
    },
    verbose: true,
    strict: true,
} satisfies Config;