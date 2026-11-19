import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 백엔드(8080)에 CORS 설정이 없으므로 개발 서버에서 프록시
      '/api': 'http://localhost:8080',
    },
  },
})
