// vite.config.ts
import { defineConfig } from "file:///Users/twookim05/code/booksharing/node_modules/vite/dist/node/index.js";
import react from "file:///Users/twookim05/code/booksharing/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///Users/twookim05/code/booksharing/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/Users/twookim05/code/booksharing";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    open: true,
    // 자동으로 브라우저 열기
    watch: {
      usePolling: true,
      // 파일 변경 감지 개선
      interval: 100
      // 폴링 간격
    },
    hmr: {
      overlay: true
      // 에러 오버레이 표시
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  // 개발 시 소스맵 활성화
  build: {
    sourcemap: mode === "development"
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdHdvb2tpbTA1L2NvZGUvYm9va3NoYXJpbmdcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy90d29va2ltMDUvY29kZS9ib29rc2hhcmluZy92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvdHdvb2tpbTA1L2NvZGUvYm9va3NoYXJpbmcvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiOjpcIixcbiAgICBwb3J0OiA4MDgwLFxuICAgIG9wZW46IHRydWUsIC8vIFx1Qzc5MFx1QjNEOVx1QzczQ1x1Qjg1QyBcdUJFMENcdUI3N0NcdUM2QjBcdUM4MDAgXHVDNUY0XHVBRTMwXG4gICAgd2F0Y2g6IHtcbiAgICAgIHVzZVBvbGxpbmc6IHRydWUsIC8vIFx1RDMwQ1x1Qzc3QyBcdUJDQzBcdUFDQkQgXHVBQzEwXHVDOUMwIFx1QUMxQ1x1QzEyMFxuICAgICAgaW50ZXJ2YWw6IDEwMCwgLy8gXHVEM0Y0XHVCOUMxIFx1QUMwNFx1QUNBOVxuICAgIH0sXG4gICAgaG1yOiB7XG4gICAgICBvdmVybGF5OiB0cnVlLCAvLyBcdUM1RDBcdUI3RUMgXHVDNjI0XHVCQzg0XHVCODA4XHVDNzc0IFx1RDQ1Q1x1QzJEQ1xuICAgIH0sXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIG1vZGUgPT09ICdkZXZlbG9wbWVudCcgJiZcbiAgICBjb21wb25lbnRUYWdnZXIoKSxcbiAgXS5maWx0ZXIoQm9vbGVhbiksXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbiAgLy8gXHVBQzFDXHVCQzFDIFx1QzJEQyBcdUMxOENcdUMyQTRcdUI5RjUgXHVENjVDXHVDMTMxXHVENjU0XG4gIGJ1aWxkOiB7XG4gICAgc291cmNlbWFwOiBtb2RlID09PSAnZGV2ZWxvcG1lbnQnLFxuICB9LFxufSkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFxUixTQUFTLG9CQUFvQjtBQUNsVCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBSGhDLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxZQUFZO0FBQUE7QUFBQSxNQUNaLFVBQVU7QUFBQTtBQUFBLElBQ1o7QUFBQSxJQUNBLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQTtBQUFBLElBQ1g7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixTQUFTLGlCQUNULGdCQUFnQjtBQUFBLEVBQ2xCLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDaEIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFFQSxPQUFPO0FBQUEsSUFDTCxXQUFXLFNBQVM7QUFBQSxFQUN0QjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
