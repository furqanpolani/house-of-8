import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    // Serve the parent /assets folder at /assets during development
    {
      name: 'serve-parent-assets',
      configureServer(server) {
        server.middlewares.use('/assets', (req, res, next) => {
          const filePath = path.resolve(__dirname, '..', 'assets', decodeURIComponent(req.url.replace(/^\//, '')));
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
            res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
            fs.createReadStream(filePath).pipe(res);
          } else {
            next();
          }
        });
      },
    },
  ],
  server: {
    port: 5173,
    proxy: {
      '/api':     { target: 'http://localhost:3001', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
});
