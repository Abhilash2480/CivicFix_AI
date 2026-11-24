import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

if (!process.env.MONGODB_URI || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error('Set MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD in server/.env.');
if (process.env.ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
await mongoose.connect(process.env.MONGODB_URI);
const email = process.env.ADMIN_EMAIL.toLowerCase().trim();
const existing = await User.findOne({ email });
if (existing && existing.role !== 'admin') throw new Error('That email belongs to a citizen account; choose another admin email.');
if (existing) { existing.password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12); existing.name = process.env.ADMIN_NAME || existing.name; await existing.save(); }
else await User.create({ name: process.env.ADMIN_NAME || 'Administrator', email, password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12), role: 'admin' });
console.log(`Admin account ready: ${email}`);
await mongoose.disconnect();
