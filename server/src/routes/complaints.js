import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import Complaint, { categories, statuses } from '../models/Complaint.js';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { analyzeImage } from '../services/vision.js';

const router = Router();
const mediaTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/mov', 'video/quicktime']);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 14 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  if (!mediaTypes.has(file.mimetype)) return cb(Object.assign(new Error('Choose a JPEG, PNG, WebP, MP4, WebM, or MOV file.'), { status: 400 }));
  cb(null, true);
} });
router.use(protect);

router.post('/analyze', upload.single('image'), async (req, res, next) => {
  try { if (!req.file) return res.status(400).json({ message: 'Choose an image or video to analyze.' }); res.json({ analysis: await analyzeImage(req.file) }); }
  catch (error) { next(error); }
});

router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    const { title, description, category, location, severity, latitude, longitude, analysis } = req.body;
    if (!req.file || !title?.trim() || !description?.trim() || !location?.trim()) return res.status(400).json({ message: 'Photo or video, title, description and location are required.' });
    if (!categories.includes(category)) return res.status(400).json({ message: 'Choose a valid complaint category.' });
    if (!['Low', 'Medium', 'High'].includes(severity)) return res.status(400).json({ message: 'Choose a valid severity.' });
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads')); await fs.mkdir(uploadDir, { recursive: true });
    const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/mov': '.mov', 'video/quicktime': '.mov' };
    const extension = extensions[req.file.mimetype];
    const filename = `${crypto.randomUUID()}${extension}`;
    await fs.writeFile(path.join(uploadDir, filename), req.file.buffer, { flag: 'wx' });
    let aiAnalysis = {};
    try { aiAnalysis = JSON.parse(analysis || '{}'); } catch { aiAnalysis = {}; }
    const complaint = await Complaint.create({ userId: req.auth.id, title: title.trim(), description: description.trim(), category, severity, location: location.trim(), latitude: Number(latitude) || undefined, longitude: Number(longitude) || undefined, imageUrl: `/uploads/${filename}`, mediaType: req.file.mimetype.startsWith('video/') ? 'video' : 'image', aiAnalysis: { detectedIssue: String(aiAnalysis.detectedIssue || '').slice(0, 160), description: String(aiAnalysis.description || '').slice(0, 500), confidence: Math.max(0, Math.min(1, Number(aiAnalysis.confidence) || 0)) } });
    res.status(201).json({ complaint });
  } catch (error) { next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const filter = req.auth.role === 'admin' ? {} : { userId: req.auth.id };
    if (req.query.category && categories.includes(req.query.category)) filter.category = req.query.category;
    if (req.query.severity && ['Low', 'Medium', 'High'].includes(req.query.severity)) filter.severity = req.query.severity;
    if (req.query.status && statuses.includes(req.query.status)) filter.status = req.query.status;
    if (req.query.search) filter.complaintId = { $regex: String(req.query.search).slice(0, 40), $options: 'i' };
    const complaints = await Complaint.find(filter).populate('userId', 'name email').sort({ createdAt: -1 }).limit(200).lean();
    res.json({ complaints });
  } catch (error) { next(error); }
});

router.get('/stats', async (req, res, next) => {
  try {
    const match = req.auth.role === 'admin' ? {} : { userId: (await User.findById(req.auth.id).select('_id'))._id };
    const [total, pending, inProgress, resolved, highPriority] = await Promise.all([
      Complaint.countDocuments(match), Complaint.countDocuments({ ...match, status: { $in: ['Submitted', 'Under Review'] } }),
      Complaint.countDocuments({ ...match, status: 'In Progress' }), Complaint.countDocuments({ ...match, status: 'Resolved' }),
      Complaint.countDocuments({ ...match, severity: 'High', status: { $nin: ['Resolved', 'Rejected'] } })
    ]);
    res.json({ stats: { total, pending, inProgress, resolved, highPriority } });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const query = { $or: [{ complaintId: req.params.id }, ...(req.params.id.match(/^[a-f\d]{24}$/i) ? [{ _id: req.params.id }] : [])] };
    if (req.auth.role !== 'admin') query.userId = req.auth.id;
    const complaint = await Complaint.findOne(query).populate('userId', 'name email');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
    res.json({ complaint });
  } catch (error) { next(error); }
});

router.patch('/:id', adminOnly, async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.status !== undefined) { if (!statuses.includes(req.body.status)) return res.status(400).json({ message: 'Choose a valid status.' }); updates.status = req.body.status; }
    if (req.body.adminRemarks !== undefined) { if (String(req.body.adminRemarks).length > 1000) return res.status(400).json({ message: 'Remarks must be 1000 characters or fewer.' }); updates.adminRemarks = String(req.body.adminRemarks); }
    if (req.body.category !== undefined) { if (!categories.includes(req.body.category)) return res.status(400).json({ message: 'Choose a valid category.' }); updates.category = req.body.category; }
    if (req.body.severity !== undefined) { if (!['Low', 'Medium', 'High'].includes(req.body.severity)) return res.status(400).json({ message: 'Choose a valid severity.' }); updates.severity = req.body.severity; }
    const complaint = await Complaint.findOneAndUpdate({ $or: [{ complaintId: req.params.id }, ...(req.params.id.match(/^[a-f\d]{24}$/i) ? [{ _id: req.params.id }] : [])] }, updates, { new: true, runValidators: true }).populate('userId', 'name email');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
    res.json({ complaint });
  } catch (error) { next(error); }
});
export default router;
