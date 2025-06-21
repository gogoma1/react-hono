import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  server: {
  proxy: {
    // Hono API 경로들을 Wrangler 로컬 프록시로 전달
    // '/user': 'http://127.0.0.1:8787',
    '/example': 'http://127.0.0.1:8787',
    '/api': 'http://127.0.0.1:8787',
    '/exists': 'http://127.0.0.1:8787'
  },
  
  define: {
    // 'global'을 빈 객체로 정의하여 혹시 모를 추가 에러를 방지합니다.
    'global': {},
  },
}
});
