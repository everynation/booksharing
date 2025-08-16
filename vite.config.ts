import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    open: true, // 자동으로 브라우저 열기
    watch: {
      usePolling: true, // 파일 변경 감지 개선
      interval: 100, // 폴링 간격
    },
    hmr: {
      overlay: true, // 에러 오버레이 표시
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // 개발 시 소스맵 활성화
  build: {
    sourcemap: mode === 'development',
  },
}));
