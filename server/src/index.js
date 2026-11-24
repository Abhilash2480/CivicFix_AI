import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import complaintRoutes from './routes/complaints.js';
import { errorHandler } from './middleware/errors.js';

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.resolve(here, '../uploads'));
const clientDist = path.resolve(here, '../../client/dist');
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'], imgSrc: ["'self'", 'data:', 'blob:'],
    mediaSrc: ["'self'", 'blob:'], connectSrc: ["'self'"], objectSrc: ["'none'"], baseUri: ["'self'"], frameAncestors: ["'none'"]
  } }
}));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(uploadDir));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }), authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api', (_req, res) => res.status(404).json({ message: 'Endpoint not found.' }));
app.use('/uploads', (_req, res) => res.status(404).json({ message: 'Uploaded media not found.' }));
app.use(express.static(clientDist));
app.get('*', (_req, res, next) => res.sendFile(path.join(clientDist, 'index.html'), (error) => error && next(error)));
app.use((_req, res) => res.status(404).json({ message: 'Page not found.' }));
app.use(errorHandler);

const port = Number(process.env.PORT || 5000);
if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required. Copy .env.example to server/.env and configure it.');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(port, () => console.log(`CivicFix API listening on ${port}`)))
  .catch((error) => { console.error('MongoDB connection failed:', error.message); process.exit(1); });
