import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import obfuscator from 'rollup-plugin-obfuscator';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    rollupOptions: {
      plugins: [
        // Scrambles our own code in production builds (React itself is
        // left alone to keep the bundle fast). Mild settings: heavier
        // options like control-flow flattening slow the site noticeably.
        obfuscator({
          include: ['src/**/*.js', 'src/**/*.jsx'],
          options: {
            compact: true,
            identifierNamesGenerator: 'hexadecimal',
            renameGlobals: false,
            stringArray: true,
            stringArrayEncoding: ['base64'],
            stringArrayThreshold: 0.75,
            splitStrings: false,
            selfDefending: false,
            controlFlowFlattening: false,
            deadCodeInjection: false,
            unicodeEscapeSequence: false,
          },
        }),
      ],
    },
  },
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
