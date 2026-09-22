// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Đọc .env, .env.development / .env.production theo mode đang build
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // VITE_BASE_PATH lấy từ .env.development (local) hoặc .env.production (release qua nginx)
    base: env.VITE_BASE_PATH || '/',
  };
});
