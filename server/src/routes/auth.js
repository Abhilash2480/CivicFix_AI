import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = Router();
function session(user) {
  const token = jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } };
}
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
    if (name.trim().length > 80 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 72)
      return res.status(400).json({ message: 'Use a valid email, a name under 80 characters, and a password of 8–72 characters.' });
    if (await User.exists({ email: email.toLowerCase().trim() })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = await User.create({ name: name.trim(), email, password: await bcrypt.hash(password, 12), role: 'citizen' });
    res.status(201).json(session(user));
  } catch (error) { next(error); }
});
async function loginForRole(req, res, next, role) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase().trim() }).select('+password');
    if (!user || user.role !== role || !await bcrypt.compare(password || '', user.password)) return res.status(401).json({ message: 'Email or password is incorrect.' });
    res.json(session(user));
  } catch (error) { next(error); }
}
router.post('/login', (req, res, next) => loginForRole(req, res, next, 'citizen'));
router.post('/admin/login', (req, res, next) => loginForRole(req, res, next, 'admin'));
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.id).select('name email role');
    if (!user) return res.status(401).json({ message: 'Account not found.' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { next(error); }
});
export default router;
