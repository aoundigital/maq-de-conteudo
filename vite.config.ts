import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR disabled in AI Studio — do not expose to network
      hmr: process.env.DISABLE_HMR !== 'true',
      host: 'localhost', // CVE-4: Never expose to 0.0.0.0 in code
    },
    build: {
      // Code splitting for better performance on Vercel
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            supabase: ['@supabase/supabase-js'],
            ai: ['@google/genai'],
            utils: ['jszip', 'dompurify', 'date-fns'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  };
});
