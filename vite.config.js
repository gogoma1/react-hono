import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  server: {
  proxy: {
    // Hono API 경로들을 Wrangler 로컬 프록시로 전달
    '/user': 'http://127.0.0.1:8787',
    '/signin': 'http://127.0.0.1:8787',
    '/example': 'http://127.0.0.1:8787',
    // 또는 공통 접두사 '/api'를 사용했다면
    // '/api': {
    //   target: 'http://127.0.0.1:8787',
    //   changeOrigin: true,
    // }
  }
}
});
