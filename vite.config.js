import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      // Uploaded images are served by the backend; files already in
      // public/uploads are served by Vite as before.
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        bypass: (req) => {
          const file = path.join('public', decodeURIComponent(req.url.split('?')[0]));
          if (fs.existsSync(file)) return req.url;
        },
      },
    },
  },
});
