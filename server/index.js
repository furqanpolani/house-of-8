// Local dev server. On Vercel the same app runs from api/index.js.
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const server = express();
// Mirror Vercel: files in public/uploads win over images stored in the database.
server.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
server.use(app);

server.listen(PORT, () => {
  console.log(`House of 8 backend → http://localhost:${PORT}`);
});
