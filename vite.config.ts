import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: true },
  build: {
    rollupOptions: {
      output: {
        // three.js is large and changes rarely — keep it in its own cacheable chunk.
        manualChunks: { three: ['three'] },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  test: { environment: 'node' },
});
