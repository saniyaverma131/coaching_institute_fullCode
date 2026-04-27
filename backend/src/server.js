import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import sequelize from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import commonRoutes from './routes/common.routes.js';
import adminRoutes from './routes/admin.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import studentRoutes, { downloadNote, downloadCertificate } from './routes/student.routes.js';
import { authenticate, loadUser } from './middleware/auth.js';
import { uploadsDir } from './middleware/upload.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const uploadPath = uploadsDir();
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
app.use('/uploads', express.static(uploadPath));

app.get('/api/health', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ ok: true, database: 'connected' });
  } catch (e) {
    res.status(503).json({ ok: false, error: e.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api', commonRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

app.get('/api/download/note/:id', authenticate, loadUser, downloadNote);
app.get('/api/download/certificate/:id', authenticate, loadUser, downloadCertificate);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

async function start() {
  try {
    await sequelize.authenticate();
    app.listen(PORT, () => {
      console.log(`Coaching API http://localhost:${PORT}`);
      console.log(`Db connected successfully`);
    });
  } catch (e) {
    console.error('Failed to start:', e);
    process.exit(1);
  }
}

start();
